from django.conf import settings as django_settings
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from util.context_util import ContextUtil


@login_required
def profile(request):
    context = ContextUtil.create(
        title="Profile",
        js_resources=django_settings.JS_GROUPS["profile"],
        css_resources=django_settings.CSS_GROUPS["profile"],
        request=request,
    )

    return render(request, "react.html", context)


@login_required
def settings(request):
    context = ContextUtil.create(
        title="Settings",
        js_resources=django_settings.JS_GROUPS["settings"],
        css_resources=django_settings.CSS_GROUPS["settings"],
        request=request,
    )

    return render(request, "react.html", context)
