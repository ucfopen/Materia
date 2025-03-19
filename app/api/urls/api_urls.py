from api.views.scores import ScoresApi
from api.views.users import UsersApi

from django.urls import path, include

from rest_framework import routers
from api.views import users
from api.views import widgets
from api.views import sessions
from api.views import playsessions
from api.views import widget_instances
from api.views import notifications

router = routers.DefaultRouter()
router.register(r'users', users.UserViewSet)
router.register(r'widgets', widgets.WidgetViewSet)
router.register(r'play-sessions', playsessions.PlaySessionViewSet)
router.register(r'instances', widget_instances.WidgetInstanceViewSet, basename="instances")
router.register(r'notifications', notifications.NotificationsViewSet)

urlpatterns = [

    path("", include(router.urls)),
    path('session/verify/', sessions.SessionView.as_view(), name='session-verify'),

    # Creator
    path("widget_instance/", include("api.urls.widget_instance_urls")),


    path("json/auth/login/", UsersApi.service_user_login, name="service_user_login"),

    # Scores
    path("json/widget_instance_scores_get/", ScoresApi.widget_instance_scores_get),
    path("json/guest_widget_instance_scores_get/", ScoresApi.guest_widget_instance_scores_get),
    path("json/widget_instance_play_scores_get/", ScoresApi.widget_instance_play_scores_get),
    path("json/score_summary_get/", ScoresApi.score_summary_get),
]
