import logging

from django.shortcuts import redirect, render
from lti.exceptions import LTIAuthException
from lti.services.auth import LTIAuthService
from lti.services.launch import LTILaunchService
from lti.utils import (
    consume_post_message_initiation,
    consume_post_message_handoff,
    create_post_message_handoff,
    get_launch_from_request,
)
from lti.views.lti import error_page
from lti_tool.constants import SESSION_KEY
from lti_tool.types import LtiHttpRequest
from lti_tool.utils import sync_data_from_launch
from lti_tool.views import LtiLaunchBaseView
from pylti1p3.exception import LtiException

logger = logging.getLogger(__name__)


class ApplicationLaunchView(LtiLaunchBaseView):

    def post(self, request: LtiHttpRequest, *args, **kwargs):
        """
        Overrides django-lti's post method in order to intercept validation exceptions
        """
        try:
            storage_target = request.POST.get("lti_storage_target")
            if storage_target != "post_message_forwarding":
                # launch using cookies if we cant use post messages
                return super().post(request, *args, **kwargs)

            # if we have not retrieved storage values yet, route to oidc_get template
            if request.POST.get("oidc_storage_complete") != "1":
                return self.prepare_post_message_validation(request, storage_target)

            handoff = consume_post_message_handoff(
                request.POST.get("handoff_id", ""), storage_target
            )

            launch_post = request.POST.copy()
            launch_post["state"] = handoff["state"]
            launch_post["id_token"] = handoff["id_token"]

            request.POST = launch_post

            request.session.clear()
            lti_launch = get_launch_from_request(request)
            return self.process_validated_launch(request, lti_launch)
        except LtiException:
            logger.error("LTI: Launch validation failed", exc_info=True)
            return error_page(request, "error_launch_validation")

    def prepare_post_message_validation(self, request, storage_target):
        state = request.POST.get("state")
        id_token = request.POST.get("id_token")
        if not state or not id_token:
            raise LtiException("Missing state or id_token")

        initiation = consume_post_message_initiation(state, storage_target)
        handoff_id = create_post_message_handoff(initiation, id_token)
        return render(
            request,
            "oidc_get.html",
            {
                "handoff_id": handoff_id,
                "state_key": initiation["state"],
                "nonce_key": initiation["nonce"],
                "storage_target": storage_target,
                "platform_origin": initiation["platform_origin"],
            },
        )

    def process_validated_launch(self, request, lti_launch):
        sync_data_from_launch(lti_launch)
        self.launch_setup(request, lti_launch)
        if not lti_launch.deployment.is_active:
            return self.handle_inactive_deployment(request, lti_launch)

        request.session[SESSION_KEY] = lti_launch.get_launch_id()
        request.lti_launch = lti_launch
        if request.lti_launch.is_resource_launch:
            return self.handle_resource_launch(request, lti_launch)
        if request.lti_launch.is_deep_link_launch:
            return self.handle_deep_linking_launch(request, lti_launch)
        if request.lti_launch.is_submission_review_launch:
            return self.handle_submission_review_launch(request, lti_launch)
        if request.lti_launch.is_data_privacy_launch:
            return self.handle_data_privacy_launch(request, lti_launch)

        raise LtiException("Unsupported LTI launch message type")

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
        try:
            auth = LTIAuthService.authenticate(request, launch_data)
            if auth is None:
                return error_page(request, "error_unknown_user")
        except LTIAuthException:
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
