import logging

from django.conf import settings
from lti_tool.views import OIDCLoginInitView

logger = logging.getLogger(__name__)


class MateriaOIDCLoginInitView(OIDCLoginInitView):

    def get_redirect_url(self, target_link_uri: str) -> str:
        """
        Overrides OIDCLoginInitView's `get_redirect_url` method, as we only have one whitelisted launch URI: /ltilaunch/
        LTI 1.3 requires all launch URIs to be whitelisted in platform's LTI key
        From the launch view (lti/views/launch.py), handle_resource_launch and handle_deep_linking_launch actually send
        the user where they want to go
        """
        redirect = f"{settings.URLS["BASE_URL"]}ltilaunch/"
        return redirect
