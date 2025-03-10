"""
URL configuration for materia project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from core.views import main as core_views
from core.views.catalog import CatalogView

from core.views import profile as profile_views
from core.views import login as login_views

from core.views.scores import ScoresView
from core.views.widget import *

from django.urls import include, path
from api.views.users import UsersApi
from django.contrib import admin

from rest_framework import routers
from api.views import users
from api.views import widgets
from api.views import sessions
from api.views import playsessions
from api.views import widget_instances

router = routers.DefaultRouter()
router.register(r'users', users.UserViewSet)
router.register(r'widgets', widgets.WidgetViewSet)
router.register(r'play-sessions', playsessions.PlaySessionViewSet)
router.register(r'instances', widget_instances.WidgetInstanceViewSet)

urlpatterns = [
    path("api/", include(router.urls)),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    path('api/session/verify/', sessions.SessionView.as_view(), name='session-verify'),

    path("", core_views.index, name="home page"),
    path("help/", core_views.help, name="help"),

    # Widgets
    path("widgets/", CatalogView.index, name="widget catalog"),
    path("widgets/<slug:widget_slug>/", WidgetDetailView.as_view(), name="widget detail"),
    path("widgets/<slug:widget_slug>/demo", WidgetDemoView.as_view(), name="widget demo"),
    path("play/<slug:widget_instance_id>/", WidgetPlayView.as_view(), name="widget play"),
    path("play/<slug:widget_instance_id>/<str:instance_name>/", WidgetPlayView.as_view(), name="widget play"),

    # Scores
    path("scores/<slug:widget_instance_id>/<slug:play_id>/", ScoresView.as_view(), name="scores"),

    # API (TODO: improve API routing, retire api/json)
    path("api/json/", include("api.urls.json")),
    path("api/user/activity", UsersApi.activity),
    path("profile/", profile_views.profile, name="profile"),
    path("settings/", profile_views.settings, name="settings"),
	path("users/login", login_views.login, name="login"),
    path("login/", login_views.login, name="login"),
    path("admin/", admin.site.urls),
    path("users/logout/", UsersApi.logout, name="logout"),
]

handler404 = "core.views.main.handler404"
handler500 = "core.views.main.handler500"
