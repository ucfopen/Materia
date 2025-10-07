import logging
import re

from django.conf import settings
from lti_tool.views import OIDCLoginInitView

logger = logging.getLogger("django")


class MateriaOIDCLoginInitView(OIDCLoginInitView):

    def get_redirect_url(self, target_link_uri: str) -> str:

        if self.requires_redirect(target_link_uri):
            redirect = f"{settings.URLS["BASE_URL"]}ltilaunch/"
            return redirect

        return target_link_uri

    def requires_redirect(self, target_link_uri: str) -> bool:

        if re.search(r"embed/[A-Za-z0-9]{5}/[A-Za-z0-9\-]*/?$", target_link_uri):
            return True

        elif re.search(
            r"scores/single/[A-Za-z0-9]{5}/[A-Za-z0-9\-]*/?$", target_link_uri
        ):
            return True

        return False
