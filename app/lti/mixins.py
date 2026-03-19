import logging

from lti.services.launch import LTILaunchService

logger = logging.getLogger(__name__)


class LtiLaunchMixin:

    # dispatch is called prior to view processing and lets us perform checks associated with LTI launches
    def dispatch(self, request, *args, **kwargs):

        # play preprocessing will always pass through here. Performs some checks if this might be an LTI launch.
        # Launch validation: make sure launch recovery is valid and passes auth check

        is_launch = False
        if LTILaunchService.is_recovery_launch(request):

            # when course authors visit the widget in LTI, the play state is not stored
            # play state verification is only applied to cases where the player will init
            is_author = request.GET.get("is_author")
            if not is_author:
                token = request.GET.get("token")
                play_state = LTILaunchService.get_launch_from_play(token)

                if play_state:
                    if (
                        request.user != play_state.play.user
                        and request.user.is_authenticated
                    ):
                        logger.error(
                            f"LTI: ERROR: launch recovery username mismatch detected between "
                            f"{request.user.username} and {play_state.play.user.username}!"
                        )
                        return self.on_lti_launch_failure(request)

                    else:
                        is_launch = True
            else:
                is_launch = True

        # Initial launches have just been authenticated - auth check should not be required
        elif LTILaunchService.is_initial_launch(request):
            is_launch = True

        # on_lti_launch_success performs view-specific actions associated with LTI launches
        # depending on context, it may return a view to be rendered
        if is_launch:
            view = self.on_lti_launch_success(request)

            # if the above did return a view, we short-circuit view rendering and return it instead
            if view is not None:
                return view

        # no special views returned and everything checks out - perform normal view processing
        return super().dispatch(request, *args, **kwargs)

    # called on successful launch and authentication
    # this method is intended to be overridden by views where the mixin is referenced
    # enables view-specific launch handling for various contexts
    def on_lti_launch_success(self, request):
        pass

    def on_lti_launch_failure(self, request):
        pass
