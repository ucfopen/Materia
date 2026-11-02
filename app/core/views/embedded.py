from core.utils.context_util import ContextUtil
from django.conf import settings
from django.http import Http404
from django.shortcuts import render
from django.views.decorators.cache import never_cache


@never_cache
def embedded_shell(request, widget_instance_id=None, token=""):
    if not settings.EMBEDDED_AUTH_ENABLED:
        raise Http404
    context = ContextUtil.create(
        title="Embedded Materia",
        page_type="widget",
        js_resources=settings.JS_GROUPS["embedded-player"],
        css_resources=settings.CSS_GROUPS["embedded-player"]
        + settings.CSS_GROUPS["lti"],
        request=request,
        js_globals={
            "EMBEDDED_INSTANCE_ID": widget_instance_id,
            "EMBEDDED_ACCESS_TOKEN": token,
            "MEDIA_URL": settings.URLS["MEDIA_URL"],
        },
    )
    context["embedded_auth"] = True
    response = render(request, "react.html", context)
    response["Referrer-Policy"] = "no-referrer"
    return response
