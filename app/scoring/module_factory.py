import logging
import os
import types
from datetime import datetime
from pathlib import Path
from typing import Optional, Type

from core.models import Log, LogPlay, User, WidgetInstance
from scoring.module import ScoreModule
from core.services.semester_service import SemesterService

logger = logging.getLogger(__name__)


class ScoreModuleFactory:

    @classmethod
    def create_score_module(
        cls, instance: WidgetInstance, play: LogPlay
    ) -> Optional[ScoreModule]:

        try:
            widget_folder = f"staticfiles/widget/{instance.widget.id}-{instance.widget.clean_name}/_score-modules"
            script_path = os.path.join(widget_folder, "score_module.py")

            ScoreClass = cls._load_score_class(script_path, instance)
            if not ScoreClass:
                logger.error(f"No score module found for widget {instance.widget.id}")
                return None

            # Create and return an instance of the score module
            return ScoreClass(play=play)

        except Exception as e:
            import traceback

            logger.error(f"Failed to load score module: {e}\n{traceback.format_exc()}")
            return None

    @staticmethod
    def _load_score_class(
        script_path: str, instance: WidgetInstance
    ) -> Optional[Type[ScoreModule]]:
        try:
            code = Path(script_path).read_text()
            mod = types.ModuleType("temp_score_module")
            exec(code, mod.__dict__)
            return getattr(mod, instance.widget.score_module, None)
        except Exception as e:
            logger.error(f"Failed to load score module: {e}")
            return None

    @classmethod
    def create_score_module_for_preview(
        cls,
        instance: WidgetInstance,
        preview_id: str,
        logs: list,
        user: User,
    ) -> Optional[ScoreModule]:
        """
        Since previews don't use Logs and LogPlays from the ORM,
        we have to create synthetic versions that are then passed to the score module

        TODO: There is a low-possibility edge case where we assume the qset
                is the latest one, but if the qset is modified mid-preview the score screen
                will be given a different one. Do we care though? They're only previews.
        """
        synthetic_play = LogPlay(
            id=preview_id,
            instance=instance,
            is_valid=True,
            is_complete=True,
            created_at=datetime.now(),
            user=user,
            elapsed=0,
            qset=instance.get_latest_qset(),
            auth="",
            semester=SemesterService.get_current_semester(),
        )

        module = cls.create_score_module(instance=instance, play=synthetic_play)
        synthetic_logs = []
        for log in logs:
            synthetic_log = Log(
                item_id=log.get("item_id"),
                log_type=log.get("type"),
                play_id=preview_id,
                text=log.get("text", ""),
                value=log.get("value", ""),
                game_time=log.get("game_time", -1),
            )
            synthetic_logs.append(synthetic_log)

        module.logs = synthetic_logs
        return module
