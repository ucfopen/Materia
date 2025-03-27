from __future__ import annotations
from typing import TYPE_CHECKING
from django.contrib.auth.models import User

import logging

logger = logging.getLogger("django")

if TYPE_CHECKING:
    from core.models import PermObjectToUser


class PermManager:
    @staticmethod
    def user_is_student(user: User):
        return not PermManager.does_user_have_roles(user, ["basic_author", "super_user"])
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

    # @staticmethod
    # def get_all_objects_for_user(
    #         user: User | str, object_type: int, perms: list[int] = None,
    # ) -> QuerySet:
    #     from core.models import PermObjectToUser, WidgetInstance
    #     base_query = PermObjectToUser.objects.filter(object_type=object_type, user=user)
    #     if perms is not None and len(perms) > 0:
    #         base_query = base_query.filter(perm__in=perms)
    #
    #     match object_type:
    #         case PermObjectToUser.ObjectType.INSTANCE:
    #             return WidgetInstance.objects.filter(id__in=[pk for pk in base_query.values_list("object_id")])
    #         case _:
    #             return None  # TODO

    @staticmethod
    def clear_all_perms_for_object(object_id, object_type: PermObjectToUser.ObjectType):
        from core.models import PermObjectToUser  # Avoids a circular import. I can't really think of a better solution
        access = PermObjectToUser.objects.filter(
            object_id=object_id,
            object_type=object_type,
        )
        for a in access:
            a.delete()
