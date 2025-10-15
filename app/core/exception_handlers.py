from django.http import Http404
from rest_framework.views import exception_handler

from core.message_exception import MsgException


def materia_exception_handler(exc, context):
    response = exception_handler(exc, context)

    # Wrap the DRF error in a Msg object for easier front-end parsing
    if response is not None:
        # TODO this can be expanded upon to catch more types of errors and handle them betterly

        # Catch general Msg exceptions
        if isinstance(exc, MsgException):
            return exc.as_json_response()

        # Catch other types of exceptions and form MsgExceptions out of them
        if isinstance(exc, Http404):
            title = "Not Found"
        else:
            title = (
                exc.detail[0]
                if hasattr(exc, "detail") and isinstance(exc.detail, list)
                else "Unknown Error"
            )

        msg = MsgException(
            title=title, msg=response.data, halt=True, status=response.status_code
        )
        response = msg.as_json_response()

    return response
