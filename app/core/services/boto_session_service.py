import logging

import boto3
from django.conf import settings

logger = logging.getLogger(__name__)


class BotoSessionService:

    # TODO: move client-related credential configs to another configuration location
    # instead of just s3?

    @staticmethod
    def get_session():
        # Configure credentials depending on whether we're providing them from env or Amazon's IMDSv2 service
        # IMDS is HIGHLY recommended for prod usage on AWS
        session = None
        s = settings.AWS_SETTINGS
        if s["credential_provider"] == "imds":
            # Credentials are sourced from the EC2 instance's IAM role
            session = boto3.Session()
        elif s["credential_provider"] == "env":
            session_config = {
                "region_name": s["region"],
            }
            if s["profile"] is not None:
                session_config["profile_name"] = s["profile"]
            else:
                session_config["aws_access_key_id"] = (s["key"],)
                session_config["aws_secret_access_key"] = (s["secret_key"],)
                session_config["aws_session_token"] = (s["aws_session_token"],)
            session = boto3.Session(**session_config)
        else:
            raise Exception(
                "boto3: Failed to determine credential provider. Did you set the appropriate environment variable?"
            )

        return session
