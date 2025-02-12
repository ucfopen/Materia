from django.urls import path

from api.views.widget_instance_api import WidgetInstanceAPI

urlpatterns = [
    path("publish_perms_verify/", WidgetInstanceAPI.publish_perms_verify),
    path("save/", WidgetInstanceAPI.save),
    path("update/", WidgetInstanceAPI.update),
    path("lock/", WidgetInstanceAPI.widget_instance_lock),
]