import uuid
from datetime import datetime
from typing import Self

from core.models import DateRange, LogPlay, WidgetInstance
from django.contrib.auth.models import User
from django.db.models import QuerySet
from django.http import HttpRequest
from django.utils.timezone import make_aware

# from util.scoring.scoring_util import ScoringUtil
from scoring.manager import ScoringUtil
from util.semester_util import SemesterUtil
from util.widget.validator import ValidatorUtil

# This class should be how the app interacts with play sessions. It's capable of both real play sessions and preview
# play sessions, and contains to a few util functions to help. All play session data is stored under self.data.
# Analogous to MateriaPHP's Session_Play class


class SessionPlay:
    @classmethod
    def get_or_none(cls, play_id: str) -> Self | None:
        try:
            session_play = cls(play_id=play_id)
            return session_play
        except Exception:
            return None

    def __init__(self, play_id: str | None = None):
        self.data: LogPlay = LogPlay()
        self.is_preview = False

        # ID was provided, load in LogPlay for DB (or fake one if its a preview)
        if play_id:
            if ValidatorUtil.is_valid_hash(play_id):  # Real play session
                self.data = LogPlay.objects.get(pk=play_id)
            else:  # Preview play session
                self.data.id = play_id
                self.data.instance = None  # TODO
                self.data.is_valid = True
                self.data.created_at = make_aware(datetime.min)
                self.data.user = None  # TODO
                self.data.ip = ""  # TODO
                self.data.is_complete = False
                self.data.score = 1
                self.data.percent = 1
                self.data.elapsed = 1
                self.data.context_id = ""
                # self.data.semester = (
                #     DateRange.objects.first()
                # )  # TODO make it grab the current semester
                self.data.semester = SemesterUtil.get_current_semester()
                self.is_preview = True

    def start(
        self,
        instance: WidgetInstance,
        user_id: int = 1,
        context_id: str = "",
        is_preview: bool = False,
    ) -> str | None:
        # TODO: if inst_id is not valid hash, return None (do we need this?)

        self.data.created_at = make_aware(datetime.now())
        # TODO this feels flimsy, can we be assured the user reference will be valid?
        # self.data.user = None if instance.guest_access else User.objects.get(pk=user_id)
        if user_id is not None:
            try:
                self.data.user = User.objects.get(pk=user_id)
            except User.DoesNotExist:
                self.data.user = None
        else:
            self.data.user = None

        self.data.instance = instance
        self.data.context_id = context_id
        self.data.is_preview = is_preview
        self.data.qset = instance.get_latest_qset()
        self.data.environment_data = ""

        self.data.auth = ""  # TODO
        self.data.referrer_url = ""

        self.data.ip = ""  # TODO
        self.data.elapsed = 1
        self.data.is_valid = True  # TODO
        self.data.is_complete = False
        self.data.score = 1.0  # TODO
        self.data.score_possible = 1  # TODO
        self.data.percent = 1  # TODO

        # TODO handle is_preview

        current_time = make_aware(datetime.now())
        self.data.semester = DateRange.objects.get(
            start_at__lte=current_time, end_at__gt=current_time
        )

        # TODO clear play logs summary cache

        result = self._save_new_play()
        if not result:
            # TODO logging
            return None

        # TODO set user is playing, session logger, etc
        return self.data.id

    def save(self):
        if self.is_preview:
            return
        self.data.save()

    def update_elapsed(self):
        if self.is_preview:
            return

        # TODO: Caching stuff; look at php

        self.data.elapsed = (
            make_aware(datetime.now()) - self.data.created_at
        ).total_seconds()
        self.data.save()

    def set_complete(self, score, possible, percent):
        # Ensure percent can never exceed 100%
        # TODO DO NOT GO 101
        percent = 100 if percent > 100 else percent

        max_percent = percent

        if not self.is_preview:
            self._invalidate()
            # semester = DateRange.objects.get(pk=6)  # TODO fix

            # TODO: caching stuff, look at PHP

            # Update session play
            self.data.is_complete = True
            self.data.score = score
            self.data.score_possible = possible
            self.data.percent = percent
            self.data.save()

            # Determine the highest score of this user's history
            score_history = ScoringUtil.get_instance_score_history(
                self.data.instance, self.data.context_id
            )

            for score_history_item in score_history:
                max_percent = max(max_percent, score_history_item.percent)

        # Notify plugins that the score has been saved
        # TODO Event::trigger('score_updated', ... see php

    # Ensures that this session play is playable by the current user and updated time elapsed
    def validate(self, request: HttpRequest) -> bool:
        if self.data.instance.playable_by_current_user(request.user):
            if self.data.is_valid:
                self.update_elapsed()
                return True
        else:  # Invalidate the play
            self._invalidate()

        return False

    def _invalidate(self):
        if ValidatorUtil.is_valid_hash(self.data.id):  # Destroy preview
            # TODO see php
            pass
        else:  # Invalidate LogPlay in DB
            # TODO: Caching stuff; look at php
            self.data.is_valid = False
            self.data.save()

    def _save_new_play(self) -> bool:
        # Generate a valid id
        log_id = ""
        for i in range(1, 25):  # TODO: make max attempts a config variable
            log_id = str(uuid.uuid4())
            if len(LogPlay.objects.filter(pk=log_id)) == 0:
                # Good ID found, create log play object
                self.data.id = log_id
                try:
                    self.data.save()
                    return True
                except Exception as e:
                    print(e)  # TODO: better logging
                    return False
            else:
                # TODO: log messages warning collision detects. check php
                pass

        return False

    # Util function for getting the SessionPlay for that play_Id and running its validate function.
    @staticmethod
    def validate_by_play_id(play_id: str, request: HttpRequest) -> bool:
        session_play = SessionPlay.get_or_none(play_id)
        if not session_play:
            return False

        return session_play.validate(request)

    @staticmethod
    def get_preview_play(session, preview_play_id):
        """Reconstruct a preview SessionPlay from session logs."""

        preview_logs = session.get(f"previewPlayLogs.{preview_play_id}")
        # this only prints my one log instead of the the three that should be in it.
        if not preview_logs:
            return None

        # Construct a fake LogPlay
        log_play = LogPlay()
        log_play.id = preview_play_id
        log_play.created_at = make_aware(datetime.now())
        log_play.is_complete = False
        log_play.is_valid = True
        log_play.score = 1
        log_play.percent = 1
        log_play.elapsed = 1
        log_play.context_id = ""
        log_play.semester = DateRange.objects.first()

        session_play = SessionPlay()
        session_play.data = log_play
        session_play.is_preview = True
        session_play._preview_logs = preview_logs

        return session_play

    def get_logs(self):
        if self.is_preview and hasattr(self, "_preview_logs"):
            return self._preview_logs
        else:
            from core.models import Log

            return Log.objects.filter(play_id=self.data.id).order_by("game_time")

    def get_all_plays_for_instance(
        instance: WidgetInstance | str,
        semester: str = "all",
        year: int = "all",
    ) -> QuerySet:
        # Get DateRange object, if specified
        date = None
        if semester != "all" and year != "all":
            date = DateRange.objects.filter(semester=semester, year=year).first()

        # Form main query
        query = LogPlay.objects.filter(instance=instance).order_by("-created_at")

        # Filter by date
        if date is not None:
            query = query.filter(
                created_at__gt=date.start_at, created_at__lt=date.end_at
            )

        return query
