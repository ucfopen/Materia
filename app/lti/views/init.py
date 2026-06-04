import logging

from django.conf import settings
from lti_tool.views import OIDCLoginInitView
from pylti1p3.exception import OIDCException

logger = logging.getLogger(__name__)


class MateriaOIDCLoginInitView(OIDCLoginInitView):

    def get(self, request, *args, **kwargs):
        registration_uuid = kwargs.get("registration_uuid")
        try:
            return self.get_oidc_response(request, registration_uuid, request.GET)
        except OIDCException:
            from lti.views.lti import error_page as lti_error_page

            return lti_error_page(request, "error_registration_disabled")

    def get_redirect_url(self, target_link_uri: str) -> str:
        """
        Overrides OIDCLoginInitView's `get_redirect_url` method, as we only have one whitelisted launch URI: /ltilaunch/
        LTI 1.3 requires all launch URIs to be whitelisted in platform's LTI key
        From the launch view (lti/views/launch.py), handle_resource_launch and handle_deep_linking_launch actually send
        the user where they want to go
        """
        redirect = f"{settings.URLS["BASE_URL"]}ltilaunch/"
        return redirect
