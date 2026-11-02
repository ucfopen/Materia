import logging
from dataclasses import dataclass
from urllib.parse import urlsplit

from api.authentication import issue_embedded_token
from api.score_services import can_review_scores
from core.models import LogPlay, WidgetInstance
from core.views.embedded import embedded_shell
from django.conf import settings
from django.shortcuts import redirect, render
from django.urls import Resolver404, resolve
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
from lti_tool.utils import get_launch_from_request as get_cookie_launch
from lti_tool.utils import sync_data_from_launch
from lti_tool.views import LtiLaunchBaseView
from pylti1p3.exception import LtiException
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class EmbeddedLaunchTarget:
    purpose: str
    instance: WidgetInstance | None = None
    play: LogPlay | None = None


class EmbeddedLaunchError(Exception):
    def __init__(self, error_type):
        super().__init__(error_type)
        self.error_type = error_type


class ApplicationLaunchView(LtiLaunchBaseView):

    def post(self, request: LtiHttpRequest, *args, **kwargs):
        """
        Overrides django-lti's post method in order to intercept validation exceptions
        """
        try:
            storage_target = request.POST.get("lti_storage_target")
            if storage_target != "post_message_forwarding":
                # launch using cookies if we cant use post messages
                if settings.EMBEDDED_AUTH_ENABLED:
                    return self.process_validated_launch(
                        request, get_cookie_launch(request)
                    )
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

            if not settings.EMBEDDED_AUTH_ENABLED:
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

        request.lti_launch = lti_launch

        # If embedded auth is enabled, get_embedded_launch_response returns an embed shell
        # or one of various conditional error states depending on validation
        if settings.EMBEDDED_AUTH_ENABLED and (
            lti_launch.is_resource_launch or lti_launch.is_deep_link_launch
        ):
            response = self.get_embedded_launch_response(request, lti_launch)
            if response is not None:
                return response

        if settings.EMBEDDED_AUTH_ENABLED:
            request.session.clear()
        request.session[SESSION_KEY] = lti_launch.get_launch_id()

        # Legacy launch routing when embedded auth is disabled
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

    def get_embedded_launch_response(self, request, lti_launch):
        # Resolve a target, authorize its user, and render a launch-scoped shell
        launch_data = lti_launch.get_launch_data()
        try:
            target = self._resolve_embedded_target(lti_launch, launch_data)
        except EmbeddedLaunchError as exc:
            return error_page(request, exc.error_type)

        instance, play, purpose = target.instance, target.play, target.purpose
        try:
            user = LTIAuthService.authenticate(request, launch_data, use_session=False)
        except LTIAuthException:
            return error_page(request, "error_unknown_user")
        if user is None:
            return error_page(request, "error_unknown_user")

        if (
            purpose == "scores"
            and play
            and not can_review_scores(
                user, instance, play=play, launch_data=launch_data
            )
        ):
            return error_page(request, "error_launch_validation")
        provisional = False
        if purpose == "instructor-resource":
            provisional = LTILaunchService.ensure_instructor_visibility(
                user, instance, LTILaunchService.get_context_id(launch_data)
            )
        if purpose in {"player", "instructor-resource"}:
            LTILaunchService.register_association(
                launch_data, user, instance, deployment=lti_launch.deployment
            )
        try:
            token = issue_embedded_token(
                user,
                instance,
                lti_launch,
                purpose=purpose,
                play_id=play.pk if play else None,
                provisional_access=provisional,
            )
        except AuthenticationFailed:
            logger.error(
                "LTI: unable to store embedded authentication grant", exc_info=True
            )
            return error_page(request, "error_launch_validation")
        return embedded_shell(
            request, instance.pk if purpose == "player" else None, token
        )

    def _resolve_embedded_target(self, lti_launch, launch_data):
        if not lti_launch.is_resource_launch:
            return EmbeddedLaunchTarget("deep-link")

        route = self._resolve_embedded_route(lti_launch)
        if route.url_name == "lti login success":
            return EmbeddedLaunchTarget("course-navigation")
        if route.url_name in {"scores", "single score"}:
            return self._resolve_scores_target(route)
        if route.url_name in {"widget play", "widget embed"}:
            return self._resolve_widget_target(route, launch_data)
        raise EmbeddedLaunchError("error_unknown_assignment")

    def _resolve_embedded_route(self, lti_launch):
        try:
            target = urlsplit(LTILaunchService.get_launch_redirect(lti_launch))
        except ValueError as exc:
            logger.error("LTI: embedded launch target is malformed", exc_info=True)
            raise EmbeddedLaunchError("error_unknown_assignment") from exc
        base = urlsplit(settings.URLS["BASE_URL"])
        if (
            target.scheme
            and target.scheme != base.scheme
            or target.netloc
            and target.netloc != base.netloc
        ):
            logger.error("LTI: embedded launch target is not a Materia URL")
            raise EmbeddedLaunchError("error_unknown_assignment")
        try:
            return resolve(target.path.rstrip("/") + "/")
        except Resolver404 as exc:
            raise EmbeddedLaunchError("error_unknown_assignment") from exc

    def _get_embedded_instance(self, instance_id):
        instance = WidgetInstance.objects.filter(
            pk=instance_id, is_deleted=False
        ).first()
        if instance is None:
            raise EmbeddedLaunchError("error_unknown_assignment")
        if instance.guest_access:
            raise EmbeddedLaunchError("error_lti_guest_mode")
        return instance

    def _resolve_widget_target(self, route, launch_data):
        instance = self._get_embedded_instance(route.kwargs["widget_instance_id"])
        purpose = (
            "instructor-resource"
            if LTIAuthService.is_user_course_author(launch_data)
            else "player"
        )
        if not (
            LTILaunchService.get_context_id(launch_data)
            and LTILaunchService.get_resource_link(launch_data)
        ):
            logger.error("LTI: embedded launch is missing course or resource context")
            raise EmbeddedLaunchError("error_launch_validation")
        return EmbeddedLaunchTarget(purpose, instance)

    def _resolve_scores_target(self, route):
        instance_id = route.kwargs["widget_instance_id"]
        play_id = route.kwargs.get("play_id")
        # Older score links put the play ID before the shorter instance ID.
        if play_id and len(play_id) < len(instance_id):
            instance_id, play_id = play_id, instance_id
        instance = self._get_embedded_instance(instance_id)
        play = None
        if play_id:
            play = LogPlay.objects.filter(pk=play_id, instance=instance).first()
            if play is None:
                raise EmbeddedLaunchError("error_unknown_assignment")
        return EmbeddedLaunchTarget("scores", instance, play)

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
