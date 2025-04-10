import io
import logging
import os
import tempfile

import boto3
import botocore
from django.conf import settings
from django.http import HttpResponseRedirect

logger = logging.getLogger("django")


class S3AssetStorageDriver:

    def get_key_name(id, size):
        subdir = settings.DRIVER_SETTINGS["s3"]["subdir"]
        return os.path.join(subdir or "", f"{id}_{size}")

    def get_view_url(id, size):
        return f"{settings.DRIVER_SETTINGS["s3"]["view_url"]}{id}_{size}"

    def get_client():
        s = settings.DRIVER_SETTINGS["s3"]

        config = {"region_name": s["region"]}

        # Endpoint config is only required for fakeS3 - the param is not required for actual S3 on AWS
        if "fakes3_enabled" in s and s["fakes3_enabled"]:
            config["endpoint_url"] = settings.DRIVER_SETTINGS["s3"]["endpoint"]

        if "force_path_style" in s and s["force_path_style"]:
            config["s3"] = {"addressing_style": "path"}

        try:
            # Configure credentials depending on whether we're providing them from env or Amazon's IMDSv2 service
            # IMDS is HIGHLY recommended for prod usage on AWS
            if s["credential_provider"] == "imds":
                # Credentials are sourced from the EC2 instance's IAM role
                session = boto3.Session()
                return session.resource("s3", **config)
            elif s["credential_provider"] == "env":
                config["aws_access_key_id"] = settings.DRIVER_SETTINGS["s3"]["key"]
                config["aws_secret_access_key"] = settings.DRIVER_SETTINGS["s3"][
                    "secret_key"
                ]
                config["aws_session_token"] = (
                    settings.DRIVER_SETTINGS["s3"]["token"] or None
                )
                return boto3.resource("s3", **config)
            else:
                raise Exception(
                    "S3: Failed to determine credential provider. Did you set the appropriate environment variable?"
                )
        except Exception as e:
            logger.error("S3: Failed to create S3 resource.")
            logger.error(e)

    def store(asset, image_path, size):
        if not asset.is_valid():
            raise Exception("Invalid asset for storing")
        key = S3AssetStorageDriver.get_key_name(asset.id, size)
        bucket = settings.DRIVER_SETTINGS["s3"]["bucket"]

        # TODO: tie these to an env variable to verbosely log S3 actions, or just toss them?
        # logger.info(f"Storing asset data in s3: {key} ({asset.get_mime_type()})")
        # logger.info(f"Asset data path: {image_path}")
        # logger.info(f"Size: {size}")
        # logger.info(f"Bucket: {bucket}")
        # logger.info(f"Asset file_size: {asset.file_size}")

        try:
            with open(image_path, "rb") as source_file:
                s3 = S3AssetStorageDriver.get_client()
                s3.Object(bucket, key).put(
                    Body=source_file, ContentType=asset.get_mime_type()
                )
        except Exception as e:
            logger.error(f"S3: Failed to store asset {key}")
            logger.error(e)

    def exists(id, size):
        s3 = S3AssetStorageDriver.get_client()
        try:
            s3.Object(
                settings.DRIVER_SETTINGS["s3"]["bucket"], f"media/{id}_{size}"
            ).load()
            return True
        except botocore.exceptions.ClientError as e:
            if e.response["Error"]["Code"] == "404":
                return False
            else:
                logger.error("S3 exists check error")
                logger.error(e)

    def handle_uploaded_file(asset, uploaded_file):
        temporary_file = tempfile.NamedTemporaryFile(dir=tempfile.gettempdir())

        if os.path.isfile(temporary_file.name):
            temporary_file.close()

        with open(temporary_file.name, "wb+") as tmp:
            for chunk in uploaded_file.chunks():
                tmp.write(chunk)

        S3AssetStorageDriver.store(asset, temporary_file.name, "original")
        os.remove(temporary_file.name)

    def render(asset, size):
        from django.http import HttpResponseNotFound

        # placeholder to store eventual path to the temp file storing the asset's binary data
        asset_url = None

        try:
            if not S3AssetStorageDriver.exists(asset.id, size):
                # if the original file doesn't exist, raise exceptions to trigger a 404
                if size == "original":
                    raise Exception(f"Missing asset data for asset: {asset.id} {size}")

                # if a thumbnail etc. is requested, try to build it
                asset_url = S3AssetStorageDriver.build_size(asset, size)
            else:
                asset_url = S3AssetStorageDriver.get_view_url(asset.id, size)
        except Exception as e:
            logger.error(e)
            return HttpResponseNotFound()

        return HttpResponseRedirect(asset_url)

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

        # Ideally the byte value of the object is read into Pillow
        #  rather than stored on disk temporarily, then the resulting
        #  thumbnail is written directly to S3 instead of being stored
        #  on disk temporarily

        s3 = S3AssetStorageDriver.get_client()
        key = S3AssetStorageDriver.get_key_name(asset.id, "original")
        bucket = settings.DRIVER_SETTINGS["s3"]["bucket"]

        temporary_file = tempfile.NamedTemporaryFile(dir=tempfile.gettempdir())

        if os.path.isfile(temporary_file.name):
            temporary_file.close()

        # download original asset to temp location
        s3.Bucket(bucket).download_file(key, temporary_file.name)

        img = Image.open(temporary_file.name)

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

        new_file_format = asset.file_type.upper()
        # Pillow does not recognize 'JPG' as a valid file format
        if new_file_format == "JPG":
            new_file_format = "JPEG"

        try:
            new_bytes = io.BytesIO()
            img.save(new_bytes, format=new_file_format)

            new_bytes.seek(0)

            new_key = S3AssetStorageDriver.get_key_name(asset.id, size)
            put_data = {
                "Body": new_bytes.getvalue(),
                "ContentType": asset.get_mime_type(),
                "ContentLength": new_bytes.getbuffer().nbytes,
            }

            s3.Object(bucket, new_key).put(**put_data)

            os.remove(temporary_file.name)

            return S3AssetStorageDriver.get_view_url(asset.id, size)
        except Exception as e:
            os.remove(temporary_file.name)
            logger.info("Error saving new size to S3")
            logger.info(e)
