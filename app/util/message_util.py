# Util class for creating messages for API errors. Returns JsonResponses that can be
# directly passed back from the endpoint. The front-end will detect these errors and
# display or handle them.
from enum import Enum

from django.http import JsonResponse


class MsgType(Enum):
    ERROR = "error"
    NOTICE = "notice"
    WARN = "warn"


class MsgUtil:
    @staticmethod
    def _create(
        title: str, msg: str, msg_type: MsgType = MsgType.ERROR, halt: bool = False, status: int = 403
    ) -> JsonResponse:
        return JsonResponse({
            "msg": msg,
            "title": title,
            "type": msg_type.value,
            "halt": halt,
        }, status=status)

    @staticmethod
    def create_invalid_input_msg(title: str = "Validation Error", msg: str = "") -> JsonResponse:
        return MsgUtil._create(title, msg, msg_type=MsgType.ERROR, halt=True)

    @staticmethod
    def create_no_login_msg(
        title="Invalid Login",
        msg="You have been logged out, and must login again to continue",
    ):
        return MsgUtil._create(title, msg, MsgType.ERROR, True)
        # TODO set_flash, see php

    @staticmethod
    def create_no_perm_msg(
        title: str = "Permission Denied",
        msg: str = "You do not have permission to access the requested content",
    ) -> JsonResponse:
        return MsgUtil._create(title, msg, MsgType.WARN, False, 401)

    @staticmethod
    def create_student_collab_msg(
        title="Share Not Allowed",
        msg="Students cannot be added as collaborator to widgets that have guest access disabled"
    ) -> JsonResponse:
        return MsgUtil._create(title, msg, MsgType.ERROR, False, 401)

    @staticmethod
    def create_failure_msg(
        title: str = "Action Failed",
        msg: str = "The requested action could not be completed",
    ):
        return MsgUtil._create(title, msg, MsgType.ERROR, False, 403)

    @staticmethod
    def create_not_found_msg(
        title="Not Found",
        msg="The requested content could not be found",
    ) -> JsonResponse:
        return MsgUtil._create(title, msg, MsgType.ERROR, False, 404)

    @staticmethod
    def create_expired_msg(
        title="Expired",
        msg="The requested content has been expired and is no longer available",
    ):
        return MsgUtil._create(title, msg, MsgType.ERROR, False, 410)
