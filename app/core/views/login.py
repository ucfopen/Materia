from django.shortcuts import render

from util.context_util import ContextUtil


def login(request):
    context = ContextUtil.create(
        title="Login",
        js_resources="dist/js/login.js",
        css_resources="dist/css/login.css",
        request=request,
    )

    return render(request, "react.html", context)

