from core.models import Asset, ObjectPermission
from django.contrib.contenttypes.models import ContentType
from rest_framework import filters


class AssetFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        asset_type = ContentType.objects.get(app_label="core", model="asset")
        return Asset.objects.filter(
            id__in=ObjectPermission.objects.filter(
                content_type=asset_type, user=request.user
            ).values_list("object_id", flat=True)
        )


# filter applied to /api/instances/ queryset
class UserInstanceFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        user = request.user
        user_query = request.query_params.get("user")

        if user_query == "me":
            return queryset.filter(user=user).order_by("-created_at")
        elif user_query is not None:
            if (
                user.is_superuser
                or user.groups.filter(name="support_user").exists()
                or str(user.id) == user_query
            ):
                return queryset.filter(user=user_query).order_by("-created_at")
            else:
                return queryset.none()
        return queryset.order_by("-created_at")
