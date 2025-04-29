from core.models import Asset, ObjectPermission, WidgetInstance
from rest_framework import filters

from util.perm_manager import PermManager


class AssetFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        return Asset.objects.filter(
            id__in=ObjectPermission.objects.filter(
                content_type=Asset.content_type, user=request.user
            ).values_list("object_id", flat=True)
        )


# filter applied to /api/instances/ queryset
class UserInstanceFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        user = request.user
        user_query = request.query_params.get("user")
        include_deleted = request.query_params.get("include_deleted", False)

        if user_query == "me":
            queryset = PermManager.get_all_objects_of_type_for_user(
                WidgetInstance,
                user,
                [ObjectPermission.PERMISSION_FULL, ObjectPermission.PERMISSION_VISIBLE]
            )
            # return queryset.filter(user=user).order_by("-created_at")
        elif user_query is not None:
            if (
                user.is_superuser
                or user.groups.filter(name="support_user").exists()
                or str(user.id) == user_query
            ):
                queryset = PermManager.get_all_objects_of_type_for_user(
                    WidgetInstance,
                    user_query,
                    [ObjectPermission.PERMISSION_FULL, ObjectPermission.PERMISSION_VISIBLE]
                )
            else:
                return queryset.none()

        if not include_deleted:
            queryset = queryset.filter(is_deleted=False)

        return queryset.order_by("-created_at")
