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

urlpatterns = [
    path("", core_views.index, name="home page"),
    path("help/", core_views.help, name="help"),

    # Widgets
    path("widgets/", CatalogView.index, name="widget catalog"),
    path("widgets/<slug:widget_slug>/", WidgetDetailView.as_view(), name="widget detail"),
    path("widgets/<slug:widget_slug>/demo", WidgetDemoView.as_view(), name="widget demo"),
    path("play/<slug:widget_instance_id>/", WidgetPlayView.as_view(), name="widget play"),
    path("play/<slug:widget_instance_id>/<str:instance_name>/", WidgetPlayView.as_view(), name="widget play"),

    # Creator
    path("widgets/<slug:widget_slug>/create", WidgetCreatorView.as_view(), name="widget creator"),
    path("preview/<slug:widget_instance_id>", WidgetPreviewView.as_view(), name="widget preview"),

    # Scores
    path("scores/preview/<slug:widget_instance_id>/", ScoresView.as_view(is_preview=True), name="preview scores"),
    path("scores/<slug:widget_instance_id>/<slug:play_id>/", ScoresView.as_view(), name="scores"),

    # API
    path("api/", include("api.urls.api_urls")),
    path("api/user/activity", UsersApi.activity),
    path("profile/", profile_views.profile, name="profile"),
    path("login/", login_views.login, name="login"),
    path("admin/", admin.site.urls),
]

handler404 = "core.views.main.handler404"
handler500 = "core.views.main.handler500"
