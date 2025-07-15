import logging
from pprint import pformat

# from core.models import Lti
from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.models import Group, User

logger = logging.getLogger("django")


class LTIAuthService:

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
    def is_user_author(launch):
        roles = launch.get("https://purl.imsglobal.org/spec/lti/claim/roles", [])

        for role in roles:
            if role in settings.LTI_ROLES["staff"]:
                return True

        return False

    @staticmethod
    def is_test_user(launch):
        roles = launch.get("https://purl.imsglobal.org/spec/lti/claim/roles", [])

        if "http://purl.imsglobal.org/vocab/lti/system/person#TestUser" in roles:
            return True

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

            if LTIAuthService.is_test_user(launch):
                auth_data["login_id"] = "test_user"
                auth_data["email"] = "test-user@materia.test.edu"
            else:
                logger.error("LTI auth: critical auth data (email or login id) missing")
                return None

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

            LTIAuthService.provision_roles(user, auth_data["roles"])

            login(request, user)

            return user

        except Exception as e:
            logger.error(f"LTI auth: exception!\n{pformat(e)}\n")
            logout(request)
            return None
