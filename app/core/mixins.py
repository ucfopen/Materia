from django.contrib.auth.mixins import AccessMixin
from django.http import HttpRequest, HttpResponse


# Special login mixin that allows you to conditionally define whether a login is required
# on a per-request basis, and allows you to specify JS global vars for the login screen.
class MateriaLoginMixin(AccessMixin):
    login_title: str = None
    login_message: str = None
    login_error: str = None
    login_global_vars: dict = {}
    allow_all_by_default: bool = False  # If true, the default initial_login_check will not check if users is auth'd

    def get_login_global_vars(self, request) -> dict:
        return self.login_global_vars

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
                request, self.login_title, self.login_message, self.login_error, self.get_login_global_vars(request)
            )

        # Run the normal dispatch method, but listen for MateriaLoginNeeded(), if raised
        try:
            return super().dispatch(request, *args, **kwargs)
        except MateriaLoginNeeded as e:
            # Check to see if the exception has any custom login messages
            login_title = e.login_title if e.login_title is not None else self.login_title
            login_message = e.login_message if e.login_message is not None else self.login_message
            login_error = e.login_error if e.login_error is not None else self.login_error
            login_global_vars = e.login_global_vars \
                if e.login_global_vars is not None else self.get_login_global_vars(request)

            # Handle login event
            return self._handle_login(request, login_message, login_error, login_title, login_global_vars)

    def _handle_login(
            self, request: HttpRequest, login_title: str, login_message: str, login_error: str, login_global_vars: dict
    ) -> HttpResponse:
        request.session["login_title"] = login_title
        request.session["login_global_vars"] = {
            **login_global_vars,
            "LOGIN_ERR": login_error,
            "LOGIN_NOTICE": login_message,
        }
        return self.handle_no_permission()


# Special exception that can be called from within the dispatch of a view
# to redirect that user to the login screen on-demand. Must be used with MateriaLoginMixin/ByExceptionMixin
class MateriaLoginNeeded(Exception):
    def __init__(
            self, login_title: str = None, login_message: str = None,
            login_error: str = None, login_global_vars: dict = None
    ):
        self.login_message = login_message
        self.login_error = login_error
        self.login_title = login_title
        self.login_global_vars = login_global_vars
