from django.shortcuts import render
from django.views.generic import TemplateView


class WidgetDetailView(TemplateView):
    def index(request, widget_slug):
        context = {
            "title": "Materia Widget Catalog",
            "js_resources": ["dist/js/detail.js"],
            "css_resources": ["dist/css/detail.css"],
            "js_global_variables": { # TODO: make these config variables, and export these to somewhere where it can be reused easily
                "BASE_URL": "http://localhost/",
                "WIDGET_URL": "http://localhost/widget/",
                "STATIC_CROSSDOMAIN": "http://localhost/",
            }
        }
        return render(request, "react.html", context)
