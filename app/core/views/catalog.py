from django.shortcuts import render
from django.views.generic import TemplateView


class CatalogView(TemplateView):
    def index(request):
        context = {
            "title": "Materia Widget Catalog",
            "js_resources": ["dist/js/catalog.js"],
            "css_resources": ["dist/css/catalog.css"],
        }

        return render(request, "react.html", context)
