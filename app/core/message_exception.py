# Util class for creating messages for API errors. Raising a MsgException will
# eventually reach the exception handler, which will handle it as needed.
# The front-end will detect these errors and display or handle them.

from enum import Enum

from django.http import HttpRequest, JsonResponse
from rest_framework.response import Response


class MsgSeverity(Enum):
    ERROR = "error"
    NOTICE = "notice"
    WARN = "warn"


class MsgException(Exception):
    def __init__(
        self,
        title: str,
        msg: str | dict,
        severity: MsgSeverity = MsgSeverity.ERROR,
        halt: bool = False,
        status: int = 403,
    ):
        self.title = title
        self.msg = msg
        self.severity = severity
        self.halt = halt
        self.status = status

    def as_json(self):
        return {
            "title": self.title,
            "msg": self.msg,
            "type": self.severity.value,
            "halt": self.halt,
        }

    def as_json_response(self) -> JsonResponse:
        return JsonResponse(
            self.as_json(),
            status=self.status,
        )

    def as_drf_response(self) -> Response:
        return Response(
            {
                "title": self.title,
                "msg": self.msg,
                "type": self.severity.value,
                "halt": self.halt,
            },
            status=self.status,
        )


class MsgInvalidInput(MsgException):
    def __init__(
        self,
        title: str = "Validation Error",
        msg: str | dict = "",
    ):
        super().__init__(title, msg, MsgSeverity.ERROR, True, 400)


class MsgNoLogin(MsgException):
    def __init__(
        self,
        title: str = "Invalid Login",
        msg: str = "You have been logged out, and must login again to continue",
        request: HttpRequest = None,
    ):
        # Set error message for login screen
        if request is not None:
            login_global_vars = request.session.get("login_global_vars", {})
            login_global_vars["LOGIN_ERR"] = msg
            request.session["login_global_vars"] = login_global_vars

        super().__init__(title, msg, MsgSeverity.ERROR, True)


class MsgNoPerm(MsgException):
    def __init__(
        self,
        title: str = "Permission Denied",
        msg: str = "You do not have permission to access the requested content",
    ):
        super().__init__(title, msg, MsgSeverity.WARN, False, 401)


class MsgFailure(MsgException):
    def __init__(
        self,
        title: str = "Action Failed",
        msg: str = "The requested action could not be completed",
        status: int = 403,
    ):
        super().__init__(title, msg, MsgSeverity.ERROR, False, status)


class MsgNotFound(MsgException):
    def __init__(
        self,
        title: str = "Not Found",
        msg: str = "The requested content could not be found",
    ):
        super().__init__(title, msg, MsgSeverity.ERROR, False, 404)


class MsgExpired(MsgException):
    def __init__(
        self,
        title: str = "Expired",
        msg: str = "The requested content has been expired and is no longer available",
    ):
        super().__init__(title, msg, MsgSeverity.ERROR, False, 410)


class MsgBuilder:
    # @staticmethod
    # def student_collab(
    #     title: str = "Share Not Allowed",
    #     msg: str = "Students cannot be added as collaborator to widgets that have guest access disabled",
    # ) -> Msg:
    #     return Msg(title, msg, MsgType.STUDENT_COLLAB, MsgSeverity.ERROR, False, 401)
    pass
