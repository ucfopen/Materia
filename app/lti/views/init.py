import logging
import re

from django.conf import settings
from lti_tool.views import OIDCLoginInitView

logger = logging.getLogger(__name__)


class MateriaOIDCLoginInitView(OIDCLoginInitView):

    def get_redirect_url(self, target_link_uri: str) -> str:

        if self.requires_redirect(target_link_uri):
            redirect = f"{settings.URLS["BASE_URL"]}ltilaunch/"
            return redirect

        return target_link_uri

    def requires_redirect(self, target_link_uri: str) -> bool:

        # embed URL - used for widget plays
        if re.search(r"embed/[A-Za-z0-9]{5,}/[A-Za-z0-9\-]*/?$", target_link_uri):
            return True

        # modern score URL - inst_id/play_id, used for submission review
        elif re.search(
            r"scores/single/[A-Za-z0-9]{5,}/[A-Za-z0-9\-]*/?$", target_link_uri
        ):
            return True

        # former score URL - play_id/inst_id, for some reason
        elif re.search(
            r"scores/single/[A-Za-z0-9\-]*/[A-Za-z0-9]{5,}/?$", target_link_uri
        ):
            return True

        return False
