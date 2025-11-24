from core.views.widget import WidgetPreviewView
from django.urls import path
from django.views.generic import RedirectView
from lti.views.config import lti_config
from lti.views.deep_linking import lti_deep_link_selection
from lti.views.init import MateriaOIDCLoginInitView
from lti.views.launch import ApplicationLaunchView
from lti.views.lti import error_page
from lti.views.lti import picker as lti_picker
from lti.views.lti import post_login as lti_post_login
from lti_tool.views import jwks

urlpatterns = [
    path("lti/picker/", lti_picker, name="lti picker"),
    path("lti/post_login/", lti_post_login, name="lti login success"),
    path(
        "lti/deep_link_selection/",
        lti_deep_link_selection,
        name="lti deep link selection",
    ),
    path(".well-known/jwks.json", jwks, name="jwks"),
    path(
        "init/<uuid:registration_uuid>/",
        MateriaOIDCLoginInitView.as_view(),
        name="init",
    ),
    path(
        "lticonfig/",
        RedirectView.as_view(url="/404", permanent=False),
        name="lti_config_no_provider",
    ),
    path("lticonfig/<slug:provider>", lti_config, name="lti_config"),
    path("ltilaunch/", ApplicationLaunchView.as_view(), name="ltilaunch"),
    path("lti/error/", error_page, name="error_page"),
    path(
        "preview-embed/<slug:widget_instance_id>/",
        WidgetPreviewView.as_view(),
        name="embedded widget preview",
    ),
]
