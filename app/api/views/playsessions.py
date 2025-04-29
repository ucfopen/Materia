import logging
from pprint import pformat

from core.models import Log, LogPlay
from core.serializers import (
    PlayLogUpdateSerializer,
    PlaySessionCreateSerializer,
    PlaySessionSerializer,
    PlaySessionWithExtrasSerializer,
    PlaySessionStudentViewSerializer,
    PlaySessionWithExtraUserInfoSerializer,
)
from django.http import JsonResponse
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from util.logging.session_play import SessionPlay
from util.custom_paginations import PageNumberWithTotalPagination
from util.message_util import MsgBuilder
from util.perm_manager import PermManager

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

    # we only need extras (widget name, inst name) when on the profile page
    def get_serializer_class(self):
        if self.request.query_params.get("inst_id") and PermManager.user_is_student(self.request.user):
            return PlaySessionStudentViewSerializer
        elif self.request.query_params.get("inst_id") and self.request.query_params.get("include_user_info", False):
            return PlaySessionWithExtraUserInfoSerializer
        elif self.request.query_params.get("include_activity"):
            return PlaySessionWithExtrasSerializer
        else:
            return PlaySessionSerializer

    queryset = LogPlay.objects.none()

    # default queryset returns all plays for the current user
    # inst and widget names are only included via ?include_activity=true
    def get_queryset(self):
        inst_id = self.request.query_params.get("inst_id")
        if "pk" in self.kwargs:
            return LogPlay.objects.get(pk=self.kwargs["pk"])
        if inst_id is not None:
            semester = self.request.query_params.get("semester", "all")
            year = self.request.query_params.get("year", "all")
            return SessionPlay.get_all_plays_for_instance(inst_id, semester, year)
        else:
            if self.request.query_params.get("include_activity"):
                return LogPlay.objects.select_related(
                    "instance", "instance__widget"
                ).filter(user=self.request.user)
            else:
                return LogPlay.objects.filter(user=self.request.user)

    def create(self, request):
        serializer = PlaySessionCreateSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            validated = serializer.validated_data
            session_play = SessionPlay()
            play_id = session_play.start(validated["instance"], request.user.id)
            return JsonResponse({"playId": play_id})
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        if not pk:
            return MsgBuilder.invalid_input().as_drf_response()

        update_serializer = PlayLogUpdateSerializer(
            data=request.data, context={"request": request, "session_id": pk}
        )

        if update_serializer.is_valid():

            try:
                is_preview = update_serializer.validated_data["is_preview"]
                logs = update_serializer.validated_data["logs"]

                # using many=True in serializer returns a double-nested list. Manually flatten if required.
                if isinstance(logs, list) and logs[0] and isinstance(logs[0], list):
                    logs = logs[0]

                for log in logs:
                    log_model = Log(
                        play_id=pk,
                        log_type=log["type"],
                        item_id=log["item_id"],
                        text=log["text"],
                        value=log["value"],
                        game_time=log["game_time"],
                    )

                    # only plays are saved to the db - previews are stored in request session (see below)
                    if not is_preview:
                        log_model.save()
                    # TODO put preview logs in session

                if not is_preview:
                    session = SessionPlay(pk)
                    session.update_elapsed()
                else:
                    preview_session_key = (
                        f"preview_play_logs_{update_serializer.validated_data["preview_inst_id"]}_"
                        f"{update_serializer.validated_data["preview_play_id"]}"
                    )
                    if preview_session_key not in request.session:
                        request.session[preview_session_key] = []
                    request.session[preview_session_key].extend(logs)

                return Response({"status": status.HTTP_200_OK, "success": True})

            except Exception as e:
                logger.error("play session log save failure:")
                logger.error(pformat(e))
                return MsgBuilder.failure(
                    "Failed to Save", "Your play logs could not be saved."
                ).as_drf_response()

        else:
            return Response(
                update_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

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
