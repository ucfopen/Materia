from django.conf import settings
from django.shortcuts import render
from django.views.generic import TemplateView

class MyWidgetsView(TemplateView):

    def index(request):
        context = {
            "title": "My Widgets",
            "js_resources": settings.JS_GROUPS["my-widgets"],
            "css_resources": settings.CSS_GROUPS["my-widgets"],
            "js_global_variables": {
                # TODO: make these config variables, and export these to somewhere where it can be reused easily
                "BASE_URL": settings.URLS["BASE_URL"],
                "WIDGET_URL": settings.URLS["WIDGET_URL"],
                "STATIC_CROSSDOMAIN": settings.URLS["STATIC_CROSSDOMAIN"]
            },
        }

        return render(request, "react.html", context)