import json
import logging

from django.http import HttpRequest, JsonResponse
from django.conf import settings

from api.views.users_api import UsersApi


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
        processed_js_globals["BASE_URL"] = "http://localhost/"  # TODO make these customizable, prolly through a .env or so
        processed_js_globals["WIDGET_URL"] = "http://localhost/widget/"
        processed_js_globals["STATIC_CROSSDOMAIN"] = "http://localhost/"

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
            **ContextUtil.get_dark_mode(request)
        }

    @staticmethod
    def get_dark_mode(request):
        """
        Function to get if a user has dark mode enabled
        """
        user_settings = {"darkMode": False}  # Default settings

        try:
            user_data = UsersApi.get(request)  # Call API to fetch user settings
            if isinstance(user_data, JsonResponse):
                user_json = user_data.content.decode("utf-8")
                user_profile = json.loads(user_json)
                user_settings["darkMode"] = user_profile.get("profile_fields", {}).get("darkMode", False)

        except Exception as e:
            logging.error(f"Error fetching user settings: {e}")

        return user_settings
