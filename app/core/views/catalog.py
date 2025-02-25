from django.conf import settings
from django.shortcuts import render
from django.views.generic import TemplateView


class CatalogView(TemplateView):
    def index(request):
        context = {
            "title": "Materia Widget Catalog",
            "js_resources": ["dist/js/catalog.js"],
            "css_resources": settings.CSS_GROUPS["catalog"],
            "fonts": settings.FONTS_DEFAULT
        }

        return render(request, "react.html", context)
