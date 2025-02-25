from django.shortcuts import render
from django.views.generic import TemplateView

from util.context_util import ContextUtil


class CatalogView(TemplateView):
    @staticmethod
    def index(request):
        context = ContextUtil.create(
            title="Materia Widget Catalog",
            js_resources="dist/js/catalog.js",
            css_resources="dist/css/catalog.css",
            request=request,
        )

        return render(request, "react.html", context)
