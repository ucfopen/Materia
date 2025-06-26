from django.urls import path
from lti.views.config import lti_config
from lti.views.deep_linking import lti_deep_link_selection
from lti.views.launch import ApplicationLaunchView
from lti.views.lti import picker as lti_picker
from lti.views.lti import post_login as lti_post_login
from lti_tool.views import OIDCLoginInitView, jwks

urlpatterns = [
    path("lti/picker/", lti_picker, name="lti picker"),
    path("lti/post_login/", lti_post_login, name="lti login success"),
    path(
        "lti/deep_link_selection/",
        lti_deep_link_selection,
        name="lti deep link selection",
    ),
    path(".well-known/jwks.json", jwks, name="jwks"),
    path("init/<uuid:registration_uuid>/", OIDCLoginInitView.as_view(), name="init"),
    path("lticonfig/", lti_config, name="lti_config"),
    path("ltilaunch/", ApplicationLaunchView.as_view(), name="ltilaunch"),
    # path("oauth/", include("canvas_oauth.urls")),
    # path("set_grade", set_grade, name="set_grade"),
]
