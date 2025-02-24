from django.urls import path

from api.views.notifications import NotificationsApi

urlpatterns = [
    path("get/", NotificationsApi.get)
]