from django.conf import settings
from django.shortcuts import render
from django.http import HttpResponse

from django.contrib.auth.decorators import login_required, permission_required

from django.views.generic import TemplateView

import logging
logger = logging.getLogger('django')

class CatalogView(TemplateView):
    def widget(request):
        context = {
            "title": "Welcome to Materia",
            "bundle_name": "catalog"
        }
        return render(request, "react.html", context)
