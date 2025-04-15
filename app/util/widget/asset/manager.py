import importlib
import logging
import os

import magic
from django.conf import settings
from util.perm_manager import PermManager
from util.widget.validator import ValidatorUtil

logger = logging.getLogger("django")


class AssetManager:
    def update_asset(asset_id, properties=[]):
        pass

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

    def get_assets_by_user(user_id, perm_type):
        # importing per-method to avoid circular imports
        from core.models import Asset, PermObjectToUser

        perms = PermManager.get_all_objects_of_type_for_user(
            user_id, PermObjectToUser.ObjectType.ASSET.value, [perm_type]
        )
        # TODO: probably a cleaner ORM-only way of doing this?
        ids = list(map(lambda p: p.object_id, perms))
        assets = []
        if len(ids) == 0:
            return []
        for asset in Asset.objects.filter(id__in=ids):
            if perm_type is PermObjectToUser.Perm.VISIBLE:
                asset.is_shared = True
            assets.append(asset)
        return assets

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
        # importing per-method to avoid circular imports
        from core.models import PermObjectToUser

        assets = AssetManager.get_assets_by_user(
            user_id, PermObjectToUser.Perm.FULL.value
        )
        total_used = 0
        for asset in assets:
            total_used = total_used + asset.file_size
        return total_used

    def get_asset_storage_driver(driver=None):
        target_driver = driver if driver else settings.MEDIA_DRIVER
        driver_module_name = f"storage.{target_driver}"
        driver_class_name = settings.DRIVER_SETTINGS[target_driver]["class"]

        driver_module = importlib.import_module(driver_module_name)
        driver_class = getattr(driver_module, driver_class_name)

        return driver_class
