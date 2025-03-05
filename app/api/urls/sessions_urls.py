from django.urls import path

from api.views.sessions_api import SessionsApi

urlpatterns = [
    path("play_start/", SessionsApi.play_start),
    path("play_save/", SessionsApi.play_save),
    path("author_verify/", SessionsApi.author_verify),
    path("role_verify/", SessionsApi.role_verify),
]
