import logging
import re

# from core.models import Lti
from django.conf import settings

logger = logging.getLogger("django")


class LTILaunchService:

    @staticmethod
    def register_association(request, launch):

        if not settings.LTI_SAVE_ASSOCIATIONS:
            return True

        return True

    # Most LTI launches come in as LtiResourceLinkRequests
    # We determine the destination view by checking the target_link_uri value in the launch claim
    @staticmethod
    def get_launch_redirect(launch_data):

        uri_claim = launch_data.get(
            "https://purl.imsglobal.org/spec/lti/claim/target_link_uri"
        )

        if not uri_claim or re.search("/ltilaunch/", uri_claim):
            return "/lti/post_login/"

        # TODO should we be doing something more robust here than a simple regex match?
        elif re.search(r"embed/[A-Za-z0-9]{5}/[A-Za-z0-9\-]*/?$", uri_claim):
            return uri_claim
