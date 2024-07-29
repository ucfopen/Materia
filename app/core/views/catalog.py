import logging

from django.conf import settings
from django.contrib.auth.decorators import login_required, permission_required
from django.http import HttpResponse
from django.shortcuts import render
from django.views.generic import TemplateView

logger = logging.getLogger("django")


class CatalogView(TemplateView):
    def index(request):
        context = {
            "title": "Materia Widget Catalog",
            "js_resources": ["dist/js/catalog.js"],
            "css_resources": ["dist/css/catalog.css"],
        }
        return render(request, "react.html", context)
