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

from api.views.users import UsersApi
from core.views import login as login_views
from core.views import main as core_views
from core.views import profile as profile_views
from core.views.admin import instance as instance_admin
from core.views.admin import user as user_admin
from core.views.admin import widget as widget_admin
from core.views.catalog import CatalogView
from core.views.media import MediaImportView, MediaRender, MediaUpload
from core.views.my_widgets import MyWidgetsView
from core.views.scores import ScoresView, ScoresViewSingle
from core.views.widget import (
    WidgetCreatorView,
    WidgetDemoView,
    WidgetDetailView,
    WidgetGuideView,
    WidgetPlayView,
    WidgetPreviewView,
    WidgetQsetGenerateView,
    WidgetQsetHistoryView,
)
from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from lti.urls import urlpatterns as lti_urlpatterns

urlpatterns = [
    # api router and endpoint registration in api_urls
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    path("", core_views.index, name="home page"),
    path("help/", core_views.help, name="help"),
    # Widgets
    path("widgets/", CatalogView.index, name="widget catalog"),
    path(
        "widgets/<slug:widget_slug>/", WidgetDetailView.as_view(), name="widget detail"
    ),
    path(
        "widgets/<slug:widget_slug>/demo", WidgetDemoView.as_view(), name="widget demo"
    ),
    re_path(
        r"^widgets/(?P<widget_slug>[\w-]+)/(?P<guide_type>(creators|players))-guide/$",
        WidgetGuideView.as_view(),
        name="widget guide view",
    ),
    path(
        "play/<slug:widget_instance_id>/",
        WidgetPlayView.as_view(),
        {"is_embed": False},
        name="widget play",
    ),
    path(
        "play/<slug:widget_instance_id>/<str:instance_name>/",
        WidgetPlayView.as_view(),
        {"is_embed": False},
        name="widget play",
    ),
    path(
        "embed/<slug:widget_instance_id>/",
        WidgetPlayView.as_view(),
        {"is_embed": True},
        name="widget embed",
    ),
    path(
        "embed/<slug:widget_instance_id>/<str:instance_name>/",
        WidgetPlayView.as_view(),
        {"is_embed": True},
        name="widget embed",
    ),
    path(
        "preview/<slug:widget_instance_id>/",
        WidgetPreviewView.as_view(),
        {"is_embed": False},
        name="widget preview",
    ),
    path(
        "preview/<slug:widget_instance_id>/<str:instance_name>/",
        WidgetPreviewView.as_view(),
        {"is_embed": False},
        name="widget preview",
    ),
    # My Widgets
    path("my-widgets/", MyWidgetsView.index, name="my widgets"),
    # Creator
    path(
        "widgets/<slug:widget_slug>/create/",
        WidgetCreatorView.as_view(),
        name="widget creator",
    ),
    path(
        "widgets/<slug:widget_slug>/create/<str:instance_id>",
        WidgetCreatorView.as_view(),
        name="widget creator existing instance",
    ),
    path(
        "preview/<slug:widget_instance_id>/",
        WidgetPreviewView.as_view(),
        name="widget preview",
    ),
    path(
        "preview/<slug:widget_instance_id>/<title>/",
        WidgetPreviewView.as_view(),
        name="widget preview",
    ),
    path("qsets/history/", WidgetQsetHistoryView.as_view(), name="widget qset history"),
    path(
        "qsets/generate/", WidgetQsetGenerateView.as_view(), name="widget qset generate"
    ),
    # Scores
    path(
        "scores/preview/<slug:widget_instance_id>/<slug:preview_id>/",
        ScoresView.as_view(),
        name="preview scores",
    ),
    path(
        "scores/<slug:widget_instance_id>/<slug:play_id>/",
        ScoresView.as_view(),
        name="scores",
    ),
    path(
        "scores/<slug:widget_instance_id>/",
        ScoresView.as_view(),
        name="scores",
    ),
    path(
        "scores/embed/<slug:widget_instance_id>/<slug:play_id>/",
        ScoresView.as_view(),
        name="scores",
    ),
    path(
        "scores/single/<slug:widget_instance_id>/<slug:play_id>/",
        ScoresViewSingle.as_view(),
        name="single score",
    ),
    # API
    path("api/", include("api.urls.api_urls")),
    # path("api/user/activity", UsersApi.activity),
    path("profile/", profile_views.profile, name="profile"),
    path("settings/", profile_views.settings, name="settings"),
    path("users/login", login_views.login, name="login"),
    path("login/", login_views.login, name="login"),
    path("admin/widget", widget_admin, name="widget admin"),
    path("admin/instance", instance_admin, name="instance admin"),
    path("admin/user", user_admin, name="user admin"),
    path("admin/", admin.site.urls),
    path("users/logout/", UsersApi.logout, name="logout"),
    # Media
    path("media/import", MediaImportView.index, name="media importer"),
    path("media/upload/", MediaUpload.index),
    # matches media/asset_id, media/asset_id/thumbnail and media/asset_id/large
    re_path(
        r"^media/(?P<asset_id>[\w-]+)(?:/(?P<size>thumbnail|large))?/$",
        MediaRender.index,
    ),
]

urlpatterns.extend(lti_urlpatterns)

# enable additional routes to be added from custom packages based on app settings
try:
    # this assumes/requires each package's routes to be defined as urlpatterns
    #  that are importable from a given include path
    # also assumes that they're all valid with an empty starting path, which isn't
    #  great but at least allows this to work
    package_routes = settings.ADDITIONAL_PACKAGE_URL_PATTERNS
    if package_routes and len(package_routes) > 0:
        for routes in package_routes:
            urlpatterns.extend([path("", include(routes))])
except AttributeError:
    # the setting is optional and has no default value
    pass

handler403 = "core.views.exception_handlers.forbidden"
handler404 = "core.views.main.handler404"
handler500 = "core.views.main.handler500"
