import logging

from core.models import WidgetInstance
from core.services.widget_play_services import WidgetPlayValidationService
from core.utils.context_util import ContextUtil
from django.contrib.auth.mixins import AccessMixin
from django.http import HttpRequest, HttpResponse

logger = logging.getLogger(__name__)


# Special login mixin that allows you to conditionally define whether a login is required
# on a per-request basis, and allows you to specify JS global vars for the login screen.
class MateriaLoginMixin(AccessMixin):
    login_title: str = None
    login_message: str = None
    login_error: str = None
    login_global_vars: dict = None
    allow_all_by_default: bool = (
        False  # If true, the default initial_login_check will not check if users is auth'd
    )

    def get_login_global_vars(self, request) -> dict:
        return self.login_global_vars if self.login_global_vars is not None else {}

    # By default, will always trigger a login if user is not authenticated.
    # Can be overridden to require logins only in specific scenarios.
    # Return True is a login is needed
    def initial_login_check(self, request) -> bool:
        if self.allow_all_by_default:
            return False
        return not request.user.is_authenticated

    def dispatch(self, request, *args, **kwargs):
        # Check the initial login check. If true, start login sequence
        if self.initial_login_check(request):
            self._handle_login(
                request,
                self.login_title,
                self.login_message,
                self.login_error,
                self.get_login_global_vars(request),
            )

        # Run the normal dispatch method, but listen for MateriaLoginNeeded(), if raised
        try:
            return super().dispatch(request, *args, **kwargs)
        except MateriaLoginNeeded as e:
            # Check to see if the exception has any custom login messages
            login_title = (
                e.login_title if e.login_title is not None else self.login_title
            )
            login_message = (
                e.login_message if e.login_message is not None else self.login_message
            )
            login_error = (
                e.login_error if e.login_error is not None else self.login_error
            )
            login_global_vars = (
                e.login_global_vars
                if e.login_global_vars is not None
                else self.get_login_global_vars(request)
            )

            # Handle login event
            return self._handle_login(
                request, login_message, login_error, login_title, login_global_vars
            )

    def _handle_login(
        self,
        request: HttpRequest,
        login_title: str,
        login_message: str,
        login_error: str,
        login_global_vars: dict,
    ) -> HttpResponse:
        request.session["login_title"] = login_title
        request.session["login_global_vars"] = {
            **login_global_vars,
            "LOGIN_ERR": login_error,
            "LOGIN_NOTICE": login_message,
        }
        return self.handle_no_permission()


# Special exception that can be called from within the dispatch of a view
# to redirect that user to the login screen on-demand. Must be used with MateriaLoginMixin
class MateriaLoginNeeded(Exception):
    def __init__(
        self,
        login_title: str = None,
        login_message: str = None,
        login_error: str = None,
        login_global_vars: dict = None,
    ):
        self.login_message = login_message
        self.login_error = login_error
        self.login_title = login_title
        self.login_global_vars = login_global_vars


class MateriaWidgetPlayProcessor:
    """
    Mixin to handle widget play view pre-processing
    Incorporates several steps:
    1. Validation: used to validate access and determine what play view to return
    2. Context processing: based on validation, create the associated context object
    3. Pre-init business logic: Play session instantiation and LTI association
    """

    def dispatch(self, request, *args, **kwargs):
        # short-circuit this block if no inst id is present
        # ex: widget demos
        inst_id = self.kwargs.get("widget_instance_id", None)
        if inst_id is not None:
            instance = WidgetInstance.objects.filter(pk=inst_id).first()
            is_embedded = kwargs.get("is_embed", False)
            validation = self.get_validation(request, instance)

            request._widget_play_state = {
                "instance": instance,
                "is_embedded": is_embedded,
                "validation": validation,
            }

        return super().dispatch(request, *args, **kwargs)

    def get_context_data(
        self,
        widget_instance_id=None,
        instance_name=None,
        is_embed=False,
    ):
        # Retrieve per-request state from request object
        play_state = getattr(self.request, "_widget_play_state", {})
        validation = play_state.get("validation")
        instance = play_state.get("instance")

        processed_context = self.process_context(validation)

        if validation is WidgetPlayValidationService.VALID:
            pre_init = self.before_play_init(instance)

            ContextUtil.add_global(processed_context, "PLAY_ID", pre_init["play_id"])
            if pre_init["lti_token"] is not None:
                ContextUtil.add_global(
                    processed_context, "LTI_TOKEN", pre_init["lti_token"]
                )

        return processed_context

    def process_context(self, validation):
        pass

    def get_validation(self, request, instance):
        pass

    def before_play_init(self, instance):
        pass
