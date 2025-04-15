from core.models import Asset, ObjectPermission
from django.db.models import Q
from rest_framework import filters


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
        search_query = request.query_params.get("search")

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
        elif search_query is not None:
            return queryset.filter(
                # Add your fields here
                Q(name__icontains=search_query)
                | Q(id__icontains=search_query)
            )

        return queryset.order_by("-created_at")
