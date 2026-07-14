import logging

from api.permissions import IsSuperOrSupportUser
from api.serializers import (
    CommunityLibraryEntrySerializer,
    LibraryReportSerializer,
    TagSerializer,
    WidgetInstanceSerializer,
)
from core.models import (
    CommunityLibraryEntry,
    LibraryReport,
    Notification,
    Tag,
    UserLike,
    WidgetInstance,
)
from core.services.user_service import UserService
from core.utils.b64_util import Base64Util
from core.utils.validator_util import ValidatorUtil
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.db.models import F, Q
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

REPORT_THRESHOLD = 5


class CommunityLibraryPagination(PageNumberPagination):
    page_size = 80
    page_size_query_param = "page_size"
    max_page_size = 80


def _notify_admins_of_ban(entry, reporting_user):
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
            subject=(
                f'Community Library item "<b>{instance.name}</b>" '
                f"was auto-hidden after receiving {REPORT_THRESHOLD} reports."
            ),
            avatar=avatar,
            action="library_report",
        )
        notification.send_email()


class CommunityLibraryListView(APIView):
    def get_permissions(self):
        moderation = ValidatorUtil.validate_bool(
            self.request.query_params.get("moderation")
        )
        if moderation:
            return [IsSuperOrSupportUser()]
        return [AllowAny()]

    def get(self, request):
        moderation = ValidatorUtil.validate_bool(request.query_params.get("moderation"))

        if moderation:
            qs = (
                CommunityLibraryEntry.objects.all()
                .select_related(
                    "instance",
                    "instance__widget",
                    "instance__user",
                )
                .prefetch_related("snapshots", "tags", "likes")
            )
            status = request.query_params.get("status")
            if status == "banned":
                qs = qs.filter(is_banned=True).order_by("-report_count", "-created_at")
            elif status == "reported":
                qs = qs.filter(report_count__gt=0).order_by(
                    "-report_count", "-created_at"
                )
            elif status == "unpublished":
                qs = qs.filter(instance__is_shared=False)
            elif status == "featured":
                qs = qs.filter(featured=True)
            else:
                qs = qs.order_by("-report_count", "-created_at")

            show_deleted = request.query_params.get("deleted")
            if show_deleted == "false":
                qs = qs.filter(instance__is_deleted=False)
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
                .prefetch_related("snapshots", "tags", "likes")
            )

        # Search by latest snapshot name
        search = request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(snapshots__name__icontains=search)
                | Q(instance__user__first_name__icontains=search)
                | Q(instance__user__last_name__icontains=search)
            ).distinct()

        # Filter by widget type
        widget_id = request.query_params.get("widget_id")
        if widget_id:
            qs = qs.filter(instance__widget_id=widget_id)

        # Filter by category
        categories = request.query_params.getlist("category")
        if categories:
            qs = qs.filter(category__in=categories)

        # Filter by course level
        course_level = request.query_params.get("course_level")
        if course_level:
            qs = qs.filter(course_level=course_level)

        # Filter featured only
        featured = ValidatorUtil.validate_bool(request.query_params.get("featured"))
        if featured:
            qs = qs.filter(featured=True)

        tags = request.query_params.getlist("tags")
        if tags:
            qs = qs.filter(tags__name__in=tags).distinct()

        # Sorting
        sort = request.query_params.get("sort", "newest")
        if sort == "most_copied":
            qs = qs.order_by("-copy_count", "-created_at")
        elif sort == "most_liked":
            qs = qs.order_by("-like_count", "-created_at")
        elif sort == "alphabetical":
            qs = qs.order_by("snapshots__name")
        else:
            qs = qs.order_by("-created_at")

        limit = request.query_params.get("limit")
        if limit:
            qs = qs.all()[: int(limit)]

        paginator = CommunityLibraryPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = CommunityLibraryEntrySerializer(
            page, many=True, context={"request": request}
        )
        return paginator.get_paginated_response(serializer.data)


class CommunityLibraryTagsView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsSuperOrSupportUser()]

    def get(self, request):
        qs = Tag.objects.all().order_by("-used_count", "name")

        search = request.query_params.get("search", "")
        if search != "":
            qs = qs.filter(name__icontains=search)

        exclude = request.query_params.getlist("exclude")
        if exclude:
            qs = qs.exclude(name__in=exclude)

        count = request.query_params.get("count", None)
        if count is not None:
            count = int(count)
            qs = qs[:count]

        return Response([TagSerializer(t).data for t in qs])

    def patch(self, request):
        name = request.query_params.get("name", "")
        normalized_name = Tag.normalize_name(name)
        tag = Tag.objects.filter(normalized_name=normalized_name).first()

        if not tag:
            return Response(
                {"error": "Cannot delete a tag that does not exist."}, status=400
            )

        to = request.query_params.get("to", "")
        cleaned_to = " ".join(to.strip().split())
        if not cleaned_to:
            return Response({"error": "Tag name cannot be blank."}, status=400)

        normalized_to = Tag.normalize_name(cleaned_to)
        dupe = (
            Tag.objects.filter(normalized_name=normalized_to).exclude(pk=tag.pk).first()
        )
        if dupe:
            return Response(
                {"error": "There already exists a tag with this name."}, status=409
            )

        tag.name = cleaned_to
        tag.normalized_name = normalized_to
        tag.save(update_fields=["name", "normalized_name"])
        return Response(status=200)

    def delete(self, request):
        name = request.query_params.get("name", "")
        normalized_name = Tag.normalize_name(name)
        tag = Tag.objects.filter(normalized_name=normalized_name).first()

        if not tag:
            return Response(
                {"error": "Cannot delete a tag that does not exist."}, status=400
            )

        tag.delete()
        return Response(status=200)


class CommunityLibraryDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        entry = get_object_or_404(CommunityLibraryEntry, pk=pk)
        return Response(
            CommunityLibraryEntrySerializer(entry, context={"request": request}).data
        )


class CommunityLibraryCopyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        entry = get_object_or_404(CommunityLibraryEntry, pk=pk)
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


class CommunityLibraryLikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        entry = get_object_or_404(CommunityLibraryEntry, pk=pk)
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


class CommunityLibraryReportsView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsSuperOrSupportUser()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        entry = get_object_or_404(CommunityLibraryEntry, pk=pk)
        reports = LibraryReport.objects.filter(entry=entry)
        return Response([LibraryReportSerializer(r).data for r in reports])

    def post(self, request, pk):
        entry = get_object_or_404(CommunityLibraryEntry, pk=pk)

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
            _notify_admins_of_ban(entry, request.user)

        return Response({"success": True})


class CommunityLibraryModerateView(APIView):
    permission_classes = [IsSuperOrSupportUser]

    def patch(self, request, pk):
        entry = get_object_or_404(CommunityLibraryEntry, pk=pk)
        allowed_fields = ["featured", "is_banned", "category", "course_level"]

        for field, value in request.data.items():
            if field in allowed_fields:
                setattr(entry, field, value)

        entry.save()
        return Response(
            CommunityLibraryEntrySerializer(entry, context={"request": request}).data
        )


class CommunityLibrarySnapshotInstanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, snapshot_id):
        entry = get_object_or_404(CommunityLibraryEntry, pk=pk)
        snapshot = entry.snapshots.filter(pk=snapshot_id).first()
        if not snapshot:
            return Response({"error": "Snapshot not found."}, status=404)
        data = WidgetInstanceSerializer(entry.instance).data
        data["name"] = snapshot.name
        return Response(data)


class CommunityLibrarySnapshotQsetView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, snapshot_id):
        entry = get_object_or_404(CommunityLibraryEntry, pk=pk)
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
