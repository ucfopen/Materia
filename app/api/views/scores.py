import logging

from api.serializers import (
    QuestionSetSerializer,
    ScoreDetailsForPlaySerializer,
    ScoreDetailsForPreviewSerializer,
    ScoresForUserSerializer,
)
from core.message_exception import MsgExpired, MsgNoPerm
from core.models import LogPlay, WidgetInstance
from core.services.perm_service import PermService
from core.services.semester_service import SemesterService
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from scoring.module_factory import ScoreModuleFactory

logger = logging.getLogger(__name__)


class ScoresView(APIView):
    http_method_names = ["get"]

    def get_permissions(self):

        inst_id = self.request.query_params.get("inst_id")
        if inst_id is not None:
            instance = WidgetInstance.objects.get(pk=inst_id)

            if instance and instance.guest_access is True:
                permission_classes = [AllowAny]
            else:
                permission_classes = [IsAuthenticated]

        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

    def get(self, request):

        serializer = ScoresForUserSerializer(data=request.query_params)
        if serializer.is_valid(raise_exception=True):
            validated = serializer.validated_data

            instance = validated.get("inst_id")
            user = validated.get("user")
            context = validated.get("context", "")
            """
            access perms require either:
            the user id in the API request matches the current user OR
            the current user has authorship permissions to the instance OR
            the current user is a support user
            """
            if (
                request.user.id != user.id
                and not instance.permissions.filter(user=request.user).exists()
                and not PermService.is_superuser_or_elevated(request.user)
            ):
                raise MsgNoPerm()

            plays = LogPlay.objects.filter(
                user=user, instance=instance, is_complete=True
            )

            semester = SemesterService.get_current_semester()

            scores = []
            for play in plays.order_by("-created_at"):
                module = ScoreModuleFactory.create_score_module(
                    instance=instance, play=play
                )

                details = module.get_score_report()

                scores.append(
                    {
                        "id": play.id,
                        "created_at": play.created_at.isoformat(),
                        "percent": details.get("overview", {}).get("score", 0),
                        "current_semester": play.semester == semester,
                    }
                )

            attempts_left = instance.attempts_left_for_user(user, context)

            return Response(
                {
                    "scores": scores,
                    "attemptsLeft": attempts_left,
                }
            )


class ScoresDetailView(APIView):
    http_method_names = ["get"]

    def get_permissions(self):

        preview_inst_id = self.request.query_params.get("preview_inst_id")
        play_id = self.request.query_params.get("play_id")

        if preview_inst_id is not None:
            permission_classes = [IsAuthenticated]

        elif play_id is not None:
            play = LogPlay.objects.get(pk=play_id)
            if play and play.instance.guest_access is True:
                permission_classes = [AllowAny]
            else:
                permission_classes = [IsAuthenticated]

        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

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
                    raise MsgExpired()

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
                !!! NOTE guest plays add some complexity here:
                    1. ALL guest plays will have a user id of None
                    2. Because we can't verify whether the current user is
                    associated with the play, all anonymous plays are visible
                    to everyone
                """
                user_id = (
                    None if request.user.is_authenticated is False else request.user.id
                )
                play_user_id = None if play.user is None else play.user.id

                if (
                    user_id != play_user_id
                    and play_user_id is not None
                    and not play.instance.permissions.filter(user=request.user).exists()
                    and not PermService.is_superuser_or_elevated(request.user)
                ):
                    raise MsgNoPerm()

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
