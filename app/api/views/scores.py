import logging

from api.authentication import EmbeddedGrant
from api.score_services import can_review_scores, score_history, score_report
from api.serializers import (
    QuestionSetSerializer,
    ScoreDetailsForPlaySerializer,
    ScoreDetailsForPreviewSerializer,
    ScoresForUserSerializer,
)
from community_library.models import LibraryEntry
from core.message_exception import MsgExpired, MsgNoPerm
from core.models import LogPlay, WidgetInstance
from core.services.perm_service import PermService
from core.utils.b64_util import Base64Util
from django.shortcuts import get_object_or_404
from lti.services.auth import LTIAuthService
from lti.services.launch import LTILaunchService
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
            the current user is a support user OR
            the current user is an author or staff where request is launched from LTI
            """
            is_author_or_staff = False
            if LTILaunchService.is_lti_launch(
                request
            ) and LTILaunchService.is_last_launch_still_valid(request):
                launch = request.lti_launch.get_launch_data()
                is_author_or_staff = LTIAuthService.is_user_course_author(
                    launch
                ) or LTIAuthService.is_user_staff(launch)

            if (
                request.user.id != user.id
                and not instance.permissions.filter(user=request.user).exists()
                and not PermService.is_superuser_or_elevated(request.user)
                and not is_author_or_staff
            ):
                raise MsgNoPerm()

            plays = LogPlay.objects.filter(
                user=user, instance=instance, is_complete=True
            )
            if isinstance(request.auth, EmbeddedGrant):
                plays = request.auth.plays().filter(is_complete=True)

            return Response(score_history(plays, instance, user, context))


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

                logs_key = f"previewPlayLogs.{validated.get('play_id')}"
                preview_logs = request.session.get(logs_key, [])
                preview_inst = validated.get("preview_inst_id")

                if len(preview_logs) == 0:
                    raise MsgExpired()

                snapshot_id = request.query_params.get("snapshot_id")
                entry_id = request.query_params.get("entry_id")
                snapshot = None
                qset_override = None

                if snapshot_id and entry_id:
                    entry = get_object_or_404(LibraryEntry, pk=entry_id)
                    snapshot = entry.snapshots.filter(pk=snapshot_id).first()

                    if not snapshot:
                        return Response({"error": "Snapshot not found."}, status=404)

                    qset_override = preview_inst.get_latest_qset()
                    qset_override.data = snapshot.qset.data
                    qset_override.version = snapshot.qset.version

                module = ScoreModuleFactory.create_score_module_for_preview(
                    instance=preview_inst,
                    preview_id=validated.get("play_id"),
                    logs=preview_logs,
                    user=request.user,
                    qset_override=qset_override,
                )

                response = module.get_score_report()

                if snapshot:
                    response["qset"] = {
                        "data": (
                            Base64Util.decode(snapshot.qset.data)
                            if snapshot.qset.data
                            else {}
                        ),
                        "version": snapshot.qset.version,
                    }
                else:
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
                launch = None
                if LTILaunchService.is_lti_launch(
                    request
                ) and LTILaunchService.is_last_launch_still_valid(request):
                    launch = request.lti_launch.get_launch_data()
                if not can_review_scores(
                    request.user, play.instance, play=play, launch_data=launch
                ):
                    raise MsgNoPerm()

                return Response(score_report(play))
