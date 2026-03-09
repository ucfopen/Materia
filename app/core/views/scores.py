import logging

from core.mixins import MateriaLoginMixin, MateriaLoginNeeded
from core.models import LogPlay, WidgetInstance
from core.utils.context_util import ContextUtil
from django.conf import settings
from django.http import (
    Http404,
    HttpRequest,
    HttpResponseBadRequest,
    HttpResponseNotFound,
)
from django.views.generic import TemplateView
from lti.services.launch import LTILaunchService

logger = logging.getLogger(__name__)


class ScoresView(MateriaLoginMixin, TemplateView):
    template_name = "react.html"
    allow_all_by_default = True

    def get(self, request, *args, **kwargs):
        widget_instance_id = kwargs.get("widget_instance_id")
        token = request.GET.get("token")

        instance = WidgetInstance.objects.filter(pk=widget_instance_id).first()
        if not instance:
            return HttpResponseNotFound()
        context = _get_context_data(request, widget_instance_id, token)

        if not instance.playable_by_current_user(self.request.user):
            context = ContextUtil.create(
                request=request,
                title="Forbidden",
                js_resources=settings.JS_GROUPS["no-permission"],
                css_resources=settings.CSS_GROUPS["no-permission"],
                js_globals={},
            )

        return self.render_to_response(context)


class ScoresViewSingle(MateriaLoginMixin, TemplateView):
    template_name = "react.html"
    allow_all_by_default = True

    def get(self, request, *args, **kwargs):
        # Get url args
        play_id = kwargs.get("play_id")
        widget_instance_id = kwargs.get("widget_instance_id")
        token = request.GET.get("token")

        # Swap if play_id is shorter than widget_instance_id
        # Why? Because the LTI 1.1 implementation provided /scores/single/play_id/inst_id/ as the score submission URI
        if len(play_id) < len(widget_instance_id):
            play_id, widget_instance_id = widget_instance_id, play_id

        # Grab and verify play
        play = LogPlay.objects.get(pk=play_id)
        if play is None:
            return HttpResponseNotFound()
        if play.instance.id != widget_instance_id:
            return HttpResponseBadRequest()

        context = _get_context_data(request, widget_instance_id, token)
        return self.render_to_response(context)


def _get_context_data(
    request: HttpRequest,
    widget_instance_id: str,
    token: str = None,
) -> dict:
    # Get widget instance
    instance = WidgetInstance.objects.filter(pk=widget_instance_id).first()
    if not instance:
        raise Http404()

    # Verify user is able to play this widget
    if not instance.playable_by_current_user(request.user):
        raise MateriaLoginNeeded(login_message="Please log in to view your scores.")

    # configure JS globals, USER_ID is always required
    js_globals = {"USER_ID": request.user.id, "MEDIA_URL": settings.URLS["MEDIA_URL"]}

    # if there is a token param present, append additional globals to communicate LTI context
    if token:
        js_globals["LTI_TOKEN"] = token
        play_assoc = LogPlay.objects.filter(pk=token).first()
        if play_assoc:
            js_globals["CONTEXT_ID"] = play_assoc.context_id
    else:
        if LTILaunchService.is_lti_launch(
            request
        ) and LTILaunchService.is_last_launch_still_valid(request):
            js_globals["LTI_EMBEDDED"] = True

    return ContextUtil.create(
        title="Score Results",
        js_resources=settings.JS_GROUPS["scores"],
        css_resources=settings.CSS_GROUPS["scores"],
        js_globals=js_globals,
        request=request,
    )
