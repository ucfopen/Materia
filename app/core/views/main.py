import logging
import json
from django.http import HttpResponseNotFound, JsonResponse
from django.shortcuts import render
from api.views.users import UsersApi


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


def index(request, *args, **kwargs):
    context = {
        "title": "Welcome to Materia",
        # "bundle_name": "homepage"
        "js_resources": ["dist/js/homepage.js"],
        "css_resources": ["dist/css/homepage.css"],
        **get_dark_mode(request),
    }

    return render(request, "react.html", context)


def get_theme_overrides():
    # This function will be called before the help page is loaded.
    # You can use it to check for theme overrides.
    # Return a dictionary with the 'js' and 'css' keys if an override exists,
    # or None if no override exists.
    # For this example, we'll just return None.
    return None


def help(request):
    context = {
        "title": "Help",
        "page_type": "docs help",
        "js_resources": ["dist/js/help.js"],
        "css_resources": ["dist/css/help.css"],
        **get_dark_mode(request),
    }

    return render(request, "react.html", context)


def handler404(request, exception):
    # Log the 404 URL
    logger = logging.getLogger(__name__)
    logger.warning("404 URL: %s", request.path)

    context = {"title": "404 Page Not Found", "bundle_name": "404"}

    # Render the template with context
    content = render(request, "react.html", context)

    # Return a 404 response with the rendered content
    return HttpResponseNotFound(content)


def handler500(request):
    return "ADSFASDF"
