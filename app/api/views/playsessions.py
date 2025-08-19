import logging
import traceback

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
from core.services import WidgetPlayInitService
from django.http import JsonResponse
from django_filters.rest_framework import DjangoFilterBackend
from lti.ags.client import AGSClient
from lti.services.launch import LTILaunchService
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from scoring.module_factory import ScoreModuleFactory
from util.custom_paginations import PageNumberWithTotalPagination
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

            if validated["is_preview"] is True:

                preview_id = WidgetPlayInitService.init_preview(request)
                return JsonResponse({"playId": preview_id})

            else:
                user = (
                    request.user
                    if validated["instance"].guest_access is False
                    else None
                )
                new_play = WidgetPlayInitService.init_play(
                    request, validated["instance"], user
                )

                # this is where the desired error handling from session_play gets handled
                if not new_play.id:
                    logger.warning(
                        f"[Playsessions] Failed to start play session for instance"
                        f"{validated["instance"].id} and user {user}"
                    )
                    return MsgBuilder.failure(
                        "Failed to Create Play Session",
                        "There was an error starting your play session. Please try again.",
                    ).as_drf_response()

                return JsonResponse({"playId": new_play.id})

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

                if not is_preview:
                    play = LogPlay.objects.get(pk=pk)
                    play.update_elapsed()

                    score_module = ScoreModuleFactory.create_score_module(
                        instance=play.instance, play=play
                    )

                    score_module.validate_scores()

                    # TODO: handle validation failure?

                    if score_module.finished:
                        play.set_complete(
                            score_module.verified_score,
                            score_module.total_questions,
                            score_module.calculated_percent,
                        )
                else:
                    preview_play_id = update_serializer.validated_data[
                        "preview_play_id"
                    ]
                    # we will combined them not override them
                    preview_session_key = f"previewPlayLogs.{preview_play_id}"
                    existing_logs = request.session.get(preview_session_key, [])
                    request.session[preview_session_key] = existing_logs + logs
                    request.session.modified = True

                """
                TEMPORARY HOOK FOR LTI SCORING
                this is functional but will need to be replaced with a finalized version
                that handles results from the score module.
                it's being included here as an example of proposed AGS submission flow
                """
                for log in logs:
                    if log.get("type") == "WIDGET_END":
                        log_play = LogPlay.objects.get(pk=pk)
                        if log_play.auth == "lti":

                            launch = LTILaunchService.get_session_launch(
                                request, log_play.lti_token
                            )

                            if launch:
                                completed_time = int(
                                    log_play.created_at.timestamp() + log_play.elapsed
                                )

                                ags = AGSClient(launch)
                                completion = (
                                    ags.score_builder()
                                    .score_given(100)
                                    .score_maximum(100)
                                    .activity_progress("Completed")
                                    .grading_progress("FullyGraded")
                                    .timestamp(completed_time)
                                    .submit()
                                )

                                logger.error(f"\ncompletion!\n{completion}\n")

                            else:
                                logger.error(
                                    "\nCould NOT recover launch from session!\n"
                                )
                                pass

                return Response({"status": status.HTTP_200_OK, "success": True})

            except Exception:
                logger.error("play session log save failure:")
                tbString = traceback.format_exc()
                logger.error(f"\ntraceback: {tbString}")
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
