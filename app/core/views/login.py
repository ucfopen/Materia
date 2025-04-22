from django.conf import settings
from django.shortcuts import render

from util.context_util import ContextUtil


def login(request):
    js_globals = {}

    # Get login title
    title = request.session.get("login_title", "Login")

    # Dump in all extra login global vars
    login_global_vars = request.session.get("login_global_vars", {})
    for k, v in login_global_vars.items():
        js_globals[k] = v

    # Clear all login session vars
    request.session["login_title"] = None
    request.session["login_global_vars"] = None

    context = ContextUtil.create(
        title=title,
        js_resources=settings.JS_GROUPS["login"],
        css_resources=settings.CSS_GROUPS["login"],
        js_globals=js_globals,
        request=request,
    )

    return render(request, "react.html", context)
