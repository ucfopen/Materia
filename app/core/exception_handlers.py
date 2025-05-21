from django.http import Http404
from rest_framework.views import exception_handler

from util.message_util import Msg


def materia_exception_handler(exc, context):
    response = exception_handler(exc, context)

    # Wrap the DRF error in a Msg object for easier front-end parsing
    if response is not None:
        # TODO this can be expanded upon to catch more types of errors and handle them betterly
        if isinstance(exc, Http404):
            title = "Not Found"
        else:
            title = exc.detail[0] if hasattr(exc, "detail") and isinstance(exc.detail, list) else "Unknown Error"

        msg = Msg(title=title, msg=response.data, halt=True, status=response.status_code)
        response = msg.as_json_response()

    return response
