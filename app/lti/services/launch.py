import logging
import re

from django.conf import settings
from lti_tool.models import LtiLaunch

# from pprint import pformat


logger = logging.getLogger("django")


class LTILaunchService:

    @staticmethod
    def register_association(request, launch):
        """
        TODO not currently implemented because django-lti stores records of resource links
            Do we need this? When would we need to provide those resource links?
        """
        if not settings.LTI_SAVE_ASSOCIATIONS:
            return True

        return True

    @staticmethod
    def get_launch_redirect(launch_data):
        """
        Most LTI launches come in as LtiResourceLinkRequests
        We determine the destination view by checking the target_link_uri value in the launch claim
        """
        uri_claim = launch_data.get(
            "https://purl.imsglobal.org/spec/lti/claim/target_link_uri"
        )

        # not a widget launch - redirect to post-login landing page
        if not uri_claim or re.search("/ltilaunch/", uri_claim):
            return "/lti/post_login/"

        # widget launch
        # TODO should we be doing something more robust here than a simple regex match?
        elif re.search(r"embed/[A-Za-z0-9]{5}/[A-Za-z0-9\-]*/?$", uri_claim):
            return uri_claim

    @staticmethod
    def get_inst_id_from_uri(uri_claim):

        res = re.search(r"embed/([A-Za-z0-9\-]{5,})/[A-Za-z0-9\-]*/?$", uri_claim)
        if res:
            return res.group(1)
        return None

    @staticmethod
    def is_widget_launch(launch_data):
        """
        TODO how else can we determine whether it's a widget launch from LTI claim data?
        """
        uri_claim = launch_data.get(
            "https://purl.imsglobal.org/spec/lti/claim/target_link_uri"
        )

        if re.search(r"embed/[A-Za-z0-9]{5}/[A-Za-z0-9\-]*/?$", uri_claim):
            return True

        return False

    @staticmethod
    def is_lti_launch(request):
        if hasattr(request, "lti_launch") and request.lti_launch:
            return isinstance(request.lti_launch, LtiLaunch)

        return False

    @staticmethod
    def get_nonce(launch):
        return launch.get("nonce", None)

    @staticmethod
    def get_context_id(launch):
        context_claim = launch.get("https://purl.imsglobal.org/spec/lti/claim/context")
        return context_claim.get("id")

    @staticmethod
    def get_launch_state(launch):
        return launch.get("materia_launch_state", None)

    @staticmethod
    def get_or_recover_launch(request):
        if LTILaunchService.is_lti_launch(request):
            launch = request.lti_launch.get_launch_data()
            launch["materia_launch_state"] = "INITIAL"
            return launch
        else:
            token_param = request.GET.get("token")
            recovery = LTILaunchService.get_session_launch(request, token_param)
            if recovery is not None:
                recovery["materia_launch_state"] = "RECOVERY"
                logger.error("\nLaunch RECOVERED from get param!\n")

            return recovery

    @staticmethod
    def store_session_launch(request, key, launch):
        request.session[f"lti-launch-{key}"] = launch
        request.session.modified = True

        return key

    @staticmethod
    def get_session_launch(request, key):
        launch = request.session.get(f"lti-launch-{key}", None)
        return launch
