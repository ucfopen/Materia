import logging
import re

from django.conf import settings
from lti_tool.views import OIDCLoginInitView

logger = logging.getLogger("django")


class MateriaOIDCLoginInitView(OIDCLoginInitView):

    def get_redirect_url(self, target_link_uri: str) -> str:

        if self.is_legacy_resource(target_link_uri):
            legacy_embed_redirect = f"{settings.URLS["BASE_URL"]}ltilaunch/"
            return legacy_embed_redirect

        return target_link_uri

    def is_legacy_resource(self, target_link_uri: str) -> bool:

        if re.search(r"embed/[A-Za-z0-9]{5}/[A-Za-z0-9\-]*/?$", target_link_uri):
            return True

        return False
