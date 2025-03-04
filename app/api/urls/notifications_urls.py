from django.urls import path

from api.views.notifications_api import NotificationsApi

urlpatterns = [
    path("get/", NotificationsApi.get)
]