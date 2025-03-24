from django.conf import settings as django_settings
from django.shortcuts import render

from util.context_util import ContextUtil


def profile(request):
    context = ContextUtil.create(
        title="Profile",
        js_resources=django_settings.JS_GROUPS["profile"],
        css_resources=django_settings.CSS_GROUPS["profile"],
        fonts=django_settings.FONTS_DEFAULT,
        request=request,
    )

    return render(request, "react.html", context)


def settings(request):
    context = ContextUtil.create(
        title="Settings",
        js_resources=django_settings.JS_GROUPS["settings"],
        css_resources=django_settings.CSS_GROUPS["settings"],
        fonts=django_settings.FONTS_DEFAULT,
        request=request,
    )

    return render(request, "react.html", context)
