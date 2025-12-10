import os
import re

from core.models import WidgetInstance
from core.utils.context_util import ContextUtil
from django.conf import settings
from django.shortcuts import redirect, render


def login(request):
    post_login_route = request.GET.get("next", None)
    if post_login_route:
        request.session["redirect_url"] = post_login_route
    # allow for custom authentication backend usage to launch from the regular /login route
    custom_auth_redirect = os.environ.get("AUTH_LOGIN_ROUTE_OVERRIDE", False)
    if custom_auth_redirect and custom_auth_redirect.lower() != "false":
        # also allow for explicitly bypassing the custom authentication backend
        if "directlogin" in request.GET:
            # do nothing, proceed with regular login handling
            pass
        else:
            # redirect to authentication package login route
            return redirect(custom_auth_redirect)

    js_globals = {}

    # Get login title
    title = request.session.get("login_title", "Login")

    # Dump in all extra login global vars
    login_global_vars = request.session.get("login_global_vars", {}) or {}

    if login_global_vars:

        for k, v in login_global_vars.items():
            js_globals[k] = v

        # Clear all login session vars
        request.session["login_title"] = None
        request.session["login_global_vars"] = None

    # in cases where login global vars are no longer in session
    # we pull inst info from next param
    else:
        next = request.GET.get("next", None)

        if next:
            match = re.search(r"/(play|embed){1}/([A-Za-z0-9]{5,})/", next)
            if match:
                method = match.group(1)
                inst_id = match.group(2)
                try:
                    inst = WidgetInstance.objects.get(pk=inst_id)
                    if inst:
                        js_globals.update(
                            {
                                "NAME": inst.name,
                                "WIDGET_NAME": inst.widget.name,
                                "ICON_DIR": settings.URLS["WIDGET_URL"]
                                + inst.widget.dir,
                                "IS_EMBEDDED": method == "embed",
                                "ACTION_LOGIN": settings.LOGIN_URL,
                                "ACTION_REDIRECT": next,
                                "CONTEXT": "widget",
                                "IS_PREVIEW": False,
                            }
                        )
                except WidgetInstance.DoesNotExist:
                    js_globals.update(
                        {
                            "ERR_LOGIN": "The widget you are trying to access does not exist.",
                        }
                    )

    context = ContextUtil.create(
        title=title,
        js_resources=settings.JS_GROUPS["login"],
        css_resources=settings.CSS_GROUPS["login"],
        js_globals=js_globals,
        request=request,
    )

    return render(request, "react.html", context)
