from django.conf import settings
from django.http import HttpRequest


class ContextUtil:
    @staticmethod
    def create(
        js_resources: str | list[str],
        css_resources: str | list[str],
        request: HttpRequest,
        title: str = "",
        page_type: str = "",
        html_class: str = "",
        js_globals: dict = None,
    ) -> dict:
        # Flesh out the JS globals with some defaults
        processed_js_globals = dict(js_globals if js_globals else {})
        processed_js_globals["BASE_URL"] = settings.URLS["BASE_URL"]
        processed_js_globals["WIDGET_URL"] = settings.URLS["WIDGET_URL"]
        processed_js_globals["STATIC_CROSSDOMAIN"] = settings.URLS["STATIC_CROSSDOMAIN"]

        # Process JS and CSS resources
        processed_js_resources = (
            [js_resources] if type(js_resources) is str else js_resources
        )
        processed_css_resources = (
            [css_resources] if type(css_resources) is str else css_resources
        )

        # Create and return context
        return {
            "title": title,
            "js_resources": processed_js_resources,
            "css_resources": processed_css_resources,
            "page_type": page_type,
            "js_global_variables": processed_js_globals,
            "css_global_variables": processed_css_resources,
        }
