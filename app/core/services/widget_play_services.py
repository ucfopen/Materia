import logging
import uuid

from core.models import Log, LogPlay
from core.services.semester_service import SemesterService
from core.utils.http_util import parse_bool
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone

logger = logging.getLogger("django")


class WidgetPlayInitService:

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
            # environment_data="",
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

        if not is_embedded and instance.embedded_only:
            return WidgetPlayValidationService.INVALID_EMBEDDED_ONLY

        if not instance.playable_by_current_user(request.user):
            return WidgetPlayValidationService.INVALID_NOT_PLAYABLE

        instance_availability = instance.availability_status()
        if not instance_availability["is_open"]:
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
