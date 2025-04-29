from django.conf import settings
from django.shortcuts import render
from django.views.generic import TemplateView

from util.context_util import ContextUtil


class CatalogView(TemplateView):
    @staticmethod
    def index(request):
        context = ContextUtil.create(
            title="Materia Widget Catalog",
            js_resources=settings.JS_GROUPS["catalog"],
            css_resources=settings.CSS_GROUPS["catalog"],
            request=request,
        )

        return render(request, "react.html", context)
