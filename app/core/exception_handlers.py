from rest_framework.views import exception_handler

from util.message_util import Msg


def materia_exception_handler(exc, context):
    response = exception_handler(exc, context)

    # Wrap the DRF error in a Msg object for easier front-end parsing
    if response is not None:
        msg = Msg(title=exc.detail, msg=response.data, halt=True, status=response.status_code)
        response = msg.as_json_response()

    return response
