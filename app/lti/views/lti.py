from django.conf import settings as django_settings
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from util.context_util import ContextUtil


@login_required
def post_login(request):
    context = ContextUtil.create(
        title="Profile",
        js_resources=django_settings.JS_GROUPS["post-login"],
        css_resources=django_settings.CSS_GROUPS["lti"],
        request=request,
    )

    return render(request, "react.html", context)


@login_required
def picker(request):
    context = ContextUtil.create(
        title="Profile",
        js_resources=django_settings.JS_GROUPS["select-item"],
        css_resources=django_settings.CSS_GROUPS["lti"],
        js_globals={
            "RETURN_URL": f"{django_settings.URLS["BASE_URL"]}lti/deep_link_selection/",
        },
        request=request,
    )

    return render(request, "react.html", context)
