from api.views import (
    assets,
    notifications,
    playsessions,
    sessions,
    users,
    widget_instances,
    widgets,
)
from api.views.scores import ScoresApi
from api.views.sessions import SessionsApi
from api.views.users import UsersApi
from api.views.widgets import WidgetsApi
from django.urls import include, path
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r"asset", assets.AssetViewSet)
router.register(r"users", users.UserViewSet)
router.register(r"widgets", widgets.WidgetViewSet)
router.register(r"play-sessions", playsessions.PlaySessionViewSet)
router.register(
    r"instances", widget_instances.WidgetInstanceViewSet, basename="instances"
)
router.register(r"notifications", notifications.NotificationsViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("session/verify/", sessions.SessionView.as_view(), name="session-verify"),
    # Widgets
    # path("json/widgets_get_by_type/", WidgetsApi.widgets_get_by_type),
    # path("json/widgets_get/", WidgetsApi.widgets_get),
    path("json/widget_instances_get/", WidgetsApi.widget_instances_get),
    # Creator
    path("widget_instance/", include("api.urls.widget_instance_urls")),
    # Users
    # path("json/user_get", UsersApi.get),
    path("json/auth/login/", UsersApi.service_user_login, name="service_user_login"),
    # path("user/settings", UsersApi.update_settings),
    # path("json/user/activity", UsersApi.activity),
    # path("json/notifications_get/", NotificationsApi.get),
    # Sessions
    # path("json/session_play_create/", SessionsApi.session_play_create),
    path("json/play_logs_save/", SessionsApi.play_logs_save),
    # path("json/session_author_verify/", SessionsApi.author_verify),
    # path("json/session_role_verify/", SessionsApi.role_verify),
    # Scores
    path("json/widget_instance_scores_get/", ScoresApi.widget_instance_scores_get),
    path(
        "json/guest_widget_instance_scores_get/",
        ScoresApi.guest_widget_instance_scores_get,
    ),
    path(
        "json/widget_instance_play_scores_get/",
        ScoresApi.widget_instance_play_scores_get,
    ),
    path("json/score_summary_get/", ScoresApi.score_summary_get),
]
