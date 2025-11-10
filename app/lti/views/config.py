import json
from urllib.parse import urlparse

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import redirect
from django.template.loader import render_to_string
from lti_tool.models import LtiRegistration


def lti_config(request, provider):
    """
    Renders the LTI config JSON for the given provider.
    The JSON config is registration-specific, and we map registrations to providers using
    the registration name value. Requests that don't include a provider string or use a string
    that fails to map to a registration are redirected to /404.
    """

    # domain is the tool (your instance of Materia) URL, NOT the provider domain
    domain = urlparse(settings.LTI_URL_CONFIGS["tool_url"]).netloc or "localhost"

    try:
        registration = LtiRegistration.objects.filter(name__icontains=provider).first()
    except Exception:
        return redirect("/404")

    json_template = render_to_string(
        "lti.json",
        {
            "app_hostname": settings.LTI_URL_CONFIGS["tool_url"] or "localhost",
            "platform": registration.issuer,
            "app_domain": domain,
            "registration_uuid": registration.uuid,
        },
    )

    config = json.loads(json_template)
    return JsonResponse(config)
