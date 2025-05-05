import hashlib
import io
import logging
import os
from datetime import datetime

from django.conf import settings

logger = logging.getLogger("django")


class DBAssetStorageDriver:
    def exists(asset_id, size):
        from core.models import AssetData

        try:
            return AssetData.objects.filter(id=asset_id, size=size).count() > 0
        except AssetData.DoesNotExist:
            return False

    def store(asset, asset_path, size):
        from core.models import AssetData

        if not asset.is_valid():
            raise Exception("Invalid asset for storing")

        try:
            with open(asset_path, "rb") as source_file:
                file_contents = source_file.read()

                data_obj = AssetData()
                data_obj.id = asset.id
                data_obj.file_type = asset.file_type
                data_obj.status = "ready"
                data_obj.size = size
                data_obj.bytes = os.path.getsize(asset_path)
                data_obj.hash = hashlib.sha1(file_contents).hexdigest()
                data_obj.data = file_contents
                data_obj.created_at = datetime.now()

                data_obj.save()
        except Exception as e:
            logger.error(f"Exception while storing asset data for asset {asset.id}")
            logger.error(e)

    def render(asset, size):
        from core.models import AssetData
        from django.http import HttpResponse, HttpResponseNotFound

        # # placeholder to store eventual path to the temp file storing the asset's binary data
        asset_bytes = None

        try:
            if not DBAssetStorageDriver.exists(asset.id, size):
                # if the original file doesn't exist, raise exceptions to trigger a 404
                if size == "original":
                    raise Exception(f"Missing asset data for asset: {asset.id} {size}")

                # if a thumbnail etc. is requested, try to build it
                asset_bytes = DBAssetStorageDriver.build_size(asset, size)
            else:
                asset_obj = AssetData.objects.get(id=asset.id, size=size)
                asset_bytes = asset_obj.data
        except Exception as e:
            logger.error(e)
            return HttpResponseNotFound()

        asset_response = HttpResponse(asset_bytes)
        asset_response["Content-Type"] = asset.get_mime_type()
        asset_response["Content-Disposition"] = "inline"
        asset_response["filename"] = asset.title
        asset_response["Content-Length"] = len(asset_bytes)
        asset_response["Content-Transfer-Encoding"] = "binary"
        asset_response["Cache-Control"] = {"max-age": 31536000}

        return asset_response

    def handle_uploaded_file(asset, uploaded_file):
        from core.models import AssetData

        try:
            file_contents = uploaded_file.read()

            data_obj = AssetData()
            data_obj.id = asset.id
            data_obj.type = asset.file_type
            data_obj.status = "ready"
            data_obj.size = "original"
            data_obj.bytes = len(uploaded_file)
            data_obj.hash = hashlib.sha1(file_contents).hexdigest()
            data_obj.data = file_contents
            data_obj.created_at = datetime.now()

            data_obj.save()
        except Exception as e:
            logger.error("DB driver file upload error")
            logger.error(e)

    # Build a specified size of an asset; either 'original', 'large', or 'thumbnail'
    def build_size(asset, size):
        from core.models import AssetData
        from PIL import Image

        crop = size == "thumbnail"
        target_size = None
        if size == "thumbnail":
            target_size = 75
        elif size == "large":
            target_size = 1024
        else:
            raise Exception(f"Asset size not supported: '{size}'")

        original_obj = AssetData.objects.get(id=asset.id, size="original")
        original_bytes = original_obj.data

        img = Image.open(io.BytesIO(original_bytes))
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

        resized_bytes = io.BytesIO()

        new_file_format = asset.file_type.upper()
        # Pillow does not recognize 'JPG' as a valid file format
        if new_file_format == "JPG":
            new_file_format = "JPEG"
        img.save(resized_bytes, format=new_file_format)

        resized_bytes.seek(0)

        return resized_bytes.getvalue()

    def migrate_to(driver, cleanup_delete=False):
        from core.models import Asset, AssetData

        if driver == "s3":
            from .s3 import S3AssetStorageDriver

            s3_client = S3AssetStorageDriver.get_s3(True)
            for asset_data in AssetData.objects.all():
                asset_bytes = io.BytesIO(asset_data.data)
                asset_bytes.seek(0)
                s3_client.upload_fileobj(
                    Fileobj=asset_bytes,
                    Bucket=settings.DRIVER_SETTINGS["s3"]["bucket"],
                    Key=S3AssetStorageDriver.get_key_name(asset_data.id, "original"),
                    ExtraArgs={
                        "ContentType": Asset.MIME_TYPE_FROM_EXTENSION[
                            asset_data.file_type
                        ]
                    },
                )
                if cleanup_delete:
                    asset_data.delete()

        elif driver == "file":
            from .file import FileAssetStorageDriver

            for asset_data in AssetData.objects.all():
                asset_path = FileAssetStorageDriver.get_local_file_path(
                    asset_data.id, asset_data.size
                )

                with open(asset_path, "wb") as asset_file:
                    asset_file.write(asset_data.data)

                if cleanup_delete:
                    asset_data.delete()
        else:
            raise Exception("DB Driver: Invalid driver option selected for migration")
