from django.shortcuts import render
from django.views.generic import TemplateView
from .main import get_dark_mode


class CatalogView(TemplateView):
    def index(request):
        context = {
            "title": "Materia Widget Catalog",
            "js_resources": ["dist/js/catalog.js"],
            "css_resources": ["dist/css/catalog.css"],
            **get_dark_mode(request),
        }

        return render(request, "react.html", context)
