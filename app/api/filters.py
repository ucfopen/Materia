import logging

from core.models import Asset, ObjectPermission, WidgetInstance
from django.db.models import Q
from rest_framework import filters
from util.logging.session_play import SessionPlay
from util.perm_manager import PermManager

logger = logging.getLogger("django")


class AssetFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        return PermManager.get_all_objects_of_type_for_user(
            Asset,
            request.user,
            [ObjectPermission.PERMISSION_FULL, ObjectPermission.PERMISSION_VISIBLE],
        )


# filter applied to /api/instances/ queryset
class UserInstanceFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        user = request.user
        user_query = request.query_params.get("user")
        search_query = request.query_params.get("search")

        if user_query == "me":
            queryset = PermManager.get_all_objects_of_type_for_user(
                WidgetInstance,
                user,
                [ObjectPermission.PERMISSION_FULL, ObjectPermission.PERMISSION_VISIBLE],
            )
        elif user_query is not None:
            if (
                user.is_superuser
                or user.groups.filter(name="support_user").exists()
                or str(user.id) == user_query
            ):
                queryset = PermManager.get_all_objects_of_type_for_user(
                    WidgetInstance,
                    user_query,
                    [
                        ObjectPermission.PERMISSION_FULL,
                        ObjectPermission.PERMISSION_VISIBLE,
                    ],
                )
            else:
                return queryset.none()
        elif search_query is not None:
            include_deleted = request.query_params.get("include_deleted", False)
            queryset = queryset.filter(
                Q(name__icontains=search_query) | Q(id__icontains=search_query),
                is_deleted=False if not include_deleted else Q(),
            )

        return queryset.order_by("-created_at")


class LogPlayFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        pk = view.kwargs.get("pk")
        user = request.user
        user_query = request.query_params.get("user")
        inst_id = request.query_params.get("inst_id")

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

        elif inst_id is not None:
            semester = request.query_params.get("semester", "all")
            year = request.query_params.get("year", "all")
            logger.error(f"\n\ngetting all plays for instance {inst_id}\n\n")
            return SessionPlay.get_all_plays_for_instance(inst_id, semester, year)

            # user wants ALL the logs
        elif pk is None and user_query is None:
            # NEVER return every play log in the DB !!!!!!
            return queryset.none()
