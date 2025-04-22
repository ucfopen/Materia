from django.contrib.auth.mixins import LoginRequiredMixin


# Special login mixin that allows you to conditionally define whether a login is required
# on a per-request basis, and allows you to specify JS global vars for the login screen.
class MateriaLoginMixin(LoginRequiredMixin):
    login_message: str = None
    login_error: str = None
    login_title: str = None
    login_global_vars: dict = {}

    def get_login_global_vars(self, request) -> dict:
        return self.login_global_vars

    def login_needed(self, request) -> bool:
        return not request.user.is_authenticated()

    def dispatch(self, request, *args, **kwargs):
        if self.login_needed(request):
            request.session["login_title"] = self.login_title
            request.session["login_global_vars"] = {
                **self.get_login_global_vars(request),
                "LOGIN_ERR": self.login_error,
                "LOGIN_NOTICE": self.login_message,
            }
            return self.handle_no_permission()
        return super().dispatch(request, *args, **kwargs)
