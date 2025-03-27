import logging

from core.models import LogPlay, PermObjectToUser, WidgetInstance, WidgetQset, LogActivity
from core.permissions import (
    CanCreateWidgetInstances,
    HasWidgetInstanceEditAccessOrReadOnly,
    IsSuperuser, HasWidgetInstanceEditAccess,
)
from core.serializers import (
    PlayIdSerializer,
    QuestionSetSerializer,
    ScoreSummarySerializer,
    WidgetInstanceSerializer,
    WidgetInstanceSerializerNoIdentifyingInfo, WidgetInstanceCopyRequestSerializer,
)
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from util.message_util import MsgBuilder
from util.perm_manager import PermManager
from util.widget.instance.instance_util import WidgetInstanceUtil

# from pprint import pformat
logger = logging.getLogger("django")


class WidgetInstancePagination(PageNumberPagination):
    page_size = 80
    page_size_query_param = "page_size"
    max_page_size = 80


# Viewset for widget instances.
# All users can access any instance, but if they are unable to play that instance (e.g. guest mode is disabled),
# any identifying info is stripped from the response.
# Only the superuser is able to get a list of all instances. Users however can get a list of their own instances.
class WidgetInstanceViewSet(viewsets.ModelViewSet):

    pagination_class = WidgetInstancePagination

    def get_queryset(self):
        # If user param is specified, return that user's instances. Otherwise, return all.
        # Make sure the user cannot access other user's lists of instances (unless superuser)
        user = self.request.user
        user_query = self.request.query_params.get("user")
        include_deleted = self.request.query_params.get("include_deleted", False)

        if user_query is not None and user_query == "me":
            return WidgetInstance.objects.filter(user=user, is_deleted=include_deleted).order_by("-created_at")
        elif user_query is not None and (user.is_superuser or str(user.id) == user_query):
            return WidgetInstance.objects.filter(user=user_query, is_deleted=include_deleted).order_by("-created_at")
        elif user_query is not None:
            return WidgetInstance.objects.none()
        else:
            return WidgetInstance.objects.all()

    def get_permissions(self):
        user_query = self.request.query_params.get("user")
        play_id = self.request.query_params.get("play_id")

        # Require special perms for list
        if self.action == "list":
            # Allow all if user is superuser
            if user_query is None:
                permission_classes = [IsSuperuser]
            # Otherwise, just make sure the user is authenticated. Do not allow reading if not. The queryset already
            # only contain this user's instances if they have requested their own.
            else:
                permission_classes = [IsAuthenticated]

        # A valid play ID grants access
        elif self.action == "get" and play_id is not None:
            permission_classes = [IsAuthenticated]

        # Special perms for creation
        elif self.action == "create":
            permission_classes = [(IsAuthenticated & CanCreateWidgetInstances) | IsSuperuser]

        # User needs full perms to delete widget
        elif self.action == "destroy":
            # TODO add check to make sure user has full perms
            permission_classes = [(IsAuthenticated & HasWidgetInstanceEditAccess) | IsSuperuser]

        # All other actions have default perms
        else:
            permission_classes = [
                IsAuthenticatedOrReadOnly & HasWidgetInstanceEditAccessOrReadOnly
            ]

        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        # User isn't getting a widget detail, instead they are listing or updating.
        # By that logic, they already can edit the widget.
        if self.action != "retrieve":
            return WidgetInstanceSerializer
        # Check if user can play the instance. If they can't, don't include identifying info about the instance
        else:
            if self.get_object().playable_by_current_user(self.request.user):
                return WidgetInstanceSerializer
            else:
                return WidgetInstanceSerializerNoIdentifyingInfo

    def perform_create(self, serializer):
        widget = serializer.validated_data["widget"]
        is_draft = serializer.validated_data["is_draft"]
        is_student = PermManager.user_is_student(self.request.user)

        # Check to see if this widget is editable
        if is_draft and not widget.is_editable:
            raise ValidationError("Non-editable widgets cannot be saved as drafts")

        # Make sure user can publish this widget
        if not is_draft and not widget.publishable_by(self.request.user):
            raise ValidationError("You cannot publish this widget")

        # Add and override some additional info, including user and student status stuffs
        serializer.save(
            user=self.request.user,
            is_student_made=is_student,
            guest_access=is_student,
            attempts=-1,
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        is_draft = serializer.validated_data.get("is_draft", instance.is_draft)
        guest_access = serializer.validated_data.get(
            "guest_access", instance.guest_access
        )

        # Check to see if this widget is editable
        if is_draft and not instance.widget.is_editable:
            raise ValidationError("Non-editable widgets cannot be saved as drafts")

        # Make sure user can publish this widget
        if not is_draft and not instance.widget.publishable_by(self.request.user):
            raise ValidationError("You cannot publish this widget")

        # Make sure student made widgets cannot leave guest access mode
        if instance.is_student_made:
            if guest_access is not True:
                raise ValidationError(
                    "Student-made widgets must stay in guest access mode"
                )
            serializer.validated_data["attempts"] = -1

        # TODO create session_activities for each updated field? see original PHP code

        serializer.save()

    def perform_destroy(self, instance):
        instance = self.get_object()

        # Clear all permissions on the object
        PermManager.clear_all_perms_for_object(instance.id, PermObjectToUser.ObjectType.INSTANCE)

        # TODO send event trigger

        # Set deleted flag
        instance.is_deleted = True
        instance.save()

        # Create activity log
        LogActivity.objects.create(
            user=self.request.user,
            type=LogActivity.TYPE_DELETE_WIDGET,
            item_id=instance.id,
            value_1=instance.name,
            value_2=instance.widget.id,
        )

    # /api/instances/<inst id>/question_sets/
    # ?latest=true GET param for only the latest qset
    # ?play_id=<play id> GET param to grant access
    @action(detail=True, methods=["get"])
    def question_sets(self, request, pk=None):
        instance = self.get_object()

        get_latest = request.query_params.get("latest", "false")
        play_id = request.query_params.get("play_id", None)

        if get_latest == "true":
            qset = instance.get_latest_qset()
            serializer = QuestionSetSerializer(qset)
            return Response(serializer.data)

        elif play_id is not None:
            play_id_serializer = PlayIdSerializer(data=play_id)
            if play_id_serializer.is_valid():
                qset = instance.get_qset_for_play(play_id)
                serializer = QuestionSetSerializer(qset)
                return Response(serializer.data)

        else:
            qsets = instance.qsets.all()
            serializer = QuestionSetSerializer(qsets, many=True)
            return Response(serializer.data)

    # /api/instances/<inst id>/question_sets/<qset id>
    # TODO this endpoint may not be required at all
    @action(detail=True, methods=["get"], url_path="question_sets/(?P<qset_id>[^/.]+)")
    def question_set(self, request, pk=None, qset_id=None):
        qset = WidgetQset.objects.filter(instance=pk, id=qset_id).first()
        serializer = QuestionSetSerializer(qset)
        return Response(serializer.data)

    # /api/instances/<inst id>/lock/
    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated & HasWidgetInstanceEditAccess])
    def lock(self, request, pk=None):
        return Response({"lock_obtained": WidgetInstanceUtil.get_lock(pk, request.user)})

    @action(detail=True, methods=["get"])
    def scores(self, request, pk=None):
        instance = self.get_object()

        logs_for_user = (
            LogPlay.objects.filter(instance=instance)
            .order_by("-created_at", "semester")
            .select_related("semester")
        )
        summary = ScoreSummarySerializer.create_from_plays(logs_for_user)

        serialized = ScoreSummarySerializer(data=summary, many=True)
        serialized.is_valid(raise_exception=True)
        return Response(serialized.data)

    # TODO this is a temp response until instance permissions comes fully online
    @action(detail=True, methods=["get", "put"])
    def perms(self, request, pk=None):
        return Response(
            {
                "user_perms": {request.user.id: [PermObjectToUser.Perm.FULL, None]},
                "widget_user_perms": {
                    request.user.id: [PermObjectToUser.Perm.FULL, None]
                },
            }
        )

    @action(detail=True, methods=["put"], permission_classes=[IsAuthenticated & HasWidgetInstanceEditAccess])
    def copy(self, request, pk=None):
        request_serializer = WidgetInstanceCopyRequestSerializer(data=request.data)
        if not request_serializer.is_valid():
            return Response(request_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        name = request_serializer.validated_data.get("name")
        copy_existing_perms = request_serializer.validated_data.get("copy_existing_perms")

        instance = self.get_object()
        try:
            duplicate = instance.duplicate(request.user, name, copy_existing_perms)
        except Exception as e:
            logger.error("Failed to copy widget instance:")
            logger.error(e)
            return MsgBuilder.failure(msg="Widget instance could not be copied.").as_drf_response()

        return Response(WidgetInstanceSerializer(duplicate).data)
