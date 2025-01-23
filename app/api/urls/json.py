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
    path("widgets_get_by_type/", widgets_api.widgets_get_by_type),
    path("widgets_get/", widgets_api.widgets_get),
    path("widget_instances_get/", widgets_api.widget_instances_get),
    path("question_set_get/", widgets_api.question_set_get),

    # Users
    path("user_get", UsersApi.get),

    path("user/activity", UsersApi.activity),
    path("session_author_verify/", SessionsApi.author_verify),

    path("notifications_get/", NotificationsApi.get),

    # Sessions
    path("session_play_create/", sessions_api.play_create),
    path("play_logs_save/", sessions_api.play_save),
    path("session_author_verify/", sessions_api.author_verify),

    # Scores
    path("widget_instance_scores_get/", ScoresApi.widget_instance_scores_get),
    path("guest_widget_instance_scores_get/", ScoresApi.guest_widget_instance_scores_get),
    path("widget_instance_play_scores_get/", ScoresApi.widget_instance_play_scores_get),
    path("score_summary_get/", ScoresApi.score_summary_get),
]
