import logging

from core.models import LogPlay, ObjectPermission, WidgetInstance
from core.services.instance_service import WidgetInstanceService
from core.services.perm_service import PermService
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions

logger = logging.getLogger(__name__)


class DenyAll(permissions.BasePermission):
    def has_permission(self, request, view):
        return False


class IsSuperuser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser


class IsSuperOrSupportUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return PermService.is_superuser_or_elevated(request.user)


class ReadOnlyIfAuthenticated(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated and request.method in permissions.SAFE_METHODS:
            return True

        return False


class IsUserSelf(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if not isinstance(obj, User):
            return False
        if not request.user.is_authenticated:
            return False

        return obj.id == request.user.id


# Asks if a user has *any* perms at all on an object
class HasAnyPerms(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        else:
            if hasattr(obj, "permissions"):
                return obj.permissions.filter(
                    Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()),
                    user=request.user,
                ).exists()
            else:
                return False


class CanCreateWidgetInstances(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated or PermService.does_user_have_roles(
            user, "no_author"
        ):
            return False
        return True


class HasFullPerms(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Otherwise, check if user has full perms on this object
        if hasattr(obj, "permissions"):
            return obj.permissions.filter(
                Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()),
                user=request.user,
                permission=ObjectPermission.PERMISSION_FULL,
            ).exists()


class HasInstanceLock(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not isinstance(obj, WidgetInstance):
            return False

        user = request.user
        if not user or not user.is_authenticated:
            return False

        return WidgetInstanceService.user_has_lock_or_is_unlocked(obj, user)


class InstanceHasGuestAccess(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not isinstance(obj, WidgetInstance):
            return False

        return obj.guest_access


class PlaySessionInstancePermissions(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return True

        # do we have an instance ID query param?
        inst_id = request.query_params.get("inst_id") or request.data.get("instanceId")
        if inst_id is not None:
            try:
                instance = WidgetInstance.objects.get(pk=inst_id)
                return instance.guest_access
            except WidgetInstance.DoesNotExist:
                return False

        # is the pk of the request a play ID?
        play = LogPlay.objects.get(pk=view.kwargs.get("pk"))
        if play is not None:
            return play.instance.guest_access

        return False

    def has_object_permission(self, request, view, obj):
        if not isinstance(obj, LogPlay):
            return False

        if PermService.is_superuser_or_elevated(request.user):
            return True

        if not obj.instance.guest_access:

            # only the user associated with the play log should have permission, except
            # with the /resubmit action; owners of the associated instance also have authority
            if obj.user != request.user and not (
                view.action == "resubmit"
                and obj.instance.permissions.filter(user=request.user).exists()
            ):
                return False

        if request.user and request.user.is_authenticated:
            return True

        return obj.instance.guest_access


class PlayStorageInstancePermissions(permissions.BasePermission):
    def has_permission(self, request, view):

        if request.method == "GET":
            inst_id = request.query_params.get("inst_id")
            if inst_id:
                instance = WidgetInstance.objects.filter(pk=inst_id).first()
                if not instance or not instance.playable_by_current_user(request.user):
                    return False

                return True

            play_id = request.query_params.get("play_id")
            play = LogPlay.objects.select_related("instance").filter(pk=play_id).first()

            if not play.instance.playable_by_current_user(request.user):
                return False

            return True

        elif request.method == "POST":
            play_id = request.data.get("play_id")
            play = LogPlay.objects.filter(pk=play_id).first()

            if play is None:
                return False

            if request.user.is_authenticated and play.user_id != request.user.id:
                return False

            return True

        return False
