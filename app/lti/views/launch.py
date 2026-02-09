import logging

from django.shortcuts import redirect
from lti.exceptions import LTIAuthException
from lti.services.auth import LTIAuthService
from lti.services.launch import LTILaunchService
from lti.views.lti import error_page
from lti_tool.types import LtiHttpRequest
from lti_tool.views import LtiLaunchBaseView
from pylti1p3.exception import LtiException

logger = logging.getLogger(__name__)


class ApplicationLaunchView(LtiLaunchBaseView):

    def post(self, request: LtiHttpRequest, *args, **kwargs):
        """
        Overrides django-lti's post method in order to intercept validation exceptions
        """
        try:
            return super().post(request, *args, **kwargs)
        except LtiException:
            logger.error("LTI: Launch validation failed", exc_info=True)
            return error_page(request, "error_launch_validation")

    def handle_resource_launch(self, request, lti_launch):
        launch_data = lti_launch.get_launch_data()

        # Authentication handling
        try:
            auth = LTIAuthService.authenticate(request, launch_data)
            if auth is None:
                # auth is None if the Auth Service encountered an exception during user provisioning
                return error_page(request, "error_unknown_user")

        except LTIAuthException:
            # LTI auth exception is raised when critical auth data is missing
            return error_page(request, "error_unknown_user")

        # Redirect handling
        try:
            destination = LTILaunchService.get_launch_redirect(lti_launch)
            return redirect(destination)
        except Exception:
            return error_page(request, "error_unknown_assignment")

    def handle_deep_linking_launch(self, request, lti_launch):
        launch_data = lti_launch.get_launch_data()
        auth = LTIAuthService.authenticate(request, launch_data)

        if auth is None:
            logger.error("launch login invalid")
            return error_page(request, "error_unknown_user")

        # we need access to the original launch data when sending the deep link selection back to the platform
        # in addition to a GET param, store the launch ID in session for redundancy
        launch_id = lti_launch.get_launch_id()
        request.session["lti-deep-link"] = launch_id
        return redirect(f"/lti/picker/?lid={launch_id}")

    def handle_submission_review_launch(self, request, lti_launch):
        """
        Canvas does NOT support submission review launches
        Instead, a score submission url is appended to the AGS Scores Service payload
        as an optional claim extension. Canvas will perform an LTI launch to this URL
        when viewing Submission Details or SpeedGrader. We use the same target_uri
        redirection mechanism used for widget launches to pass the launch endpoint
        and redirect to the score screen after launch init.

        TODO do other LMSs support Submission Review Service?:
        https://www.imsglobal.org/spec/lti-sr/v1p0

        If so, we should implement this launch view.
        """
        return None  # Optional.

    def handle_data_privacy_launch(self, request, lti_launch):
        return None  # Optional.
