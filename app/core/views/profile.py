from django.conf import settings as djangoSettings
from django.shortcuts import render

from util.context_util import ContextUtil


def profile(request):
    context = ContextUtil.create(
        title="Profile",
        js_resources=djangoSettings.JS_GROUPS["profile"],
        css_resources=djangoSettings.CSS_GROUPS["profile"],
        fonts=djangoSettings.FONTS_DEFAULT,
        request=request,
    )

    return render(request, "react.html", context)


def settings(request):
    context = ContextUtil.create(
        title="Settings",
        js_resources=djangoSettings.JS_GROUPS["settings"],
        css_resources=djangoSettings.CSS_GROUPS["settings"],
        fonts=djangoSettings.FONTS_DEFAULT,
        request=request,
    )

    return render(request, "react.html", context)




