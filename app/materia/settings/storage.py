import os

# amount of kilobytes alloted to any individual user for media storage
MEDIA_QUOTA = 5000

# defines the desired media driver
MEDIA_DRIVER = os.environ.get("ASSET_STORAGE_DRIVER", "file")

# defines class names based on the desired media driver
# is there a smarter/safer way of doing this?
DRIVER_SETTINGS = {
    "file": {"class": "FileAssetStorageDriver"},
    "db": {"class": "DBAssetStorageDriver"},
    "s3": {
        "class": "S3AssetStorageDriver",
        # env or imds. Should be set to env for fakes3
        "credential_provider": os.environ.get(
            "ASSET_STORAGE_S3_CREDENTIAL_PROVIDER", "env"
        ),
        # set to url for testing endpoint
        "endpoint": os.environ.get("ASSET_STORAGE_S3_ENDPOINT", "http://fakes3:10001"),
        # aws region for bucket
        "region": os.environ.get("ASSET_STORAGE_S3_REGION", "us-east-1"),
        # bucket to store user uploads
        "bucket": os.environ.get("ASSET_STORAGE_S3_BUCKET", "fake_bucket"),
        # OPTIONAL - subfolder within S3 bucket
        "subdir": os.environ.get("ASSET_STORAGE_S3_BASEPATH", "media"),
        # aws api key
        "key": os.environ.get(
            "AWS_ACCESS_KEY_ID", os.environ.get("ASSET_STORAGE_S3_KEY", "KEY")
        ),
        # aws api secret key
        "secret_key": os.environ.get(
            "AWS_SECRET_ACCESS_KEY",
            os.environ.get("ASSET_STORAGE_S3_SECRET", "SECRET"),
        ),
        "token": os.environ.get("AWS_SESSION_TOKEN", "TOKEN"),  # aws session token
        # use fakes3 unless explicitly disabled
        "fakes3_enabled": os.environ.get("DEV_ONLY_USE_FAKES3", True),
        # base S3 URL for viewing objects in-browser
        "view_url": os.environ.get(
            "ASSET_STORAGE_S3_BASEURL", "http://localhost:10001/fake_bucket/media/"
        ),
    },
}
