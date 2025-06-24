import logging

from django.shortcuts import redirect
from lti.services import LTiAuthService
from lti_tool.views import LtiLaunchBaseView

logger = logging.getLogger("django")


class ApplicationLaunchView(LtiLaunchBaseView):
    def handle_resource_launch(self, request, lti_launch):
        launch_data = lti_launch.get_launch_data()

        auth = LTiAuthService.authenticate(request, launch_data)

        if not auth:
            logger.error("launch login invalid")
            return redirect("/404")

        return redirect("/lti/post_login/")

    def handle_deep_linking_launch(self, request, lti_launch):

        launch_data = lti_launch.get_launch_data()
        auth = LTiAuthService.authenticate(request, launch_data)

        if not auth:
            logger.error("launch login invalid")
            return redirect("/404")

        return redirect("/lti/picker/")

    def handle_submission_review_launch(self, request, lti_launch):
        return None  # Optional.

    def handle_data_privacy_launch(self, request, lti_launch):
        return None  # Optional.
