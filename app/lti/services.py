import logging
from pprint import pformat

from django.conf import settings
from django.contrib.auth import login
from django.contrib.auth.models import User

logger = logging.getLogger("django")


class LTiAuthService:

    @staticmethod
    def authenticate(request, launch):

        auth_data = {
            "email": launch.get("email"),
            "first": launch.get("given_name", ""),
            "last": launch.get("family_name", ""),
        }

        if settings.LTI_USERDATA["claim"] is None:
            auth_data["login_id"] = launch.get(settings.LTI_USERDATA["identifier"])
        else:
            auth_data["login_id"] = launch.get(settings.LTI_USERDATA["claim"]).get(
                settings.LTI_USERDATA["identifier"]
            )

        logger.error(f"\n{pformat(auth_data)}\n")

        if not auth_data["email"] or not auth_data["login_id"]:
            logger.error("LTI auth: critical auth data (email or login id) missing")
            return False

        try:
            user, created = User.objects.get_or_create(
                username=auth_data["login_id"],
                email=auth_data["email"],
                first_name=auth_data["first"],
                last_name=auth_data["last"],
            )

            login(request, user)

            return True

        except Exception as e:
            logger.error(f"\n{pformat(e)}\n")
            return False
