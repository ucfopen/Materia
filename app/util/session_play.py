import uuid
from datetime import datetime

from django.contrib.auth.models import User
from django.utils.timezone import make_aware

from core.models import WidgetInstance, LogPlay, DateRange, WidgetQset


class SessionPlay:

    def __init__(self):
        self.id: str | None = None
        self.created_at: datetime | None = None
        self.user: User | None = None
        self.instance: WidgetInstance | None = None
        self.context_id: str | None = None
        self.is_preview: bool | None = None
        self.qset: WidgetQset | None = None
        self.environment_data: dict | None = None
        self.auth: str | None = None
        self.referrer_url: str | None = None
        self.semester: DateRange | None = None

    def start(self, instance: WidgetInstance, user_id: int = 0, context_id: str = '', is_preview: bool = False) -> str | None:
        # TODO: if inst_id is not valid hash, return None (do we need this?)

        self.created_at = make_aware(datetime.now())
        self.user = None if instance.guest_access else None # TODO
        self.instance = instance
        self.context_id = context_id
        self.is_preview = is_preview
        self.qset = instance.qset
        self.environment_data = {
            # TODO
        }

        self.auth = '' # TODO
        self.referrer_url = ''

        # TODO handle is_preview

        self.semester = DateRange.objects.get(pk=5) # TODO

        # TODO clear play logs summary cache

        result = self.save_new_play()
        if not result:
            # TODO logging
            return None

        # TODO set user is playing, session logger, etc
        return self.id

    def save_new_play(self) -> bool:
        # Generate a valid id
        log_id = ''
        for i in range(0, 25): # TODO: make max attempts a config variable
            log_id = str(uuid.uuid4())

            if len(LogPlay.objects.filter(pk=log_id)) == 0:
                # Good ID found, create log play object
                self.id = log_id
                result = self.create_log_play(log_id)
                return result
            else:
                # TODO: log messages warning collision detects. check php
                pass

        return False

    def create_log_play(self, id: str):
        log_play = LogPlay(
            id=id,
            instance=self.instance,
            created_at=self.created_at,
            elapsed=0,
            user=self.user,
            is_valid='1',  # TODO use booleans?
            is_complete=False,
            ip='',  # TODO
            qset=self.qset,
            environment_data='',  # TODO
            auth=self.auth,
            referrer_url=self.referrer_url,
            context_id=self.context_id,
            semester=self.semester,
            score=0.0, # TODO: look into these 3
            score_possible=0,
            percent=0,
        )

        try:
            log_play.save()
            return True
        except Exception as e:
            # TODO logging
            print(e)
            return False