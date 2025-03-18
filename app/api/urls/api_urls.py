from api.views.generation_api import GenerationApi
from api.views.notifications_api import NotificationsViewSet
from api.views.scores_api import ScoresApi
from api.views.sessions_api import SessionView, SessionsApi
from api.views.users_api import UserViewSet, UsersApi
from api.views.widget_instance_api import WidgetInstanceAPI
from api.views.widgets import WidgetsApi

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

    # Widget Instances
    path("publish_perms_verify/", WidgetInstanceAPI.publish_perms_verify),
    path("lock/", WidgetInstanceAPI.lock),
    path("history/", WidgetInstanceAPI.history),

    # Widgets
    # path("json/widgets_get_by_type/", WidgetsApi.widgets_get_by_type),
    # path("json/widgets_get/", WidgetsApi.widgets_get),
    path("json/widget_instances_get/", WidgetsApi.widget_instances_get),

    # Creator
    # path("widget_instance/", include("api.urls.widget_instance_urls")),

    # Users
    # path("json/user_get", UsersApi.get),
    path("user/login/", UsersApi.service_user_login, name="service_user_login"),
    # path("user/settings", UsersApi.update_settings),

    # path("json/user/activity", UsersApi.activity),
    # path("json/notifications_get/", NotificationsApi.get),
    path("user/get_questions/", UsersApi.get_questions),

    # Sessions
    # path("json/session_play_create/", SessionsApi.session_play_create),
    path("json/play_logs_save/", SessionsApi.play_save),
    # path("json/session_author_verify/", SessionsApi.author_verify),
    # path("json/session_role_verify/", SessionsApi.role_verify),

    # Scores
    path("scores/get_for_widget_instance/", ScoresApi.get_for_widget_instance),
    path("scores/get_for_widget_instance_guest/", ScoresApi.get_for_widget_instance_guest),
    path("scores/get_play_details/", ScoresApi.get_play_details),
    path("scores/get_score_summary/", ScoresApi.score_summary_get),

    # AI generation
    path("generate/qset/", GenerationApi.generate_qset),
    path("generate/from_prompt/", GenerationApi.generate_from_prompt),
]
