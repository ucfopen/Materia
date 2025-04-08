import logging

from core.models import Asset, ObjectPermission, Question, WidgetInstance
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions
from util.perm_manager import PermManager
from util.widget.instance.instance_util import WidgetInstanceUtil

logger = logging.getLogger("django")


class IsSuperuser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser


class IsSuperOrSupportUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_superuser
            or request.user.groups.filter(name="support_user").exists()
        )


class IsSelfOrElevatedAccess(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        return (
            request.user.is_superuser
            or request.user.groups.filter(name="support_user").exists()
            or obj.id == request.user.id
        )


class HasPermsOrElevatedAccess(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if (
            request.user.is_superuser
            or request.user.groups.filter(name="support_user").exists()
        ):
            return True
        else:
            if (
                isinstance(obj, WidgetInstance)
                or isinstance(obj, Question)
                or isinstance(obj, Asset)
            ):
                return obj.permissions.filter(
                    Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()),
                    user=request.user,
                ).exists()
            else:
                return False


class IsSuperuserOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_superuser


class HasWidgetInstanceEditAccess(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "instance"):
            widget_instance = obj.instance
        elif isinstance(obj, WidgetInstance):
            widget_instance = obj
        else:
            return False

        user = request.user

        # Require user to own the widget (not just have collab perms) if they want to delete it
        if request.method == "DELETE":
            return (
                user.is_superuser
                or widget_instance.user == user
                or widget_instance.published_by == user
            )

        # Make sure the widget isn't locked
        # The frontend should stop users from editing if locked, but this is here *just in case*
        if not WidgetInstanceUtil.user_has_lock_or_is_unlocked(widget_instance, user):
            return False

        return (
            user.is_superuser
            or widget_instance.user == user
            or widget_instance.published_by == user
            or obj.permissions.filter(
                Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()),
                object_id=widget_instance.id,
                user=user,
                permission=ObjectPermission.PERMISSION_FULL,
            ).exists()
            or False
        )


class HasWidgetInstanceEditAccessOrReadOnly(HasWidgetInstanceEditAccess):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return super().has_object_permission(request, view, obj)


class CanCreateWidgetInstances(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if user is None or PermManager.does_user_have_roles(user, "no_author"):
            return False
        return True
