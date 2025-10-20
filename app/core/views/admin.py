import os

from django.conf import settings
from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render
from util.context_util import ContextUtil
from util.widget.validator import ValidatorUtil


@login_required
@user_passes_test(lambda u: u.is_superuser)
def widget(request):
    context = ContextUtil.create(
        title="Widget Admin",
        js_resources=settings.JS_GROUPS["widget_admin"],
        css_resources=settings.CSS_GROUPS["support"],
        js_globals={
            "UPLOAD_ENABLED": ValidatorUtil.validate_bool(
                os.environ.get("ENABLE_ADMIN_UPLOADER"), True
            )
        },
        request=request,
    )

    return render(request, "react.html", context)


@login_required
@user_passes_test(lambda u: u.is_superuser or u.groups.filter(name="support_user"))
def instance(request):
    context = ContextUtil.create(
        title="Widget Admin",
        js_resources=settings.JS_GROUPS["instance_admin"],
        css_resources=settings.CSS_GROUPS["support"],
        request=request,
    )

    return render(request, "react.html", context)


@login_required
@user_passes_test(lambda u: u.is_superuser or u.groups.filter(name="support_user"))
def user(request):
    context = ContextUtil.create(
        title="Widget Admin",
        js_resources=settings.JS_GROUPS["user_admin"],
        css_resources=settings.CSS_GROUPS["user_admin"],
        request=request,
    )

    return render(request, "react.html", context)


# class AdminViews(TemplateView):
#     def widget(request):
#         context = {"title": "Welcome to Materia", "bundle_name": "catalog"}
#         return render(request, "react.html", context)
