import logging

from django.conf import settings
from django.http import HttpResponseNotFound
from django.shortcuts import render


def index(request, *args, **kwargs):
    context = {
        "title": "Welcome to Materia",
        "js_resources": ["dist/js/homepage.js"],
        "css_resources": settings.CSS_GROUPS["main"],
        "fonts": settings.FONTS_DEFAULT
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
        "css_resources": settings.CSS_GROUPS["help"],
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
