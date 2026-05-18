import os

AWS_SETTINGS = {
    "key": os.environ.get(
        "AWS_ACCESS_KEY_ID", os.environ.get("ASSET_STORAGE_S3_KEY", "KEY")
    ),
    "secret_key": os.environ.get(
        "AWS_SECRET_ACCESS_KEY",
        os.environ.get("ASSET_STORAGE_S3_SECRET", "SECRET"),
    ),
    "session_token": os.environ.get("AWS_SESSION_TOKEN"),
    "credential_provider": os.environ.get(
        "AWS_CREDENTIAL_PROVIDER",
        os.environ.get("ASSET_STORAGE_S3_CREDENTIAL_PROVIDER", "env"),
    ),
    "region": os.environ.get(
        "AWS_REGION", os.environ.get("ASSET_STORAGE_S3_REGION", "us-east-1")
    ),
    "profile": os.environ.get("AWS_PROFILE", None),
}
