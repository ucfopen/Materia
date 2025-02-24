from django.urls import path

from api.views.widgets_api import WidgetsApi

urlpatterns = [
    path("get_by_type/", WidgetsApi.get_by_type),
    path("get/", WidgetsApi.get),
]