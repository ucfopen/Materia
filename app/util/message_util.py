# Util class for creating messages for API errors. Returns JsonResponses that can be
# directly passed back from the endpoint. The front-end will detect these errors and
# display or handle them.
from enum import Enum

from django.http import JsonResponse


class MsgSeverity(Enum):
    ERROR = "error"
    NOTICE = "notice"
    WARN = "warn"


class MsgType(Enum):
    GENERAL = 0
    INVALID_INPUT = 1
    NO_LOGIN = 2
    NO_PERM = 3
    STUDENT_COLLAB = 4
    FAILURE = 5
    NOT_FOUND = 6
    EXPIRED = 7


class Msg:
    def __init__(
            self, title: str, msg: str, msg_type: MsgType = MsgType.GENERAL, severity: MsgSeverity = MsgSeverity.ERROR,
            halt: bool = False, status: int = 403
    ):
        self.msg_type = msg_type
        self.title = title
        self.msg = msg
        self.severity = severity
        self.halt = halt
        self.status = status

    def as_json_response(self) -> JsonResponse:
        return JsonResponse({
            "title": self.title,
            "msg": self.msg,
            "type": self.severity.value,
            "halt": self.halt,
        }, status=self.status)


class MsgBuilder:
    @staticmethod
    def invalid_input(title: str = "Validation Error", msg: str = "") -> Msg:
        return Msg(title, msg, MsgType.INVALID_INPUT, MsgSeverity.ERROR, True)

    @staticmethod
    def no_login(
        title="Invalid Login",
        msg="You have been logged out, and must login again to continue",
    ) -> Msg:
        return Msg(title, msg, MsgType.NO_LOGIN, MsgSeverity.ERROR, True)
        # TODO set_flash, see php

    @staticmethod
    def no_perm(
        title: str = "Permission Denied",
        msg: str = "You do not have permission to access the requested content",
    ) -> Msg:
        return Msg(title, msg, MsgType.NO_PERM, MsgSeverity.WARN, False, 401)

    @staticmethod
    def student_collab(
        title="Share Not Allowed",
        msg="Students cannot be added as collaborator to widgets that have guest access disabled"
    ) -> Msg:
        return Msg(title, msg, MsgType.STUDENT_COLLAB, MsgSeverity.ERROR, False, 401)

    @staticmethod
    def failure(
        title: str = "Action Failed",
        msg: str = "The requested action could not be completed",
    ) -> Msg:
        return Msg(title, msg, MsgType.FAILURE, MsgSeverity.ERROR, False, 403)

    @staticmethod
    def not_found(
        title="Not Found",
        msg="The requested content could not be found",
    ) -> Msg:
        return Msg(title, msg, MsgType.NOT_FOUND, MsgSeverity.ERROR, False, 404)

    @staticmethod
    def expired(
        title="Expired",
        msg="The requested content has been expired and is no longer available",
    ) -> Msg:
        return Msg(title, msg, MsgType.EXPIRED, MsgSeverity.ERROR, False, 410)
