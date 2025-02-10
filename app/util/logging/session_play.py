import uuid
from datetime import datetime
from typing import Self

from django.utils.timezone import make_aware

from core.models import WidgetInstance, LogPlay, DateRange
from util.scoring.scoring_util import ScoringUtil
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
                self.data.ip = ''  # TODO
                self.data.is_complete = False
                self.data.score = 0
                self.data.percent = 0
                self.data.elapsed = 0
                self.data.context_id = ''
                self.data.semester = DateRange.objects.get(pk=5)  # TODO
                self.is_preview = True

        # self.id: str | None = None
        # self.created_at: datetime | None = None
        # self.user: User | None = None
        # self.instance: WidgetInstance | None = None
        # self.context_id: str | None = None
        # self.is_preview: bool | None = None
        # self.qset: WidgetQset | None = None
        # self.environment_data: dict | None = None
        # self.auth: str | None = None
        # self.referrer_url: str | None = None
        # self.semester: DateRange | None = None

    def start(self, instance: WidgetInstance, user_id: int = 0, context_id: str = '',
              is_preview: bool = False) -> str | None:
        # TODO: if inst_id is not valid hash, return None (do we need this?)

        self.data.created_at = make_aware(datetime.now())
        self.data.user = None if instance.guest_access else None  # TODO
        self.data.instance = instance
        self.data.context_id = context_id
        self.data.is_preview = is_preview
        self.data.qset = instance.qset
        self.data.environment_data = ''

        self.data.auth = ''  # TODO
        self.data.referrer_url = ''

        self.data.ip = ''  # TODO
        self.data.elapsed = 0
        self.data.is_valid = '1'  # TODO
        self.data.is_complete = False
        self.data.score = 0.0  # TODO
        self.data.score_possible = 0  # TODO
        self.data.percent = 0  # TODO

        # TODO handle is_preview

        self.data.semester = DateRange.objects.get(pk=5)  # TODO

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

        self.data.elapsed = (make_aware(datetime.now()) - self.data.created_at).total_seconds()
        self.data.save()

    def set_complete(self, score, possible, percent):
        # Ensure percent can never exceed 100%
        percent = 100 if percent > 100 else percent

        max_percent = percent

        if not self.is_preview:
            self._invalidate()
            semester = DateRange.objects.get(pk=5)  # TODO fix

            # TODO: caching stuff, look at PHP

            # Update session play
            self.data.is_complete = True
            self.data.score = score
            self.data.score_possible = possible
            self.data.percent = percent
            self.data.save()

            # Determine the highest score of this user's history
            score_history = ScoringUtil.get_instance_score_history(self.data.instance, self.data.context_id)  # TODO: this is a 'private' field - maybe figure out a better solution

            for score_history_item in score_history:
                max_percent = max(max_percent, score_history_item.percent)

        # Notify plugins that the score has been saved
        # TODO Event::trigger('score_updated', ... see php

    # Ensures that this session play is playable by the current user and updated time elapsed
    def validate(self) -> bool:
        if self.data.instance.playable_by_current_user():
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
        log_id = ''
        for i in range(0, 25):  # TODO: make max attempts a config variable
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
    def validate_by_play_id(play_id: str) -> bool:
        session_play = SessionPlay.get_or_none(play_id)
        if not session_play:
            return False

        return session_play.validate()

    # def create_log_play(self, id: str):
    # log_play = LogPlay(
    #     id=id,
    #     instance=self.instance,
    #     created_at=self.created_at,
    #     elapsed=0,
    #     user=self.user,
    #     is_valid='1',  # TODO use booleans?
    #     is_complete=False,
    #     ip='',  # TODO
    #     qset=self.qset,
    #     environment_data='',  # TODO
    #     auth=self.auth,
    #     referrer_url=self.referrer_url,
    #     context_id=self.context_id,
    #     semester=self.semester,
    #     score=0.0, # TODO: look into these 3
    #     score_possible=0,
    #     percent=0,
    # )

    # try:
    #     log_play.save()
    #     return True
    # except Exception as e:
    #     # TODO logging
    #     print(e)
    #     return False
