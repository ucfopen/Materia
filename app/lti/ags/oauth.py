import logging
import os
import time
import uuid

import jwt
import requests
from lti_tool.models import Key, LtiRegistration

logger = logging.getLogger("django")


class AGSOauth:

    def __init__(self, scope=None):
        """
        Initialize the OAuth2 handler.
        """

        # TODO make platform selection more robust
        platform_domain = os.environ.get("PLATFORM_DOMAIN")
        registration = LtiRegistration.objects.filter(
            token_url__contains=platform_domain
        ).first()

        self.client_id = registration.client_id
        self.issuer = registration.issuer
        self.token_url = registration.token_url
        self.scope = scope
        self.access_token = None
        self.token_expires_at = None

    def create_jwt_assertion(self):

        # TODO this just grabs the first (only?) public/private keypair. Make this more robust.
        key = Key.objects.first()

        # JWT payload for client credentials grant
        payload = {
            "iss": self.issuer,  # Registration issuer
            "sub": self.client_id,  # Registration client id (platform client id)
            "aud": self.token_url,  # Registration's oauth token URL
            # "iat": int(key.datetime_created.timestamp()),
            # TODO properly configure the JWT's creation time
            "iat": int(time.time() - 60),
            # TODO properly configure expiration time
            "exp": int(time.time()) + 300,
            "jti": str(uuid.uuid4()),  # Unique identifier for this specific access key
        }

        # Sign with private key using RS256
        jwt_assertion = jwt.encode(
            payload,
            key.private_key,
            algorithm="RS256",
            headers={"kid": key.as_jwk()["kid"]},
        )

        return jwt_assertion

    def get_access_token(self):
        """
        Get a valid access token, refreshing if necessary.
        """

        if (
            self.access_token
            and self.token_expires_at
            and time.time() < self.token_expires_at
        ):
            return self.access_token

        return self.refresh_token()

    def refresh_token(self):
        """
        Refresh the access token.
        """

        payload = {
            "grant_type": "client_credentials",
            "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            "client_assertion": self.create_jwt_assertion(),
            "scope": (
                "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem "
                "https://purl.imsglobal.org/spec/lti-ags/scope/score"
            ),
        }

        response = requests.post(self.token_url, data=payload)
        response.raise_for_status()

        token_data = response.json()
        self.access_token = token_data["access_token"]
        self.token_expires_at = (
            time.time() + token_data.get("expires_in", 3600) - 60
        )  # Buffer of 60 seconds

        return self.access_token

    def get_auth_header(self):
        """
        Get the Authorization header for API requests.
        """
        return {"Authorization": f"Bearer {self.get_access_token()}"}
