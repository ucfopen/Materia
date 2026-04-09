import logging

from api.permissions import IsSuperOrSupportUser
from api.serializers import (
    CommunityLibraryEntrySerializer,
    LibraryReportSerializer,
    WidgetInstanceSerializer,
)
from core.models import (
    CommunityLibraryEntry,
    LibraryReport,
    Notification,
    UserLike,
    WidgetInstance,
)
from core.services.user_service import UserService
from core.utils.b64_util import Base64Util
from core.utils.validator_util import ValidatorUtil
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.db.models import F
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

logger = logging.getLogger(__name__)

REPORT_THRESHOLD = 5


class CommunityLibraryPagination(PageNumberPagination):
    page_size = 80
    page_size_query_param = "page_size"
    max_page_size = 80


class CommunityLibraryViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
    queryset = CommunityLibraryEntry.objects.none()
    serializer_class = CommunityLibraryEntrySerializer
    pagination_class = CommunityLibraryPagination

    def get_queryset(self):
        moderation = ValidatorUtil.validate_bool(
            self.request.query_params.get("moderation")
        )

        if moderation:
            qs = (
                CommunityLibraryEntry.objects.all()
                .select_related(
                    "instance",
                    "instance__widget",
                    "instance__user",
                )
                .prefetch_related("snapshots")
            )
            status = self.request.query_params.get("status")
            if status == "banned":
                qs = qs.filter(is_banned=True).order_by("-report_count", "-created_at")
            elif status == "reported":
                qs = qs.filter(report_count__gt=0).order_by(
                    "-report_count", "-created_at"
                )
            else:
                qs = qs.order_by("-report_count", "-created_at")
        else:
            qs = (
                CommunityLibraryEntry.objects.filter(
                    instance__is_shared=True,
                    instance__is_deleted=False,
                    instance__is_draft=False,
                    is_banned=False,
                )
                .select_related(
                    "instance",
                    "instance__widget",
                    "instance__user",
                )
                .prefetch_related("snapshots")
            )

        # Search by latest snapshot name
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(snapshots__name__icontains=search).distinct()

        # Filter by widget type
        widget_id = self.request.query_params.get("widget_id")
        if widget_id:
            qs = qs.filter(instance__widget_id=widget_id)

        # Filter by category
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)

        # Filter by course level
        course_level = self.request.query_params.get("course_level")
        if course_level:
            qs = qs.filter(course_level=course_level)

        # Filter featured only
        featured = ValidatorUtil.validate_bool(
            self.request.query_params.get("featured")
        )
        if featured:
            qs = qs.filter(featured=True)

        # Sorting
        sort = self.request.query_params.get("sort", "newest")
        if sort == "most_copied":
            qs = qs.order_by("-copy_count", "-created_at")
        elif sort == "most_liked":
            qs = qs.order_by("-like_count", "-created_at")
        elif sort == "alphabetical":
            qs = qs.order_by("snapshots__name")
        else:
            qs = qs.order_by("-created_at")

        return qs

    def get_permissions(self):
        if self.action == "list":
            moderation = ValidatorUtil.validate_bool(
                self.request.query_params.get("moderation")
            )
            if moderation:
                permission_classes = [IsSuperOrSupportUser]
            else:
                permission_classes = [IsAuthenticated]
        elif self.action in (
            "copy",
            "like",
            "report",
            "snapshot_instance",
            "snapshot_qset",
        ):
            permission_classes = [IsAuthenticated]
        elif self.action == "moderate":
            permission_classes = [IsSuperOrSupportUser]
        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

    @action(detail=True, methods=["post"])
    def copy(self, request, pk=None):
        entry = self.get_object()
        snapshot = entry.snapshots.order_by("-created_at").first()
        new_instance = entry.instance.duplicate(
            owner=request.user, new_name=snapshot.name
        )

        new_instance.copied_from_entry = entry
        new_instance.save(update_fields=["copied_from_entry"])

        latest_qset = new_instance.get_latest_qset()
        latest_qset.data = snapshot.qset_data
        latest_qset.version = snapshot.qset_version
        latest_qset.save(update_fields=["data", "version"])

        CommunityLibraryEntry.objects.filter(pk=entry.pk).update(
            copy_count=F("copy_count") + 1
        )

        return Response(WidgetInstanceSerializer(new_instance).data)

    @action(detail=True, methods=["post"])
    def like(self, request, pk=None):
        entry = self.get_object()
        like, created = UserLike.objects.get_or_create(user=request.user, entry=entry)

        if created:
            CommunityLibraryEntry.objects.filter(pk=entry.pk).update(
                like_count=F("like_count") + 1
            )
            entry.refresh_from_db()
            return Response({"liked": True, "like_count": entry.like_count})
        else:
            like.delete()
            CommunityLibraryEntry.objects.filter(pk=entry.pk).update(
                like_count=F("like_count") - 1
            )
            entry.refresh_from_db()
            return Response({"liked": False, "like_count": entry.like_count})

    @action(detail=True, methods=["post"])
    def report(self, request, pk=None):
        entry = self.get_object()

        if LibraryReport.objects.filter(user=request.user, entry=entry).exists():
            return Response(
                {"error": "You have already reported this item."}, status=400
            )

        serializer = LibraryReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        LibraryReport.objects.create(
            user=request.user,
            entry=entry,
            reason=serializer.validated_data["reason"],
            details=serializer.validated_data.get("details", ""),
        )

        CommunityLibraryEntry.objects.filter(pk=entry.pk).update(
            report_count=F("report_count") + 1
        )
        entry.refresh_from_db()

        if entry.report_count >= REPORT_THRESHOLD and not entry.is_banned:
            entry.is_banned = True
            entry.save(update_fields=["is_banned"])
            self._notify_admins_of_ban(entry, request.user)

        return Response({"success": True})

    @action(detail=True, methods=["patch"])
    def moderate(self, request, pk=None):
        entry = CommunityLibraryEntry.objects.get(pk=pk)
        allowed_fields = ["featured", "is_banned", "category", "course_level"]

        for field, value in request.data.items():
            if field in allowed_fields:
                setattr(entry, field, value)

        entry.save()
        serializer = CommunityLibraryEntrySerializer(
            entry, context={"request": request}
        )
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["get"],
        url_path="snapshot_instance/(?P<snapshot_id>[^/.]+)",
    )
    def snapshot_instance(self, request, pk=None, snapshot_id=None):
        entry = self.get_object()
        snapshot = entry.snapshots.filter(pk=snapshot_id).first()
        if not snapshot:
            return Response({"error": "Snapshot not found."}, status=404)
        data = WidgetInstanceSerializer(entry.instance).data
        data["name"] = snapshot.name
        return Response(data)

    @action(
        detail=True, methods=["get"], url_path="snapshot_qset/(?P<snapshot_id>[^/.]+)"
    )
    def snapshot_qset(self, request, pk=None, snapshot_id=None):
        entry = self.get_object()
        snapshot = entry.snapshots.filter(pk=snapshot_id).first()
        if not snapshot:
            return Response({"error": "Snapshot not found."}, status=404)

        return Response(
            {
                "data": (
                    Base64Util.decode(snapshot.qset_data) if snapshot.qset_data else {}
                ),
                "version": snapshot.qset_version,
            }
        )

    def _notify_admins_of_ban(self, entry, reporting_user):
        """Send notifications to all superusers and support users when an entry is auto-banned."""
        admin_users = User.objects.filter(is_superuser=True) | User.objects.filter(
            groups__name="support_user"
        )
        admin_users = admin_users.distinct()

        avatar = UserService.get_avatar_url(reporting_user)
        instance = entry.instance

        for admin_user in admin_users:
            notification = Notification.objects.create(
                from_id=reporting_user,
                to_id=admin_user,
                item_type=ContentType.objects.get_for_model(WidgetInstance).id,
                item_id=instance.id,
                is_email_sent=False,
                subject=f'Community Library item "<b>{instance.name}</b>" was auto-hidden after receiving {REPORT_THRESHOLD} reports.',
                avatar=avatar,
                action="library_report",
            )
            notification.send_email()
