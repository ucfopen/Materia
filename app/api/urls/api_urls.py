from api.views import (
    assets,
    generation,
    notifications,
    playsessions,
    sessions,
    users,
    widget_instances,
    widgets,
)
from api.views.scores import ScoresApi
from django.urls import include, path
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r"assets", assets.AssetViewSet)
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
    # User
    path("user/login/", users.UsersApi.service_user_login, name="service_user_login"),
    # Scores
    path("scores/get_for_widget_instance/", ScoresApi.get_for_widget_instance),
    path(
        "scores/get_for_widget_instance_guest/", ScoresApi.get_for_widget_instance_guest
    ),
    path("scores/get_play_details/", ScoresApi.get_play_details),
    path("scores/get_score_summary/", ScoresApi.score_summary_get),
    # AI generation
    path("generate/qset/", generation.GenerateQsetView.as_view()),
    path("generate/from_prompt/", generation.GenerateFromPromptView.as_view()),
]
