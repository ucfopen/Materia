import logging

from core.models import WidgetInstance
from django.db.models import Q
from django.shortcuts import redirect
from lti.ags.util import AGSUtil
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

        # Build LTI params to pass via URL for widget launches
        lti_params = {}
        if LTILaunchService.is_widget_launch(
            launch_data
        ) or LTILaunchService.is_legacy_widget_launch_url(
            launch_data.get(
                "https://purl.imsglobal.org/spec/lti/claim/target_link_uri", ""
            )
        ):
            context_id = LTILaunchService.get_context_id(launch_data)
            lti_params = {
                "launch_status": "initial",
                "context_id": context_id,
                "resource_link": LTILaunchService.get_resource_link(launch_data) or "",
                "ags_line_item": AGSUtil.get_line_item_from_launch(launch_data) or "",
                "ags_user_id": AGSUtil.get_ags_user_id(launch_data) or "",
                "ags_scoring_enabled": str(
                    AGSUtil.is_ags_scoring_available(launch_data)
                ),
            }

            # Perform author check and association registration here
            # so downstream views don't need the full launch data
            uri_claim = launch_data.get(
                "https://purl.imsglobal.org/spec/lti/claim/target_link_uri", ""
            )
            inst_id = LTILaunchService.get_inst_id_from_uri(uri_claim)
            if inst_id:
                instance = WidgetInstance.objects.filter(pk=inst_id).first()
                if instance:
                    is_author = LTIAuthService.is_user_course_author(launch_data)
                    lti_params["is_author"] = str(is_author)

                    # check to see if the current user has either:
                    # a. unrestricted permissions to the instance (context_id == None) OR
                    # b. restricted permission to the instance for the current context ID
                    if is_author:
                        has_visibility = (
                            instance.permissions.filter(user=request.user)
                            .filter(
                                Q(context_id__isnull=True) | Q(context_id=context_id)
                            )
                            .exists()
                        )

                        # current user IS an author in the course but does NOT have access
                        # grant them implicit access and provide the provisional flag to the frontend
                        if not has_visibility:
                            instance.permissions.create(
                                user=request.user,
                                permission="visible",
                                context_id=context_id,
                            )
                            lti_params["provisional"] = "True"

                    # LTI associations are registered during play view init, instead of deep linking
                    # This behavior is carried over from PHP Materia
                    LTILaunchService.register_association(
                        launch_data, request.user, instance
                    )
            else:
                return error_page(request, "error_unknown_assignment")

        # Redirect handling
        try:
            destination = LTILaunchService.get_launch_redirect(launch_data, lti_params)
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
