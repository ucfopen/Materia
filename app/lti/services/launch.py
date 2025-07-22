import logging
import re

from django.conf import settings

# from pprint import pformat


logger = logging.getLogger("django")


class LTILaunchService:

    @staticmethod
    def register_association(request, launch):
        """
        TODO should create a new instance of the LTI model.
        Implementation requires updates to LTI model, which needs to be updated for 1.3.
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
    def store_widget_launch(request, launch_data):

        uri_claim = launch_data.get(
            "https://purl.imsglobal.org/spec/lti/claim/target_link_uri"
        )

        inst_id = LTILaunchService.get_inst_id_from_uri(uri_claim)

        request.session[f"lti-launch-{inst_id}"] = launch_data
        request.session.modified = True

        return True
