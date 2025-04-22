from django.conf import settings
from django.shortcuts import render

from util.context_util import ContextUtil


def forbidden(request, exception):
    # TODO make this page prettier and incorporate the exception message

    context = ContextUtil.create(
        request=request,
        title="Forbidden",
        js_resources=settings.JS_GROUPS["no-permission"],
        css_resources=settings.CSS_GROUPS["no-permission"],
    )

    return render(request, "react.html", context)
