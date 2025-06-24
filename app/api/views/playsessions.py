import logging
from pprint import pformat

from api.filters import LogPlayFilterBackend
from core.models import Log, LogPlay, WidgetInstance
from core.serializers import (
    PlayLogUpdateSerializer,
    PlaySessionCreateSerializer,
    PlaySessionSerializer,
    PlaySessionStudentViewSerializer,
    PlaySessionWithExtrasSerializer,
    PlaySessionWithExtraUserInfoSerializer,
)
from django.http import JsonResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from util.custom_paginations import PageNumberWithTotalPagination
from util.logging.session_play import SessionPlay
from util.message_util import MsgBuilder
from util.perm_manager import PermManager
from util.widget.validator import ValidatorUtil

logger = logging.getLogger("django")


class PlaySessionPagination(PageNumberWithTotalPagination):
    page_size = 100
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_page_size(self, request):
        if request.query_params.get("include_activity"):
            return 8
        return self.page_size


class PlaySessionViewSet(viewsets.ModelViewSet):
    # TODO permissions checks:
    #   must have instance edit perms to access all logs associated with an instance
    #   must have instance play perms to CREATE, PUT play log
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = PlaySessionPagination
    filter_backends = [LogPlayFilterBackend, DjangoFilterBackend]

    queryset = LogPlay.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        # check guest access
        inst_id = request.query_params.get("inst_id")
        include_user_info = ValidatorUtil.validate_bool(
            request.query_params.get("include_user_info"), default=False
        )

        if inst_id and include_user_info:
            instance = WidgetInstance.objects.filter(pk=inst_id).first()
            if instance and instance.guest_access:
                for log in queryset:
                    log.user = None
                    log.user_id = None

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # we only need extras (widget name, inst name) when on the profile page
    def get_serializer_class(self):
        inst_id = self.request.query_params.get("inst_id")
        include_user_info = ValidatorUtil.validate_bool(
            self.request.query_params.get("include_user_info"), default=False
        )
        include_activity = ValidatorUtil.validate_bool(
            self.request.query_params.get("include_activity"), default=False
        )

        if inst_id and include_user_info:
            try:
                instance = WidgetInstance.objects.get(pk=inst_id)
            except WidgetInstance.DoesNotExist:
                # logger.error(f"WidgetInstance {inst_id} does not exist")
                # perhaps we should retunr the default seralizer instead
                logger.warning(
                    f"[get_serializer_class] WidgetInstance '{inst_id}' not found. "
                    f"Falling back to PlaySessionSerializer."
                )
                # PR TODO: Rework the method entirely to filter by method first(after this gets merged in)
                return PlaySessionSerializer
            if instance and instance.guest_access:
                # print("Widget is in guest mode, hiding user info")
                return PlaySessionSerializer
            else:
                # print("Widget is NOT in guest mode, showing user info")
                return PlaySessionWithExtraUserInfoSerializer

        elif inst_id and PermManager.user_is_student(self.request.user):
            return PlaySessionStudentViewSerializer

        elif include_activity:
            return PlaySessionWithExtrasSerializer

        else:
            return PlaySessionSerializer

    def create(self, request):
        serializer = PlaySessionCreateSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid(raise_exception=True):
            validated = serializer.validated_data
            session_play = SessionPlay()
            play_id = session_play.start(validated["instance"], request.user.id)
            # this is where the desired error handling from session_play gets handled
            if not play_id:
                logger.warning(
                    f"[Playsessions] Failed to start SessionPlay for instance"
                    f"{validated["instance"].id} and user {request.user.id}"
                )
                return MsgBuilder.failure(
                    "Failed to Create Play Session",
                    "There was an error starting your play session. Please try again.",
                ).as_drf_response(status=400)

        return JsonResponse({"playId": play_id})

    def update(self, request, pk=None):
        if not pk:
            return MsgBuilder.invalid_input().as_drf_response()

        update_serializer = PlayLogUpdateSerializer(
            data=request.data, context={"request": request, "session_id": pk}
        )

        if update_serializer.is_valid(raise_exception=True):

            try:
                is_preview = update_serializer.validated_data["is_preview"]
                logs = update_serializer.validated_data["logs"]

                # using many=True in serializer returns a double-nested list
                if (
                    isinstance(logs, list)
                    and len(logs) > 0
                    and isinstance(logs[0], list)
                ):
                    logs = logs[0]

                for log in logs:
                    log_model = Log(
                        play_id=pk,
                        log_type=log.get("type"),
                        item_id=log.get("item_id"),
                        text=log.get("text", ""),
                        value=log.get("value", ""),
                        game_time=log.get("game_time", -1),
                    )

                    # only plays are saved to the db - previews are stored in request session (see below)
                    if not is_preview:
                        log_model.save()
                    # TODO put preview logs in session

                if not is_preview:
                    session = SessionPlay(pk)
                    session.update_elapsed()
                else:
                    preview_play_id = update_serializer.validated_data[
                        "preview_play_id"
                    ]
                    # we will combined them not override them
                    preview_session_key = f"previewPlayLogs.{preview_play_id}"
                    existing_logs = request.session.get(preview_session_key, [])
                    request.session[preview_session_key] = existing_logs + logs
                    request.session.modified = True

                return Response({"status": status.HTTP_200_OK, "success": True})

            except Exception as e:
                logger.error("play session log save failure:")
                logger.error(pformat(e))
                return MsgBuilder.failure(
                    "Failed to Save", "Your play logs could not be saved."
                ).as_drf_response()

    def destroy(self, request, *args, **kwargs):
        return Response(
            {
                "detail": "This operation is not allowed.",
                "status": status.HTTP_403_FORBIDDEN,
            }
        )

    @action(detail=True, methods=["get"])
    def verify(self, request, pk=None):
        session = LogPlay.objects.get(id=pk)

        if session.is_valid:
            return Response({"status": status.HTTP_200_OK, "valid": True})
        else:
            return Response({"status": status.HTTP_401_UNAUTHORIZED, "valid": False})
