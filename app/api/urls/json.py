from django.urls import path

# this could probably be handled a bit more neatly
from api.views.widgets import WidgetsApi

urlpatterns = [
    path('widgets_get_by_type/', WidgetsApi.by_type, name='widgets by type api endpoint'),
]
