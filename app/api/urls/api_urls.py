from api.views.generation_api import GenerateQsetView, GenerateFromPromptView
from api.views.notifications_api import NotificationsViewSet
from api.views.scores_api import ScoresApi
from api.views.sessions_api import SessionView
from api.views.users_api import UserViewSet, UsersApi

from django.urls import path, include

from rest_framework import routers
from api.views import widgets
from api.views import playsessions
from api.views import widget_instances

router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'widgets', widgets.WidgetViewSet)
router.register(r'play-sessions', playsessions.PlaySessionViewSet)
router.register(r'instances', widget_instances.WidgetInstanceViewSet, basename="instances")
router.register(r'notifications', NotificationsViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("session/verify/", SessionView.as_view(), name='session-verify'),

    # Users
    path("user/login/", UsersApi.service_user_login, name="service_user_login"),
    path("user/get_questions/", UsersApi.get_questions),  # TODO remove this feature as a whole?

    # Scores
    path("scores/get_for_widget_instance/", ScoresApi.get_for_widget_instance),
    path("scores/get_for_widget_instance_guest/", ScoresApi.get_for_widget_instance_guest),
    path("scores/get_play_details/", ScoresApi.get_play_details),
    path("scores/get_score_summary/", ScoresApi.score_summary_get),

    # AI generation
    path("generate/qset/", GenerateQsetView.as_view()),
    path("generate/from_prompt/", GenerateFromPromptView.as_view()),
]
