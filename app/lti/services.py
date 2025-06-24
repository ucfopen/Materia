import logging
from pprint import pformat

from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.models import Group, User

logger = logging.getLogger("django")


class LTiAuthService:

    @staticmethod
    def provision_roles(user, lti_roles):

        for role in lti_roles:
            author_group = Group.objects.get(name="basic_author")
            if role in settings.LTI_ROLES["staff"]:
                user.groups.add(author_group)
                return True

            if role in settings.LTI_ROLES["student"]:
                user.groups.remove(author_group)
                return True

        logger.error(
            f"LTI auth: user does not have a known role or roles: {pformat(lti_roles)}"
        )
        return False

    @staticmethod
    def authenticate(request, launch):

        auth_data = {
            "email": launch.get("email"),
            "first": launch.get("given_name", ""),
            "last": launch.get("family_name", ""),
            "roles": launch.get("https://purl.imsglobal.org/spec/lti/claim/roles", []),
        }

        if settings.LTI_USERDATA["claim"] is None:
            auth_data["login_id"] = launch.get(settings.LTI_USERDATA["identifier"])
        else:
            auth_data["login_id"] = launch.get(settings.LTI_USERDATA["claim"]).get(
                settings.LTI_USERDATA["identifier"]
            )

        if not auth_data["email"] or not auth_data["login_id"]:
            logger.error("LTI auth: critical auth data (email or login id) missing")
            return False

        try:
            user, created = User.objects.get_or_create(
                username=auth_data["login_id"],
                defaults={
                    "email": auth_data["email"],
                    "first_name": auth_data["first"],
                    "last_name": auth_data["last"],
                },
            )

            if not created:
                updated = False
                if user.email != auth_data["email"]:
                    user.email = auth_data["email"]
                    updated = True
                if user.first_name != auth_data["first"]:
                    user.first_name = auth_data["first"]
                    updated = True
                if user.last_name != auth_data["last"]:
                    user.last_name = auth_data["last"]
                    updated = True

                if updated:
                    user.save()

            LTiAuthService.provision_roles(user, auth_data["roles"])

            login(request, user)

            return True

        except Exception as e:
            logger.error(f"LTI auth: exception!\n{pformat(e)}\n")
            logout(request)
            return False
