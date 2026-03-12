import io
import logging
import os
import tempfile
import threading

import boto3
import botocore
from django.conf import settings
from django.http import HttpResponseNotFound, HttpResponseRedirect

logger = logging.getLogger(__name__)

# Thread-safe cache for S3 clients and resources
_s3_cache_lock = threading.Lock()
_s3_client_cache = None
_s3_resource_cache = None
_s3_cache_config = None


class S3AssetStorageDriver:

    @staticmethod
    def get_key_name(id, size):
        subdir = settings.DRIVER_SETTINGS["s3"]["subdir"]
        return os.path.join(subdir or "", f"{id}_{size}")

    @staticmethod
    def get_view_url(id, size):

        # presigned urls work, but for fakes3 let's just return an unsigned path
        if settings.DRIVER_SETTINGS["s3"]["fakes3_enabled"]:
            host = settings.DRIVER_SETTINGS["s3"]["fakes3_host"]
            bucket = settings.DRIVER_SETTINGS["s3"]["bucket"]
            subdir = settings.DRIVER_SETTINGS["s3"]["subdir"]
            return f"{host}/{bucket}/{subdir}/{id}_{size}"

        # assets served from cloudfront
        if settings.DRIVER_SETTINGS["s3"]["use_cdn"]:
            return f"https://{settings.DRIVER_SETTINGS["s3"]["cdn_domain"]}/{id}_{size}"

        # assets served directly from the s3 bucket via presigned URLs
        try:
            client = S3AssetStorageDriver.get_s3(True)
            url = client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": settings.DRIVER_SETTINGS["s3"]["bucket"],
                    "Key": S3AssetStorageDriver.get_key_name(id, size),
                },
                ExpiresIn=3600,
            )
            return url
        except Exception:
            return HttpResponseNotFound()

    @staticmethod
    def get_s3(get_client=False):
        """
        Get a cached S3 client or resource, or create them if not available in cache
        """
        global _s3_client_cache, _s3_resource_cache, _s3_cache_config, _s3_cache_lock

        s = settings.DRIVER_SETTINGS["s3"]

        # Create a hashable config tuple to detect if settings have changed
        current_config = (
            s.get("credential_provider"),
            s.get("region"),
            s.get("endpoint"),
            s.get("bucket"),
            s.get("fakes3_enabled", False),
            s.get("force_path_style", False),
            s.get("key"),
            s.get("secret_key"),
        )

        # Thread-safe cache check and initialization
        with _s3_cache_lock:
            # If config changed, invalidate cache
            if _s3_cache_config != current_config:
                _s3_client_cache = None
                _s3_resource_cache = None
                _s3_cache_config = current_config

            # Return cached client/resource if available
            if get_client and _s3_client_cache is not None:
                return _s3_client_cache
            elif not get_client and _s3_resource_cache is not None:
                return _s3_resource_cache

            # Create new session and client/resource
            # We only cache the client/resource objects created from it
            try:
                # Configure credentials depending on whether we're providing them from env or Amazon's IMDSv2 service
                # IMDS is HIGHLY recommended for prod usage on AWS
                session = None
                if s["credential_provider"] == "imds":
                    # Credentials are sourced from the EC2 instance's IAM role
                    session = boto3.Session()
                elif s["credential_provider"] == "env":
                    session_config = {
                        "region_name": s["region"],
                        "aws_access_key_id": s["key"],
                        "aws_secret_access_key": s["secret_key"],
                    }
                    session = boto3.Session(**session_config)
                else:
                    raise Exception(
                        "S3: Failed to determine credential provider. Did you set the appropriate environment variable?"
                    )
            except Exception:
                logger.error("S3: Failed to create S3 session.", exc_info=True)
                raise

            s3_config = {}
            # Endpoint config is only required for fakeS3 - the param is not required for actual S3 on AWS
            if "fakes3_enabled" in s and s["fakes3_enabled"]:
                s3_config["endpoint_url"] = s["endpoint"]

            if "force_path_style" in s and s["force_path_style"]:
                s3_config["s3"] = {"addressing_style": "path"}

            # Cache the client or resource (thread-safe objects)
            # The session object is discarded after this and not cached
            if get_client:
                _s3_client_cache = session.client("s3", **s3_config)
                return _s3_client_cache
            else:
                _s3_resource_cache = session.resource("s3", **s3_config)
                return _s3_resource_cache

    @staticmethod
    def store(asset, image_path, size):
        if not asset.is_valid():
            raise Exception("Invalid asset for storing")

        key = S3AssetStorageDriver.get_key_name(asset.id, size)

        try:
            s3_client = S3AssetStorageDriver.get_s3(True)
            s3_client.upload_file(
                Filename=image_path,
                Bucket=settings.DRIVER_SETTINGS["s3"]["bucket"],
                Key=key,
                ExtraArgs={"ContentType": asset.get_mime_type()},
            )
        except Exception:
            logger.error("S3: Failed to store asset %s", key, exc_info=True)

    @staticmethod
    def exists(id, size):
        s3_resource = S3AssetStorageDriver.get_s3()
        try:
            s3_resource.Object(
                settings.DRIVER_SETTINGS["s3"]["bucket"], f"media/{id}_{size}"
            ).load()
            return True
        except botocore.exceptions.ClientError as e:
            if e.response["Error"]["Code"] == "404":
                return False
            else:
                logger.error("S3 exists check error", exc_info=True)

    @staticmethod
    def handle_uploaded_file(asset, uploaded_file):
        s3_client = S3AssetStorageDriver.get_s3(True)
        uploaded_file.seek(0)

        # Need to use a file buffer in order to access the original file again after uploading to S3
        file_bytes = uploaded_file.read()
        file_buffer = io.BytesIO(file_bytes)

        file_buffer.seek(0)
        s3_client.upload_fileobj(
            Fileobj=file_buffer,
            Bucket=settings.DRIVER_SETTINGS["s3"]["bucket"],
            Key=S3AssetStorageDriver.get_key_name(asset.id, "original"),
            ExtraArgs={"ContentType": asset.get_mime_type()},
        )
        # Upload the thumbnail
        thumbnail_buffer = io.BytesIO(file_bytes)
        S3AssetStorageDriver.build_size(asset, "thumbnail", s3_client, thumbnail_buffer)

    @staticmethod
    def render(asset, size):
        from django.http import HttpResponseNotFound

        # placeholder to store eventual path to the temp file storing the asset's binary data
        asset_url = None
        s3_client = S3AssetStorageDriver.get_s3(True)
        try:
            if not S3AssetStorageDriver.exists(asset.id, size):
                # if the original file doesn't exist, raise exceptions to trigger a 404
                if size == "original":
                    raise Exception(f"Missing asset data for asset: {asset.id} {size}")

                # if a thumbnail etc. is requested, try to build it
                asset_url = S3AssetStorageDriver.build_size(asset, size, s3_client)
            else:
                asset_url = S3AssetStorageDriver.get_view_url(asset.id, size)
        except Exception as e:
            logger.error(e, exc_info=True)
            return HttpResponseNotFound()

        return HttpResponseRedirect(asset_url)

    @staticmethod
    def build_size(asset, size, client, uploaded_file=None):
        from PIL import Image

        # Get the correct file size
        crop = size == "thumbnail"
        target_size = None
        if size == "thumbnail":
            target_size = 75
        elif size == "large":
            target_size = 1024
        else:
            raise Exception(f"Asset size not supported: '{size}'")

        # Get image from the uploaded file or get the the file from the asset id
        img = None
        temporary_file = None
        if uploaded_file:
            uploaded_file.seek(0)
            img = Image.open(uploaded_file)
        else:
            key = S3AssetStorageDriver.get_key_name(asset.id, "original")
            bucket = settings.DRIVER_SETTINGS["s3"]["bucket"]

            temporary_file = tempfile.NamedTemporaryFile(dir=tempfile.gettempdir())
            if os.path.isfile(temporary_file.name):
                temporary_file.close()
            client.download_file(bucket, key, temporary_file.name)
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

            client.upload_fileobj(
                Fileobj=new_bytes,
                Bucket=settings.DRIVER_SETTINGS["s3"]["bucket"],
                Key=S3AssetStorageDriver.get_key_name(asset.id, size),
                ExtraArgs={"ContentType": asset.get_mime_type()},
            )

            if temporary_file and not uploaded_file:
                os.remove(temporary_file.name)

            return S3AssetStorageDriver.get_view_url(asset.id, size)
        except Exception:
            if temporary_file and not uploaded_file:
                os.remove(temporary_file.name)
            logger.error(
                "Error saving thumbnail to S3",
                exc_info=True,
            )

    @staticmethod
    def migrate_to(driver, cleanup_delete=False):
        if driver == "file":
            from .file import FileAssetStorageDriver

            s = settings.DRIVER_SETTINGS["s3"]

            s3_resource = S3AssetStorageDriver.get_s3()
            bucket = s3_resource.Bucket(s["bucket"])
            for obj in bucket.objects.all():
                # stripping the folder prefix from the filename, if there is one
                filename = obj.key
                if "subdir" in s and s["subdir"] != "":
                    filename = filename.replace(f"{s["subdir"]}/", "")
                asset_id, size = filename.split("_")
                asset_path = FileAssetStorageDriver.get_local_file_path(asset_id, size)

                bucket.download_file(obj.key, asset_path)

                if cleanup_delete:
                    obj.delete()

        elif driver == "db":
            from core.models import Asset

            from .db import DBAssetStorageDriver

            s = settings.DRIVER_SETTINGS["s3"]

            s3_resource = S3AssetStorageDriver.get_s3()
            bucket = s3_resource.Bucket(s["bucket"])
            for obj in bucket.objects.all():
                # stripping the folder prefix from the filename, if there is one
                filename = obj.key
                if "subdir" in s and s["subdir"] != "":
                    filename = filename.replace(f"{s["subdir"]}/", "")
                asset_id, size = filename.split("_")

                # DB only stores originals, ignore others
                if size != "original":
                    # Unless we're getting rid of everything as we go
                    # Delete the file so it's not lingering after the original is migrated
                    if cleanup_delete:
                        obj.delete()
                    else:
                        continue

                temporary_file = tempfile.NamedTemporaryFile(dir=tempfile.gettempdir())

                if os.path.isfile(temporary_file.name):
                    temporary_file.close()

                bucket.download_file(obj.key, temporary_file.name)
                asset_obj = Asset.objects.get(id=asset_id)
                DBAssetStorageDriver.store(asset_obj, temporary_file.name, "original")

                os.remove(temporary_file.name)

                if cleanup_delete:
                    obj.delete()
        else:
            raise Exception("S3 Driver: Invalid driver option selected for migration")
