from api.views.notifications import NotificationsApi
from api.views.sessions import SessionsApi
from api.views.users import UsersApi

# this could probably be handled a bit more neatly
# from api.views.widgets import WidgetsApi
import api.views.widgets as widgets_api
from django.urls import path

urlpatterns = [
    path("widgets_get_by_type/",  widgets_api.by_type),
    path("widgets_get/", widgets_api.by_id),
    path("user_get", UsersApi.get),
    path("session_author_verify/", SessionsApi.author_verify),
    path("notifications_get/", NotificationsApi.get),
]
