import logging
import uuid
from datetime import datetime

from core.models import Log, LogPlay
from django.contrib.auth.models import AnonymousUser
from django.utils.timezone import make_aware
from util.semester_util import SemesterUtil

logger = logging.getLogger("django")


class WidgetPlayInitService:

    @staticmethod
    def init_play(request, instance, user):

        created_at = make_aware(datetime.now())
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
            semester=SemesterUtil.get_current_semester(),
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
