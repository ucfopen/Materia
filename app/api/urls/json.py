from api.views.notifications import NotificationsApi
from api.views.sessions import SessionsApi
from api.views.users import UsersApi

# this could probably be handled a bit more neatly
from api.views.widgets import WidgetsApi
from django.urls import path

urlpatterns = [
    path("widgets_get_by_type/", WidgetsApi.by_type),
    path("user_get", UsersApi.get),
    path("session_author_verify/", SessionsApi.author_verify),
    path("notifications_get/", NotificationsApi.get),
]
