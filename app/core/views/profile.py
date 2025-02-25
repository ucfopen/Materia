from django.shortcuts import render

from util.context_util import ContextUtil


def profile(request):
    context = ContextUtil.create(
        title="Profile",
        js_resources="dist/js/profile.js",
        css_resources="dist/css/profile.css",
        request=request,
    )

    return render(request, "react.html", context)


def settings(request):
    context = ContextUtil.create(
        title="Settings",
        js_resources="dist/js/settings.js",
        css_resources="dist/css/settings.css",
        request=request,
    )

    return render(request, "react.html", context)




