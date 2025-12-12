import logging

from core.message_exception import MsgFailure
from django.contrib.auth import logout
from lti.services.auth import LTIAuthService
from lti.services.launch import LTILaunchService

logger = logging.getLogger(__name__)


class LtiLaunchMixin:

    # dispatch is called prior to view processing and lets us perform checks associated with LTI launches
    def dispatch(self, request, *args, **kwargs):

        launch = LTILaunchService.get_or_recover_launch(request)
        if launch is not None:
            try:
                # handle_lti_launch performs LTI authentication
                self.handle_lti_launch(request, launch)
            except Exception:
                return self.on_lti_launch_failure(request)

            # on_lti_launch_success performs view-specific actions associated with LTI launches
            # depending on context, it may return a view to be rendered
            view = self.on_lti_launch_success(request, launch)

            # if the above did return a view, we short-circuit view rendering and return it instead
            if view is not None:
                return view

        # no special views returned and everything checks out - perform normal view processing
        return super().dispatch(request, *args, **kwargs)

    def handle_lti_launch(self, request, launch):

        # launch auth depends on launch state: initial or recovery
        # for recovery launches, verify the authenticated user matches the user stored in the launch
        if LTILaunchService.get_launch_state(launch) == "RECOVERY":
            launch_username = LTIAuthService.get_username_from_launch(launch)

            # raise an exception if current user does not match stored launch user
            if request.user.username != launch_username:
                logger.error(
                    f"LTI: ERROR: launch recovery username mismatch detected between "
                    f"{request.user.username} and {launch_username}!"
                )
                raise MsgFailure(msg="LTI Launch recovery authentication mismatch")

        # destroy current authentication session if active
        if request.user and request.user.is_authenticated:
            logout(request)
            request.session.flush()

        # authenticate from LTI launch payload
        auth = LTIAuthService.authenticate(request, launch)

        if auth is None:
            raise Exception("LTI authentication failed")

    # called on successful launch and authentication
    # this method is intended to be overridden by views where the mixin is referenced
    # enables view-specific launch handling for various contexts
    def on_lti_launch_success(self, request, launch):
        pass

    def on_lti_launch_failure(self, request):
        pass
