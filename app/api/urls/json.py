from api.views.notifications import NotificationsApi
from api.views.users import UsersApi

# this could probably be handled a bit more neatly
# from api.views.widgets import WidgetsApi
import api.views.widgets as widgets_api
import api.views.sessions as sessions_api

from django.urls import path

urlpatterns = [
    path("widgets_get_by_type/",  widgets_api.by_type),
    path("widgets_get/", widgets_api.by_id),
    path("widget_instances_get/", widgets_api.get_instances),
    path("question_set_get/", widgets_api.get_qset),
    path("user_get", UsersApi.get),
    path("session_author_verify/", sessions_api.author_verify),
    path("notifications_get/", NotificationsApi.get),
    path("session_play_create/", sessions_api.play_create),
]
