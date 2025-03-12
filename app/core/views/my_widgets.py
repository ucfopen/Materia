from django.conf import settings
from django.shortcuts import render
from django.views.generic import TemplateView

class MyWidgetsView(TemplateView):
    def index(request):
        context = {
            "title": "My Widgets",
            "js_resources": settings.JS_GROUPS["my-widgets"],
            "css_resources": settings.CSS_GROUPS["my-widgets"],
            "fonts": settings.FONTS_DEFAULT,
        }

        return render(request, "react.html", context)