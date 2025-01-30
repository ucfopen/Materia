from datetime import datetime

from django.utils.timezone import make_aware

from core.models import Log
from util.logging.session_play import SessionPlay
from util.widget.validator import ValidatorUtil


class SessionLogger:

    # Takes a list of logs and saves all of them
    @staticmethod
    def store_log_array(play_session: SessionPlay, logs: list[dict]):
        # Validate play_session
        if play_session.is_preview or not ValidatorUtil.is_valid_long_hash(play_session.data.id):
            print("Incorrect play_id")  # TODO: better logging
            return

        # Validate logs
        if not isinstance(logs, list) or len(logs) == 0:
            print("No logs sent")  # TODO: better logging
            return

        # Process and save each log
        for log in logs:
            log_type = default_if_none(log.get("type"), 0)
            item_id = default_if_none(log.get("item_id"), "")
            text = default_if_none(log.get("text"), "")
            value = default_if_none(log.get("value"), "")
            game_time = default_if_none(log.get("game_time"), 0)
            created_at = make_aware(datetime.now())

            SessionLogger.add_log(
                SessionLogger.get_log_type(log_type), item_id, text,
                value, game_time, created_at, play_session
            )

    # Shortcut for adding a single log
    @staticmethod
    def add_log(
            log_type: str, item_id: str, text: str, value: str, game_time: int,
            created_at: datetime, play_id: SessionPlay
    ) -> Log:
        log = Log(
            play_id=play_id.data.id,  # TODO change this if we end up making it a foreign key field
            log_type=log_type,
            item_id=item_id,
            text=text,
            value=value,
            game_time=game_time,
            created_at=created_at,
        )

        if not play_id.is_preview:
            log.save()

        return log

    @staticmethod
    def get_log_type(log_type_id: int) -> str:
        # TODO: some of these don't seem to have equivalents in python. is this intentional?
        match log_type_id:
            case 1:
                return Log.LogType.WIDGET_START
            case 2:
                return Log.LogType.WIDGET_END

            case 4:
                return Log.LogType.WIDGET_RESTART

            case 5:
                # return Log.LogType.ASSET_LOADING
                return Log.LogType.EMPTY

            case 6:
                # return Log.LogType.ASSET_LOADED
                return Log.LogType.EMPTY

            case 7:
                # return Log.LogType.FRAMEWORK_INIT
                return Log.LogType.WIDGET_CORE_INIT

            case 8:
                # return Log.LogType.PLAY_REQUEST
                return Log.LogType.WIDGET_PLAY_REQ

            case 9:
                # return Log.LogType.PLAY_CREATED
                return Log.LogType.WIDGET_PLAY_START

            case 13:
                # return Log.LogType.LOG_IN
                return Log.LogType.WIDGET_LOGIN

            case 15:
                # return Log.LogType.WIDGET_STATE_CHANGE
                return Log.LogType.WIDGET_STATE

            case 500:
                return Log.LogType.KEY_PRESS

            case 1000:
                return Log.LogType.BUTTON_PRESS

            case 1001:
                # return Log.LogType.WIDGET_INTERACTION
                return Log.LogType.SCORE_WIDGET_INTERACTION

            case 1002:
                # return Log.LogType.FINAL_SCORE_FROM_CLIENT
                return Log.LogType.SCORE_FINAL_FROM_CLIENT

            case 1004:
                # return Log.LogType.QUESTION_ANSWERED
                return Log.LogType.SCORE_QUESTION_ANSWERED

            case 1006:
                return Log.LogType.SCORE_PARTICIPATION

            case 1008:
                # return Log.LogType.SCORE_FEEDBACK
                return Log.LogType.EMPTY

            case 1009:
                # return Log.LogType.SCORE_ALERT
                return Log.LogType.EMPTY

            case 1500:
                return Log.LogType.ERROR_GENERAL

            case 1509:
                return Log.LogType.ERROR_TIME_VALIDATION

            case 2000:
                return Log.LogType.DATA

            case _:
                return Log.LogType.EMPTY


# TODO maybe move this into a util class?
def default_if_none(value, default):
    if value is None:
        return default
    else:
        return value
