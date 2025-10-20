import logging
import traceback

from api.filters import LogPlayFilterBackend
from core.models import Log, LogPlay, WidgetInstance
from core.permissions import PlaySessionInstancePermissions
from core.serializers import (
    PlayLogUpdateSerializer,
    PlaySessionCreateSerializer,
    PlaySessionSerializer,
)
from core.services import WidgetPlayInitService
from django.conf import settings
from django.db.models import Max
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

    def get_permissions(self):
        """
        Note that queryset filtering is handling some perms duties
        by checking access.
        PlaySessionInstancePermissions is mostly verifying perms based on
        guest access.
        """
        if self.action == "list":
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [PlaySessionInstancePermissions]

        return [permission() for permission in permission_classes]

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

    def get_serializer(self, *args, **kwargs):
        """
        PlaySessionSerializer operates on a number of kwargs to determine what fields to use
        To pass them in, we implement get_serializer and manually append each kwarg
        """
        inst_id = self.request.query_params.get("inst_id")
        include_user_info = ValidatorUtil.validate_bool(
            self.request.query_params.get("include_user_info"), default=False
        )
        include_activity = ValidatorUtil.validate_bool(
            self.request.query_params.get("include_activity"), default=False
        )

        kwargs["is_student_view"] = inst_id and PermManager.user_is_student(
            self.request.user
        )
        kwargs["include_activity"] = bool(include_activity)
        kwargs["include_user_info"] = bool(include_user_info) and not (
            inst_id and WidgetInstance.objects.filter(pk=inst_id).first().guest_access
        )

        return super().get_serializer(*args, **kwargs)

    def get_serializer_class(self):
        """
        get_serializer_class must be explicitly defined so get_serializer works as expected
        """
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

                # disallow plays for non-playable widget engines
                if not validated["instance"].widget.is_playable:
                    return MsgBuilder.failure(
                        "Failed to Create Play Session", "This widget is not playable."
                    ).as_drf_response()

                # init the new play
                new_play = WidgetPlayInitService.init_play(
                    request, validated["instance"], user
                )
                if not new_play.id:
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
                    self.check_object_permissions(request, play)

                    if not play.is_valid:
                        return MsgBuilder.failure(
                            msg="This play is no longer valid."
                        ).as_drf_response()

                    play.update_elapsed()

                    score_module = ScoreModuleFactory.create_score_module(
                        instance=play.instance, play=play
                    )

                    try:
                        score_module.validate_scores(in_process=True)
                    except Exception:
                        play.is_valid = False
                        play.save()

                        tbString = traceback.format_exc()
                        logger.error(
                            f"\nvalidation failure for play {play.id}:\n{tbString}"
                        )

                        return MsgBuilder.failure(
                            msg="This play did not pass validation."
                        ).as_drf_response()

                    # TODO: handle validation failure?

                    if score_module.finished:
                        play.set_complete(
                            score_module.verified_score,
                            score_module.total_questions,
                            score_module.calculated_percent,
                        )

                        if play.auth == "lti":

                            launch = LTILaunchService.get_session_launch(
                                request, play.lti_token
                            )

                            if launch:
                                context_history = LogPlay.objects.filter(
                                    instance=play.instance,
                                    user=play.user,
                                    context_id=play.context_id,
                                )
                                # Find the highest score for the current context
                                max_score = context_history.aggregate(
                                    Max("percent", default=play.percent)
                                ).get("percent__max", 0)
                                max_score = round(max_score, 2)

                                completed_time = int(
                                    play.created_at.timestamp() + play.elapsed
                                )

                                score_url = f"{settings.URLS["BASE_URL"]}scores/single/{play.instance.id}/{play.id}"

                                ags = AGSClient(launch)
                                completion = (
                                    ags.score_builder()
                                    .score_given(max_score)
                                    .score_maximum(100)
                                    .activity_progress("Completed")
                                    .grading_progress("FullyGraded")
                                    .timestamp(completed_time)
                                    .submission_url(score_url)
                                    .submit()
                                )

                                # TODO we should really have some kind of message provided to users
                                # when LTI completion is successful
                                logger.error(f"\ncompletion!\n{completion}\n")

                            else:
                                logger.error(
                                    "\nCould NOT recover launch from session!\n"
                                )
                                pass
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
