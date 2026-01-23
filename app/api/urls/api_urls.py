from api.views import (
    assets,
    extra_attempts,
    generation,
    notifications,
    playsessions,
    scores,
    sessions,
    users,
    widget_instances,
    widgets,
    logstorage
)
from api.views.lti import LtiWidgetInstancesInCourseView
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
router.register(r"extra-attempts", extra_attempts.UserExtraAttemptsViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("session/verify/", sessions.SessionView.as_view(), name="session-verify"),
    # User
    path("user/login/", users.UsersApi.service_user_login, name="service_user_login"),
    # Scores
    path("scores/", scores.ScoresView.as_view()),
    path("scores/details/", scores.ScoresDetailView.as_view()),
    # AI generation
    path("generate/qset/", generation.GenerateQsetView.as_view()),
    path("generate/from_prompt/", generation.GenerateFromPromptView.as_view()),
    path("lti/<slug:context_id>/instances/", LtiWidgetInstancesInCourseView.as_view()),
    path("storage/", logstorage.PlayStorageSaveView.as_view()),
]
