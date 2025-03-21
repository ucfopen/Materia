from rest_framework import permissions
from core.models import WidgetInstance
from util.perm_manager import PermManager


class IsSuperuser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser


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
            return user.is_superuser or widget_instance.user == user or widget_instance.published_by == user

        # TODO add collaborator ownership check
        # return False
        return (
            user.is_superuser or
            widget_instance.user == user or
            widget_instance.published_by == user or
            False
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
