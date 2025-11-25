import logging

from core.utils.context_util import ContextUtil
from django.conf import settings
from django.http import HttpResponseNotFound
from django.shortcuts import render


def index(request, *args, **kwargs):
    context = ContextUtil.create(
        title="Welcome to Materia",
        js_resources=settings.JS_GROUPS["main"],
        css_resources=settings.CSS_GROUPS["main"],
        request=request,
    )

    return render(request, "react.html", context)


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
        js_resources=settings.JS_GROUPS["404"],
        css_resources=settings.CSS_GROUPS["404"],
        request=request,
    )

    # Render the template with context
    content = render(request, "react.html", context)

    # Return a 404 response with the rendered content
    return HttpResponseNotFound(content)


def handler500(request):
    return "ADSFASDF"
