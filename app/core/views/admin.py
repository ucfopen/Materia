from django.shortcuts import render
from django.views.generic import TemplateView


class CatalogView(TemplateView):
    def widget(request):
        context = {"title": "Welcome to Materia", "bundle_name": "catalog"}
        return render(request, "react.html", context)
