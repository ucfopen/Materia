from django.conf import settings
from django.shortcuts import render
from django.views.generic import TemplateView

from util.context_util import ContextUtil


class MyWidgetsView(TemplateView):
    @staticmethod
    def index(request):
        context = ContextUtil.create(
            title="My Widgets",
            js_resources=settings.JS_GROUPS["my-widgets"],
            css_resources=settings.CSS_GROUPS["my-widgets"],
            request=request,
        )

        return render(request, "react.html", context)
