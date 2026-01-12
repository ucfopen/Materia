import re

from core.models import WidgetInstance
from core.utils.context_util import ContextUtil
from django.conf import settings
from django.shortcuts import redirect, render


def login(request):

    # store redirect in session in case we need it
    post_login_route = request.GET.get("next", None)
    if post_login_route:
        request.session["redirect_url"] = post_login_route

    # custom_auth_redirect is used to bypass the built-in django user login
    #
    # if the value is "false", no special login bypass will be used
    # if it is a different string value, it can be used in one of two ways:
    # a) if RESTRICT_LOGINS_TO_LAUNCHES is true, it serves as a redirect to direct users to the LMS or another location
    # b) if RESTRICT_LOGINS_TO_LAUNCHES is false, the login view is not rendered and the user is immediately redirected
    # UNLESS one of the params that halts automatic redirection is present
    custom_auth_redirect = settings.AUTH_LOGIN_ROUTE_OVERRIDE.lower() != "false"

    js_globals = {}

    # RESTRICT_LOGINS_TO_LAUNCHES prevents any form of direct auth (unless ?directlogin is used)
    # If AUTH_LOGIN_ROUTE_OVERRIDE is also provided, that URL is used as a redirect option
    if settings.RESTRICT_LOGINS_TO_LAUNCHES:

        if custom_auth_redirect:
            # The login button will be displayed, but it does not provide auth: just a redirect
            js_globals.update(
                {
                    "NOTICE_LOGIN": "Materia can only be accessed from your LMS, which you can visit from the "
                    "External Login link below.",
                    "EXTERNAL_LOGIN_URL": settings.AUTH_LOGIN_ROUTE_OVERRIDE,
                    "LOGINS_RESTRICTED_TO_LMS": True,
                }
            )
        else:
            # No login button will be displayed at all
            js_globals.update(
                {
                    "LOGINS_RESTRICTED_TO_LMS": True,
                    "NOTICE_LOGIN": (
                        "Materia can only be accessed from your LMS. "
                        "For more information, visit the help desk."
                    ),
                }
            )

    # AUTH_LOGIN_ROUTE_OVERRIDE is active, which overrides the default behavior of /login
    # the actual /login page is displayed in three circumstances:
    # 1. ?directlogin is used (which enables direct auth for service users)
    # 2. ?show_pre_embed is used, which indicates this is a widget pre-embed
    # 3. ?error is provided, which indicates an auth error was present on the last login attempt
    elif custom_auth_redirect:
        if "directlogin" in request.GET or "show_pre_embed" in request.GET:
            # bypass or halt automatic redirection due to an associated GET param
            pass

        elif "error" in request.GET:
            # halt automatic redirection due to an error param
            error_param = request.GET.get("error", "error_unspecified")
            error_messages = {
                "user_not_found": "User does not exist in the external database.",
                "invalid_credentials": "Invalid login credentials.",
                "account_disabled": "This account has been disabled.",
                "authentication_failed": "Authentication failed. Please try again.",
            }
            error_message = error_messages.get(
                error_param, "An error occurred during login."
            )
            js_globals.update({"ERR_LOGIN": error_message})

            pass
        else:
            # no special params, redirect to authentication package login route
            return redirect(settings.AUTH_LOGIN_ROUTE_OVERRIDE)

        js_globals.update({"AUTH_REDIRECT_ACTIVE": True})

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
