from django.urls import path

from api.views.users_api import UsersApi

urlpatterns = [
    path("get/", UsersApi.get),
    path("login/", UsersApi.service_user_login, name="service_user_login"),
    path("settings/", UsersApi.update_settings),
    path("activity/", UsersApi.activity),
    path("get_questions/", UsersApi.get_questions)
]