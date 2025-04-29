import logging

from django.contrib.auth.models import User

logger = logging.getLogger("django")


class PermManager:
    @staticmethod
    def user_is_student(user: User):
        return not PermManager.does_user_have_roles(
            user, ["basic_author", "super_user"]
        )
        # return user.groups.filter(name="Student").exists()

    # Returns True if user has at least one of the roles specified
    @staticmethod
    def does_user_have_roles(user: User, roles: str | list[str]) -> bool:
        # Convert to list if single string passed in
        if type(roles) is str:
            roles = [roles]

        # Empty list of rolls, just return true
        if not roles:
            return True

        # Check to see if any of the roles are present
        return user.groups.filter(name__in=roles).exists()

    @staticmethod
    def get_all_objects_of_type_for_user(user_id, object_type, perms):
        # dodging circular import errors, else this would be at the top of the file
        from core.models import PermObjectToUser

        if len(perms) > 0 and isinstance(perms, list):
            query_perms = list(map(str, perms))

            return PermObjectToUser.objects.filter(
                object_type=object_type, user_id=user_id, perm__in=query_perms
            )
