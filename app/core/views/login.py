from django.conf import settings
from django.shortcuts import render

from util.context_util import ContextUtil


def login(request):
    context = ContextUtil.create(
        title="Login",
        js_resources=settings.JS_GROUPS["login"],
        css_resources=settings.CSS_GROUPS["login"],
        fonts=settings.FONTS_DEFAULT,
        request=request,
    )

    return render(request, "react.html", context)

