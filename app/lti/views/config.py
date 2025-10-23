import json
from urllib.parse import urlparse

from django.conf import settings
from django.http import JsonResponse
from django.template.loader import render_to_string
from lti_tool.models import LtiRegistration


def lti_config(request):
    """
    The LTI config is currently configured to render values associated with a single registration
    based on the matching platform_domain value written to env vars
    While the underlying django-lti package supports multiple registrations,
    the system is not currently built to support them.
    """
    domain = urlparse(settings.LTI_URL_CONFIGS["tool_url"]).netloc or "localhost"
    platform_domain = settings.LTI_URL_CONFIGS["platform_domain"]

    try:
        # Get registration by token_url domain that matches platform_domain env var
        registration = LtiRegistration.objects.filter(
            token_url__contains=platform_domain
        ).first()
        registration_uuid = (
            registration.uuid if registration else "insert-registration-uuid-here"
        )
    except Exception as e:
        print(f"Error getting registration: {e}")
        registration_uuid = "insert-registration-uuid-here"

    json_template = render_to_string(
        "lti.json",
        {
            "app_hostname": settings.LTI_URL_CONFIGS["tool_url"] or "localhost",
            "platform": settings.LTI_URL_CONFIGS["platform_iss"]
            or "https://canvas.instructure.com",
            "app_domain": domain,
            "registration_uuid": registration_uuid,
        },
    )

    config = json.loads(json_template)
    return JsonResponse(config)
