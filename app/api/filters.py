import logging

from core.models import Asset, ObjectPermission, WidgetInstance
from django.db.models import Q
from rest_framework import filters

logger = logging.getLogger("django")


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
            return WidgetInstance.objects.filter(
                id__in=ObjectPermission.objects.filter(
                    content_type=WidgetInstance.content_type, user=user
                ).values_list("object_id", flat=True),
                is_deleted=False,
            ).order_by("-created_at")
        elif user_query is not None:
            if (
                user.is_superuser
                or user.groups.filter(name="support_user").exists()
                or str(user.id) == user_query
            ):
                return WidgetInstance.objects.filter(
                    id__in=ObjectPermission.objects.filter(
                        content_type=WidgetInstance.content_type, user=user_query
                    ).values_list("object_id", flat=True),
                ).order_by("-created_at")
            else:
                return queryset.none()
        elif search_query is not None:
            include_deleted = request.query_params.get("include_deleted", False)
            return queryset.filter(
                Q(name__icontains=search_query) | Q(id__icontains=search_query),
                is_deleted=False if not include_deleted else Q(),
            )

        return queryset.order_by("-created_at")


class LogPlayFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        pk = view.kwargs.get("pk")
        user = request.user
        user_query = request.query_params.get("user")

        # user is requesting their own logs
        if user_query == "me":
            return queryset.filter(user=user).order_by("-created_at")
        # user is requesting an arbitrary user's logs: requires elevated perms or self
        elif user_query is not None:
            if (
                user.is_superuser
                or user.groups.filter(name="support_user").exists()
                or str(user.id) == user_query
            ):
                return queryset.filter(user=user_query).order_by("-created_at")
            else:
                return queryset.none()

                # user wants ALL the logs
        elif pk is None and user_query is None:
            # NEVER return every play log in the DB !!!!!!
            return queryset.none()
