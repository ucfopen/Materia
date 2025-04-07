from django.http import HttpRequest
from django.conf import settings

from core.models import UserSettings


class ContextUtil:
    @staticmethod
    def create(
            js_resources: str | list[str],
            css_resources: str | list[str],
            request: HttpRequest,
            title: str = "",
            page_type: str = "",
            html_class: str = "",
            fonts: list[str] = settings.FONTS_DEFAULT,
            js_globals: dict = None,
    ) -> dict:
        # Flesh out the JS globals with some defaults
        processed_js_globals = dict(js_globals if js_globals else {})
        # TODO make these customizable, prolly through a .env or so
        processed_js_globals["BASE_URL"] = settings.URLS["BASE_URL"]
        processed_js_globals["WIDGET_URL"] = settings.URLS["WIDGET_URL"]
        processed_js_globals["STATIC_CROSSDOMAIN"] = settings.URLS["STATIC_CROSSDOMAIN"]

        # Process JS and CSS resources
        processed_js_resources = [js_resources] if type(js_resources) is str else js_resources
        processed_css_resources = [css_resources] if type(css_resources) is str else css_resources

        # Create and return context
        return {
            "title": title,
            "js_resources": processed_js_resources,
            "css_resources": processed_css_resources,
            "page_type": page_type,
            "js_global_variables": processed_js_globals,
            "css_global_variables": processed_css_resources,
            "fonts": fonts,
            "dark_mode": ContextUtil.get_dark_mode(request)
        }

    @staticmethod
    def get_dark_mode(request) -> bool:
        """
        Function to get if a user has dark mode enabled
        """
        dark_mode = False  # Default setting

        if not request.user or not request.user.is_authenticated:
            return dark_mode

        user_data = UserSettings.objects.filter(user=request.user).first()
        if user_data is not None:
            dark_mode = user_data.profile_fields.get("darkMode", False)

        return dark_mode
