from lti_tool.constants import SESSION_KEY
from lti_tool.models import AbsentLtiLaunch
from pylti1p3.exception import LtiException

from .overrides import get_launch_from_request


# used in place of django-lti's LtiLaunchMiddleware so we use our custom get_launch_from_request method
# required for nonce validation override
class ExtendedLtiLaunchMiddleware:
    def __init__(self, get_response) -> None:
        self.get_response = get_response

    def __call__(self, request):
        launch_id = request.session.get(SESSION_KEY)
        try:
            request.lti_launch = get_launch_from_request(request, launch_id)
        except LtiException:
            request.lti_launch = AbsentLtiLaunch()
        return self.get_response(request)
