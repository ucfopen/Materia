import logging
from django.http import HttpResponseNotFound
from django.conf import settings
from django.shortcuts import render
from util.context_util import ContextUtil


def index(request, *args, **kwargs):
    context = ContextUtil.create(
        title="Welcome to Materia",
        js_resources=settings.JS_GROUPS["main"],
        css_resources=settings.CSS_GROUPS["main"],
        request=request,
    )

    return render(request, "react.html", context)


def get_theme_overrides():
    # This function will be called before the help page is loaded.
    # You can use it to check for theme overrides.
    # Return a dictionary with the 'js' and 'css' keys if an override exists,
    # or None if no override exists.
    # For this example, we'll just return None.
    return None


def help(request):
    context = ContextUtil.create(
        title="Help",
        page_type="docs help",
        js_resources=settings.JS_GROUPS["help"],
        css_resources=settings.CSS_GROUPS["help"],
        request=request,
    )

    return render(request, "react.html", context)


def handler404(request, exception):
    # Log the 404 URL
    logger = logging.getLogger(__name__)
    logger.warning("404 URL: %s", request.path)

    context = ContextUtil.create(
        title="404 Page Not Found",
        js_resources="dist/js/404.js",
        css_resources="dist/css/404.css",
        request=request,
    )

    # Render the template with context
    content = render(request, "react.html", context)

    # Return a 404 response with the rendered content
    return HttpResponseNotFound(content)


def handler500(request):
    return "ADSFASDF"
