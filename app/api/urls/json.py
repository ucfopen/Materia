from api.views.notifications import NotificationsApi
from api.views.scores import ScoresApi
from api.views.users import UsersApi

# this could probably be handled a bit more neatly
# from api.views.widgets import WidgetsApi
import api.views.widgets as widgets_api
import api.views.sessions as sessions_api

from django.urls import path

urlpatterns = [
    # Widgets
    path("widgets_get_by_type/",  widgets_api.by_type),
    path("widgets_get/", widgets_api.by_id),
    path("widget_instances_get/", widgets_api.get_instances),
    path("question_set_get/", widgets_api.get_qset),

    # Users
    path("user_get", UsersApi.get),
    path("notifications_get/", NotificationsApi.get),

    # Sessions
    path("session_play_create/", sessions_api.play_create),
    path("play_logs_save/", sessions_api.play_save),
    path("session_author_verify/", sessions_api.author_verify),

    # Scores
    path("widget_instance_scores_get/", ScoresApi.get_scores_by_instance),
    path("guest_widget_instance_scores_get/", ScoresApi.get_scores_by_guest_instance),
]
