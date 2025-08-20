import logging

from core.models import LogPlay, UserExtraAttempts
from core.serializers import (
    QuestionSetSerializer,
    ScoreDetailsForPlaySerializer,
    ScoreDetailsForPreviewSerializer,
    ScoresForUserSerializer,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from scoring.module_factory import ScoreModuleFactory
from util.message_util import MsgBuilder
from util.semester_util import SemesterUtil

logger = logging.getLogger(__name__)


class ScoresView(APIView):
    http_method_names = ["get"]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ScoresForUserSerializer(data=request.query_params)
        if serializer.is_valid(raise_exception=True):
            validated = serializer.validated_data

            instance = validated.get("instance")
            user = validated.get("user")
            context = validated.get("context", None)
            """
            access perms require either:
            the user id in the API request matches the current user OR
            the current user has authorship permissions to the instance
            """
            if (
                request.user.id != user.id
                and not instance.permissions.filter(user=request.user).exists()
            ):
                return MsgBuilder.no_perm().as_drf_response()

            plays = LogPlay.objects.filter(user=user, instance=instance)

            if validated.get("context"):
                plays = plays.filter(context_id=context)
            else:
                semester = SemesterUtil.get_current_semester()
                plays = plays.filter(semester=semester)

            scores = []
            for play in plays.order_by("-created_at"):
                module = ScoreModuleFactory.create_score_module(
                    instance=instance, play=play
                )

                details = module.get_score_report()

                scores.append(
                    {
                        "id": play.id,
                        "created_at": int(play.created_at.timestamp()),
                        "percent": details.get("overview", {}).get("score", 0),
                    }
                )

            attempts_used = 0 if not context else len(plays)

            # TODO update filter params when we fix UserExtraAttempts fields
            extra_attempts = UserExtraAttempts.objects.filter(
                inst_id=instance.id,
                user_id=user.id,
                context_id=context,
            ).first()

            extra_attempts = 0 if extra_attempts is None else extra_attempts

            return Response(
                {
                    "scores": scores,
                    "attemptsLeft": (
                        instance.attempts - attempts_used + extra_attempts
                    ),
                }
            )


class ScoresDetailView(APIView):
    http_method_names = ["get"]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        NOTE preview perms are not explicitly validated (beyond IsAuthenticated)
            Preview records being stored in session effectively acts as validation
        """
        if request.query_params.get("preview_inst_id"):
            serializer = ScoreDetailsForPreviewSerializer(data=request.query_params)
            if serializer.is_valid(raise_exception=True):
                validated = serializer.validated_data

                logs_key = f"previewPlayLogs.{validated.get("play_id")}"
                preview_logs = request.session.get(logs_key, [])
                preview_inst = validated.get("preview_inst_id")

                if len(preview_logs) == 0:
                    return MsgBuilder.expired().as_drf_response()

                module = ScoreModuleFactory.create_score_module_for_preview(
                    instance=preview_inst,
                    preview_id=validated.get("play_id"),
                    logs=preview_logs,
                    user=request.user,
                )

                response = module.get_score_report()
                response["qset"] = QuestionSetSerializer(
                    preview_inst.get_latest_qset()
                ).data

                return Response(response)

        else:
            serializer = ScoreDetailsForPlaySerializer(data=request.query_params)
            if serializer.is_valid(raise_exception=True):
                validated = serializer.validated_data

                play = validated.get("play_id")

                """
                access perms require either:
                The user in the play matches the current user OR
                The current user has authorship permissions to the instance associated with the play
                """
                if (
                    request.user.id != play.user.id
                    and not play.instance.permissions.filter(user=request.user).exists()
                ):
                    return MsgBuilder.no_perm().as_drf_response()

                module = ScoreModuleFactory.create_score_module(
                    instance=play.instance, play=play
                )

                response = module.get_score_report()
                qset_data = play.qset
                response["qset"] = (
                    QuestionSetSerializer(qset_data).data
                    if qset_data
                    else {"version": None, "data": None}
                )

                return Response(response)
