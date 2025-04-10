import importlib
import logging
import os

import magic
from core.models import Asset, ObjectPermission, User
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from util.widget.validator import ValidatorUtil

logger = logging.getLogger("django")


class AssetManager:
    # old method for server upload storage
    # differences from PHP - including file path separate from file info
    #  as those data points are not part of the same source, also allowing
    #  for a user to be provided if this is called from a media upload action
    def new_asset_from_file(name, file_info, file_path, user=None):
        # importing per-method to avoid circular imports
        from core.models import Asset

        # does this user still have storage space left?
        if not AssetManager.user_has_space_for(user, file_info.st_size):
            return False

        mime_type = magic.from_file(file_path, mime=True)
        extension = Asset.get_type_from_mime_type(mime_type)
        if not bool(extension):
            return False

        # create and store the asset
        asset = Asset()
        asset.file_type = extension
        asset.title = name
        asset.file_size = file_info.st_size

        # try to save the asset and move it
        if asset.db_store(user) and ValidatorUtil.is_valid_hash(asset.id):
            try:
                # copy the file to its permanent home with an appropriate name
                AssetManager.get_asset_storage_driver().store(
                    asset, file_path, "original"
                )
                # remove the original
                os.remove(file_path)

                # make sure the user doing this has permissions to the new file, if applicable
                # TODO: do this
                if user:
                    pass
                return asset
            except Exception as e:
                logger.info("ASSET STORAGE ERROR")
                logger.info(e)
                pass

            # something failed in the above block, remove the asset
            asset.db_remove()

        return asset

    def user_has_space_for(user, number_bytes):
        # NOTE: this technically allows an infinite number of unowned assets
        # it isn't necessarily safe, and we may want to revisit this later
        if user is None:
            return True
        stats = AssetManager.get_user_asset_stats(user.id)
        return stats["kb_used"] + (number_bytes / 1024) < stats["kb_available"]

    def get_user_asset_stats(user_id):
        from math import floor

        # NOTE: kb_available is the total amount any user may use, not what is left of their storage
        return {
            "kb_used": floor(AssetManager.get_user_disk_usage(user_id) / 1024),
            "kb_available": settings.MEDIA_QUOTA * 1024,
        }

    def get_user_disk_usage(user_id):
        user = User.objects.get(id=user_id)
        asset_type = ContentType.objects.get(app_label="core", model="asset")
        assets = Asset.objects.filter(
            id__in=ObjectPermission.objects.filter(
                content_type=asset_type, user=user
            ).values_list("object_id", flat=True)
        )

        total_used = 0
        for asset in assets:
            total_used = total_used + asset.file_size
        return total_used

    def get_asset_storage_driver():
        driver_module_name = f"storage.{settings.MEDIA_DRIVER}"
        driver_class_name = settings.DRIVER_SETTINGS[settings.MEDIA_DRIVER]["class"]

        driver_module = importlib.import_module(driver_module_name)
        driver_class = getattr(driver_module, driver_class_name)

        return driver_class
