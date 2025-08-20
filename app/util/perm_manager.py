from __future__ import annotations

import logging
from datetime import datetime
from typing import TYPE_CHECKING, Type

from django.contrib.auth.models import AnonymousUser, User
from django.db import models
from django.db.models import QuerySet

logger = logging.getLogger("django")

if TYPE_CHECKING:
    from core.models import WidgetInstance


class PermManager:
    @staticmethod
    def user_is_student(user: User):
        return not PermManager.does_user_have_roles(
            user, ["basic_author", "super_user"]
        )

    # Returns True if user has at least one of the roles specified
    @staticmethod
    def does_user_have_roles(
        user: User | AnonymousUser, roles: str | list[str]
    ) -> bool:
        # Check if user is not logged in
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            return False

        # Convert to list if single string passed in
        if type(roles) is str:
            roles = [roles]

        # Empty list of roles, just return true
        if not roles:
            return True

        # Check to see if any of the roles are present
        return user.groups.filter(name__in=roles).exists()

    @staticmethod
    def get_all_objects_of_type_for_user[T: Type[models.Model]](
        obj: T, user: User | str | int, perms: list[str]
    ) -> QuerySet[T]:
        if len(perms) <= 0:
            return obj.objects.none()

        from core.models import ObjectPermission

        all_ids = ObjectPermission.objects.filter(
            user=user, content_type=obj.content_type, permission__in=perms
        ).values("object_id")
        return obj.objects.filter(pk__in=all_ids)

    @staticmethod
    def clear_all_perms_for_object(obj: Type[models.Model]):
        if hasattr(obj, "permissions"):
            obj.permissions.all().delete()

    @staticmethod
    def is_superuser_or_elevated(user: User) -> bool:
        if not user or not user.is_authenticated:
            return False

        return user.is_superuser or user.groups.filter(name="support_user").exists()

    # Sets permissions for every asset linked to an instance
    # If a user already has FULL perms for an asset, changes are ignored
    @staticmethod
    def set_user_asset_perms_for_instance(
        user: User, instance: WidgetInstance, perm: str, expires: str = None
    ):
        pass
        # TODO this needs to be implemented, probably once we figure out how MapAssetToObject will actually work

    # TODO this needs to be linked up to something
    #      it was hooked up to get_all_users_with_perms_to before
    #      i imagine it might be better to instead have this run
    #      on an automatic schedule or something though
    @staticmethod
    def check_and_expire_user_object_perms():
        from core.models import Notification, ObjectPermission, WidgetInstance

        now = datetime.now()
        expired_perms = ObjectPermission.objects.filter(expires_at__lte=now)

        for expired_perm in expired_perms:
            # Send notif
            if expired_perm.content_type == WidgetInstance.content_type:
                Notification.create_instance_notification(
                    from_user=expired_perm.user,
                    to_user=expired_perm.user,
                    instance=WidgetInstance.objects.get(pk=expired_perm.object_id),
                    mode="expired",
                )

            # Delete perm
            expired_perm.delete()
