from rest_framework import permissions
from core.models import WidgetInstance


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

        # TODO add collaborator ownership check
        # return False
        return (
            user.is_superuser or
            widget_instance.user == user or
            widget_instance.published_by == user or
            False
        )
