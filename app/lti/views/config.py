import json
import os
from urllib.parse import urlparse

from django.http import JsonResponse
from django.template.loader import render_to_string
from lti_tool.models import LtiRegistration


# TODO this will only render the first LTI registration with a domain that matches the canvas_domain value.
# we should probably find a way to render multiple lti configs under different paths?
def lti_config(request):

    # TODO these values should come from settings.URLS instead of directly from env
    domain = urlparse(os.environ.get("TOOL_URL", "localhost")).netloc or "localhost"
    canvas_domain = os.environ.get("CANVAS_DOMAIN")

    try:
        # Get registration by token_url domain that matches canvas_domain env var
        registration = LtiRegistration.objects.filter(
            token_url__contains=canvas_domain
        ).first()
        print(f"Using registration: {registration}")
        registration_uuid = (
            registration.uuid if registration else "insert-registration-uuid-here"
        )
    except Exception as e:
        print(f"Error getting registration: {e}")
        registration_uuid = "insert-registration-uuid-here"

    json_template = render_to_string(
        "lti.json",
        {
            "app_hostname": os.environ.get("TOOL_URL", "localhost"),
            "app_domain": domain,
            "registration_uuid": registration_uuid,
        },
    )

    config = json.loads(json_template)
    return JsonResponse(config)
