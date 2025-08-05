import logging
import uuid
from datetime import datetime

from core.models import LogPlay
from django.utils.timezone import make_aware
from util.http_util import parse_bool
from util.semester_util import SemesterUtil

logger = logging.getLogger("django")


class WidgetPlayInitService:

    @staticmethod
    def init_play(request, instance, user):
        play = LogPlay(
            auth="",
            context_id="",
            created_at=make_aware(datetime.now()),
            elapsed=0,
            id=str(uuid.uuid4()),
            instance=instance,
            ip=request.META.get("REMOTE_ADDR"),
            is_complete=False,
            is_valid=True,
            percent=0,
            referrer_url=request.META.get("HTTP_REFERER", ""),
            qset=instance.get_latest_qset(),
            score=0,
            score_possible=0,
            semester=SemesterUtil.get_current_semester(),
            user=user,
        )

        play.save()
        return play

    def init_preview():
        return str(uuid.uuid4())


class WidgetPlayValidationService:

    INVALID_EMBEDDED_ONLY = "embedded_only"
    INVALID_NOT_PLAYABLE = "not_playable_by_user"
    INVALID_NOT_YET_OPEN = "not_yet_open"
    INVALID_DRAFT_NOT_PLAYABLE = "draft_not_playable"
    INVALID_RETIRED_WIDGET = "widget_retired"
    INVALID_NO_ATTEMPTS = "no_attempts"
    VALID_WITH_PRE_EMBED = "pre_embed"
    VALID = "valid"

    def validate_widget_context(
        self, request, instance, is_demo=False, is_preview=False, is_embedded=False
    ):

        autoplay = parse_bool(request.GET.get("autoplay", None), True)

        if not is_embedded and instance.embedded_only:
            return self.INVALID_EMBEDDED_ONLY

        if not instance.playable_by_current_user(request.user):
            return self.INVALID_NOT_PLAYABLE

        instance_status = instance.status()
        if not instance_status["is_open"]:
            return self.INVALID_NOT_YET_OPEN

        if not instance_status["has_attempts"]:
            return self.INVALID_NO_ATTEMPTS

        if not is_preview and instance.is_draft:
            return self.INVALID_DRAFT_NOT_PLAYABLE

        if not instance.widget.is_playable:
            return self.INVALID_RETIRED_WIDGET

        if autoplay is False:
            return self.VALID_WITH_PRE_EMBED

        return self.VALID
