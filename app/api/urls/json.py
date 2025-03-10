from api.views.widgets import WidgetsApi
from api.views.notifications import NotificationsApi
from api.views.scores import ScoresApi
from api.views.sessions import SessionsApi
from api.views.users import UsersApi

from django.urls import path

urlpatterns = [
    # Widgets
    # path("widgets_get_by_type/", WidgetsApi.widgets_get_by_type),
    # path("widgets_get/", WidgetsApi.widgets_get),
    path("widget_instances_get/", WidgetsApi.widget_instances_get),
    path("question_set_get/", WidgetsApi.question_set_get),

    # Users
    path("auth/login/", UsersApi.service_user_login, name="service_user_login"),

    path("user/activity", UsersApi.activity),
    path("session_role_verify/", SessionsApi.role_verify),
    path("notifications_get/", NotificationsApi.get),

    # Sessions
    path("session_play_create/", SessionsApi.play_create),
    path("play_logs_save/", SessionsApi.play_save),
    # path("session_author_verify/", SessionsApi.author_verify),

    # Scores
    path("widget_instance_scores_get/", ScoresApi.widget_instance_scores_get),
    path("guest_widget_instance_scores_get/", ScoresApi.guest_widget_instance_scores_get),
    path("widget_instance_play_scores_get/", ScoresApi.widget_instance_play_scores_get),
    path("score_summary_get/", ScoresApi.score_summary_get),
]
