import json
import logging
from urllib.parse import parse_qs, urlparse

from django.conf import settings
from django.http import HttpResponseBadRequest
from django.shortcuts import render
from lti.utils import (
    CookieFreeDjangoCacheDataStorage,
    store_post_message_initiation,
)
from lti_tool.utils import DjangoToolConfig
from lti_tool.views import OIDCLoginInitView
from pylti1p3.contrib.django import DjangoOIDCLogin
from pylti1p3.exception import OIDCException

logger = logging.getLogger(__name__)


class MateriaOIDCLoginInitView(OIDCLoginInitView):

    def get(self, request, *args, **kwargs):
        """
        Overrides OIDCLoginInitView's `get` method to intercept and handle OIDCExceptions.
        The intended behavior is to handle situations where a LTI registration has been disabled.
        """
        registration_uuid = kwargs.get("registration_uuid")
        try:
            return self.get_oidc_response(request, registration_uuid, request.GET)
        except OIDCException:
            from lti.views.lti import error_page as lti_error_page

            return lti_error_page(request, "error_registration_disabled")

    def get_redirect_url(self, target_link_uri: str) -> str:
        """
        Overrides OIDCLoginInitView's `get_redirect_url` method, as we only have one whitelisted launch URI: /ltilaunch/
        LTI 1.3 requires all launch URIs to be whitelisted in platform's LTI key
        From the launch view (lti/views/launch.py), handle_resource_launch and handle_deep_linking_launch actually send
        the user where they want to go
        """
        redirect = f"{settings.URLS["BASE_URL"]}ltilaunch/"
        return redirect

    def get_oidc_response(self, request, registration_uuid, params):
        storage_target = params.get("lti_storage_target")
        if storage_target != "post_message_forwarding":
            return super().get_oidc_response(request, registration_uuid, params)
        
        tool_conf = DjangoToolConfig(registration_uuid)
        launch_data_storage = CookieFreeDjangoCacheDataStorage()
        oidc_login = DjangoOIDCLogin(
            request, tool_conf, launch_data_storage=launch_data_storage
        )

        target_link_uri = params.get("target_link_uri")
        if target_link_uri is None:
            return HttpResponseBadRequest("Missing target_link_uri parameter.")

        authorization_url = oidc_login.get_redirect_object(
            target_link_uri
        ).get_redirect_url()
        parsed_redirect = urlparse(authorization_url)
        authorization_params = parse_qs(parsed_redirect.query)
        state = authorization_params.get("state", [None])[0]
        nonce = authorization_params.get("nonce", [None])[0]
        if not state or not nonce:
            raise OIDCException("OIDC authorization URL is missing state or nonce")

        if (
            parsed_redirect.scheme not in ("http", "https")
            or not parsed_redirect.netloc
        ):
            raise OIDCException("OIDC authorization URL has an invalid origin")

        platform_origin = f"{parsed_redirect.scheme}://{parsed_redirect.netloc}"
        store_post_message_initiation(
            state,
            nonce,
            storage_target,
            platform_origin,
        )

        return render(
            request,
            "oidc_put.html",
            {
                "params": json.dumps(params),
                "redirect_uri": authorization_url,
            },
        )
