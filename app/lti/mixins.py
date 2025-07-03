import logging

from django.contrib.auth import logout
from lti.services import LTIAuthService
from lti_tool.models import LtiLaunch

logger = logging.getLogger("django")


class LtiLaunchMixin:

    # dispatch is called prior to view processing and lets us perform checks associated with LTI launches
    def dispatch(self, request, *args, **kwargs):

        # the django-lti middleware should expose an lti_launch property on requests regardless if it's LTI
        if hasattr(request, "lti_launch") and request.lti_launch:

            # an instance of LtiLaunch indicates it is LTI. AbsentLtiLaunch indicates it is non-LTI
            if isinstance(request.lti_launch, LtiLaunch):
                try:
                    # handle_lti_launch performs LTI authentication
                    self.handle_lti_launch(request)
                except Exception:
                    return self.on_lti_launch_failure(request)

                # on_lti_launch_success performs view-specific actions associated with LTI launches
                # depending on context, it may return a view to be rendered
                view = self.on_lti_launch_success(request)

                # if the above did return a view, we short-circuit view rendering and return it instead
                if view is not None:
                    return view

        # no special views returned and everything checks out - perform normal view processing
        return super().dispatch(request, *args, **kwargs)

    def handle_lti_launch(self, request):
        # destroy current authentication session if active
        if request.user and request.user.is_authenticated:
            logout(request)
            request.session.flush()

        # authenticate from LTI launch payload
        auth = LTIAuthService.authenticate(
            request, request.lti_launch.get_launch_data()
        )

        if auth is None:
            raise Exception("LTI authentication failed")

    # called on successful launch and authentication
    # this method is intended to be overridden by views where the mixin is referenced
    # enables view-specific launch handling for various contexts
    def on_lti_launch_success(self, request):
        pass

    def on_lti_launch_failure(self, request):
        pass
