import logging
import uuid

from core.models import Log, LogPlay, Lti, LtiPlayState
from core.services.semester_service import SemesterService
from core.utils.http_util import parse_bool
from django.contrib.auth.models import AnonymousUser
from django.db import transaction
from django.utils import timezone
from lti.ags.util import AGSUtil
from lti.services.launch import LTILaunchService

logger = logging.getLogger(__name__)


class WidgetPlayInitService:

    @staticmethod
    @transaction.atomic
    def init_lti_play(request, instance, user, launch_data, *, deployment_id):
        play = WidgetPlayInitService.init_play(request, instance, user)
        WidgetPlayInitService.attach_lti_state(
            play, instance, launch_data, deployment_id=deployment_id
        )
        return play

    @staticmethod
    def attach_lti_state(play, instance, launch_data, *, deployment_id=None):
        play.auth = "lti"
        play.lti_token = play.id
        play.context_id = LTILaunchService.get_context_id(launch_data)
        play.save()
        associations = Lti.objects.filter(
            widget_instance=instance,
            resource_link=LTILaunchService.get_resource_link(launch_data),
        )
        if deployment_id is not None:
            association = associations.get(deployment_id=deployment_id)
        else:
            association = associations.get(
                deployment__deployment_id=LTILaunchService.get_deployment_from_launch(
                    launch_data
                )
            )
        LtiPlayState.objects.create(
            play=play,
            lti_association=association,
            ags_line_item=AGSUtil.get_line_item_from_launch(launch_data) or "",
            ags_user_id=AGSUtil.get_ags_user_id(launch_data) or "",
            ags_scoring_enabled=AGSUtil.is_ags_scoring_available(launch_data),
        )

    @staticmethod
    def init_play(request, instance, user):

        created_at = timezone.now()
        ip = request.META.get("REMOTE_ADDR")
        if isinstance(user, AnonymousUser):
            user = None

        play = LogPlay(
            auth="",
            context_id="",
            created_at=created_at,
            elapsed=0,
            id=str(uuid.uuid4()),
            instance=instance,
            ip=ip,
            is_complete=False,
            is_valid=True,
            percent=0,
            referrer_url=request.META.get("HTTP_REFERER", ""),
            qset=instance.get_latest_qset(),
            score=0,
            score_possible=0,
            semester=SemesterService.get_current_semester(),
            user=user,
        )

        play.save()

        start_log = Log(
            log_type=Log.LogType.WIDGET_START,
            play_id=play.id,
            item_id="0",
            text="",
            value=play.id,
            created_at=created_at,
            game_time=0,
            ip=ip,
        )

        start_log.save()
        return play

    @staticmethod
    def init_preview(request):
        preview_key = str(uuid.uuid4())
        session_key = f"previewPlayLogs.{preview_key}"
        request.session[session_key] = []
        request.session[session_key].append(
            {
                "type": Log.LogType.WIDGET_PLAY_START,
                "play_id": preview_key,
                "item_id": "0",
                "text": "",
                "value": preview_key,
                "game_time": "0",
            }
        )
        request.session.modified = True
        return preview_key


class WidgetPlayValidationService:

    INVALID_EMBEDDED_ONLY = "embedded_only"
    INVALID_NOT_PLAYABLE = "not_playable_by_user"
    INVALID_NOT_YET_OPEN = "not_yet_open"
    INVALID_DRAFT_NOT_PLAYABLE = "draft_not_playable"
    INVALID_RETIRED_WIDGET = "widget_retired"
    INVALID_NO_ATTEMPTS = "no_attempts"
    INVALID_RECOVERY_TOKEN = "bad_recovery_token"
    VALID_WITH_PRE_EMBED = "pre_embed"
    VALID = "valid"

    @staticmethod
    def validate_widget_context(
        request,
        instance,
        has_guest_access=False,
        is_preview=False,
        is_embedded=False,
        context_id=None,
    ):

        autoplay = parse_bool(request.GET.get("autoplay", None), True)

        if not is_preview and not is_embedded and instance.embedded_only:
            return WidgetPlayValidationService.INVALID_EMBEDDED_ONLY

        if not instance.playable_by_current_user(request.user):
            return WidgetPlayValidationService.INVALID_NOT_PLAYABLE

        instance_availability = instance.availability_status()
        if not is_preview and not instance_availability["is_open"]:
            return WidgetPlayValidationService.INVALID_NOT_YET_OPEN

        if not has_guest_access:
            if not instance.user_has_attempts(request.user, context_id):
                return WidgetPlayValidationService.INVALID_NO_ATTEMPTS

        if not is_preview and instance.is_draft:
            return WidgetPlayValidationService.INVALID_DRAFT_NOT_PLAYABLE

        if not instance.widget.is_playable:
            return WidgetPlayValidationService.INVALID_RETIRED_WIDGET

        if autoplay is False:
            return WidgetPlayValidationService.VALID_WITH_PRE_EMBED

        return WidgetPlayValidationService.VALID
