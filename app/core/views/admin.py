from django.conf import settings
from django.shortcuts import render
from util.context_util import ContextUtil


def widget(request):
    context = ContextUtil.create(
        title="Widget Admin",
        js_resources=settings.JS_GROUPS["widget_admin"],
        css_resources=settings.CSS_GROUPS["support"],
        request=request,
    )

    return render(request, "react.html", context)


def instance(request):
    context = ContextUtil.create(
        title="Widget Admin",
        js_resources=settings.JS_GROUPS["instance_admin"],
        css_resources=settings.CSS_GROUPS["support"],
        request=request,
    )

    return render(request, "react.html", context)


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
