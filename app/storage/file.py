import logging
import os
import shutil

from django.conf import settings

logger = logging.getLogger("django")


class FileAssetStorageDriver:
    def get_local_file_path(id, size):
        return os.path.realpath(os.path.join(settings.DIRS["media"], f"{id}_{size}"))

    def exists(asset_id, size):
        return os.path.isfile(
            FileAssetStorageDriver.get_local_file_path(asset_id, size)
        )

    def store(asset, image_path, size):
        if not asset.is_valid():
            raise Exception("Invalid asset for storing")
        file = FileAssetStorageDriver.get_local_file_path(asset.id, size)
        shutil.copyfile(image_path, file)

    def render(asset, size):
        from django.http import HttpResponse, HttpResponseNotFound

        # placeholder to store eventual path to the temp file storing the asset's binary data
        asset_path = None

        try:
            if not FileAssetStorageDriver.exists(asset.id, size):
                # if the original file doesn't exist, raise exceptions to trigger a 404
                if size == "original":
                    raise Exception(f"Missing asset data for asset: {asset.id} {size}")

                # if a thumbnail etc. is requested, try to build it
                asset_path = FileAssetStorageDriver.build_size(asset, size)
            else:
                asset_path = FileAssetStorageDriver.get_local_file_path(asset.id, size)
        except Exception as e:
            logger.error(e)
            return HttpResponseNotFound()

        if not os.path.isfile(asset_path):
            return HttpResponseNotFound()

        filesize_bytes = os.path.getsize(asset_path)
        with open(asset_path, "rb") as asset_file:
            asset_response = HttpResponse(asset_file.read())
            asset_response["Content-Type"] = asset.get_mime_type()
            asset_response["Content-Disposition"] = "inline"
            asset_response["filename"] = asset.title
            asset_response["Content-Length"] = filesize_bytes
            asset_response["Content-Transfer-Encoding"] = "binary"
            asset_response["Cache-Control"] = {"max-age": 31536000}

            return asset_response

    def handle_uploaded_file(asset, uploaded_file):
        write_path = FileAssetStorageDriver.get_local_file_path(asset.id, "original")

        with open(write_path, "wb+") as file_out:
            for chunk in uploaded_file.chunks():
                file_out.write(chunk)

    # Build a specified size of an asset; either 'original', 'large', or 'thumbnail'
    def build_size(asset, size):
        from PIL import Image

        crop = size == "thumbnail"
        target_size = None
        if size == "thumbnail":
            target_size = 75
        elif size == "large":
            target_size = 1024
        else:
            raise Exception(f"Asset size not supported: '{size}'")

        # TODO: lock the original asset for processing if necessary
        original_asset_path = FileAssetStorageDriver.get_local_file_path(
            asset.id, "original"
        )

        img = Image.open(original_asset_path)
        new_size = (0, 0)
        # if the image is wider than it is tall, constrain height
        original_width, original_height = img.size
        if original_width > original_height:
            new_size = (
                int(target_size * original_width / original_height),
                target_size,
            )
        # otherwise constrain width
        else:
            new_size = (
                target_size,
                int(target_size * original_height / original_width),
            )

        img = img.resize(new_size, Image.LANCZOS)
        # likewise, FuelPHP's Image class would crop from the center and do the math for us
        # with Pillow, we're not so lucky
        if crop:
            new_width, new_height = img.size
            crop_dimensions = (
                (new_width - target_size) / 2,
                (new_height - target_size) / 2,
                (new_width + target_size) / 2,
                (new_height + target_size) / 2,
            )
            img = img.crop(crop_dimensions)

        resized_asset_path = FileAssetStorageDriver.get_local_file_path(
            asset.id, "thumbnail"
        )

        new_file_format = asset.file_type.upper()
        # Pillow does not recognize 'JPG' as a valid file format
        if new_file_format == "JPG":
            new_file_format = "JPEG"
        img.save(resized_asset_path, format=new_file_format)

        return resized_asset_path

    def migrate_to(driver, cleanup_delete=False):
        from core.models import Asset

        if driver == "s3":
            from .s3 import S3AssetStorageDriver

            s3_client = S3AssetStorageDriver.get_s3(True)
            for asset_filename in os.listdir(settings.DIRS["media"]):
                # this will always be there, ignore it
                if asset_filename == "uploads":
                    continue

                asset_id, size = asset_filename.split("_")
                asset_full_path = FileAssetStorageDriver.get_local_file_path(
                    asset_id, size
                )

                try:
                    asset_obj = Asset.objects.get(id=asset_id)
                    s3_client.upload_file(
                        Filename=asset_full_path,
                        Bucket=settings.DRIVER_SETTINGS["s3"]["bucket"],
                        Key=S3AssetStorageDriver.get_key_name(asset_id, size),
                        ExtraArgs={"ContentType": asset_obj.get_mime_type()},
                    )
                    if cleanup_delete:
                        os.remove(asset_full_path)
                except Asset.DoesNotExist:
                    logger.error(
                        f"File {asset_filename} has no corresponding Asset object"
                    )
                    continue

        elif driver == "db":
            from .db import DBAssetStorageDriver

            for asset_filename in os.listdir(settings.DIRS["media"]):
                # this will always be there, ignore it
                if asset_filename == "uploads":
                    continue

                asset_id, size = asset_filename.split("_")

                # DB only stores originals, ignore others
                if size != "original":
                    # Unless we're getting rid of everything as we go
                    # Delete the file so it's not lingering after the original is migrated
                    if cleanup_delete:
                        extra_asset_path = FileAssetStorageDriver.get_local_file_path(
                            asset_id, size
                        )
                        os.remove(extra_asset_path)
                    else:
                        continue
                try:
                    asset_obj = Asset.objects.get(id=asset_id)
                    asset_full_path = FileAssetStorageDriver.get_local_file_path(
                        asset_id, "original"
                    )

                    DBAssetStorageDriver.store(asset_obj, asset_full_path, "original")
                    if cleanup_delete:
                        os.remove(asset_full_path)
                except Asset.DoesNotExist:
                    logger.error(
                        f"File {asset_filename} has no corresponding Asset object"
                    )
                    continue
        else:
            raise Exception("File Driver: Invalid driver option selected for migration")
