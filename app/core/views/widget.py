from django.shortcuts import render
from django.views.generic import TemplateView


class WidgetDetailView(TemplateView):
    def index(request, widget_slug):
        context = {
            "title": "Materia Widget Catalog",
            "js_resources": ["dist/js/detail.js"],
            "css_resources": ["dist/css/detail.css"],
        }
        return render(request, "react.html", context)
