from core.mixins import MateriaLoginMixin, MateriaLoginNeeded
from core.models import WidgetInstance
from django.conf import settings
from django.http import (
    Http404,
    HttpRequest,
    HttpResponseBadRequest,
    HttpResponseNotFound,
    HttpResponseRedirect,
)
from django.views.generic import TemplateView
from util.context_util import ContextUtil
from util.logging.session_play import SessionPlay


class ScoresView(MateriaLoginMixin, TemplateView):
    template_name = "react.html"
    is_preview = False
    allow_all_by_default = True

    def get(self, request, *args, **kwargs):
        widget_instance_id = kwargs.get("widget_instance_id")
        token = kwargs.get("token")
        is_embedded = kwargs.get("is_embedded", False)

        instance = WidgetInstance.objects.filter(pk=widget_instance_id).first()
        if not instance:
            return HttpResponseNotFound()

        if not instance.playable_by_current_user(self.request.user):
            return ContextUtil.create(
                title="Invalid",
                js_resources=[],
                css_resources=[],
                js_globals={},
                request=self.request,
            )

        context = ContextUtil.create(
            title="Score Results",
            js_resources=settings.JS_GROUPS["scores"],
            css_resources=settings.CSS_GROUPS["scores"],
            js_globals={
                "IS_EMBEDDED": is_embedded,
                "IS_PREVIEW": self.is_preview,
                "LAUNCH_TOKEN": token,
            },
            request=self.request,
        )

        return self.render_to_response(context)


# Allow LTI launches to score screens
# In Canvas, this is shown on the grade review
# enabled by launch param ext_outcome_data_values_accepted=url
class ScoresViewSingle(MateriaLoginMixin, TemplateView):
    template_name = "react.html"
    allow_all_by_default = True

    def get(self, request, *args, **kwargs):
        # Get url args
        play_id = kwargs.get("play_id")
        widget_instance_id = kwargs.get("widget_instance_id")
        token = self.kwargs.get("token")

        # Grab and verify play
        play = SessionPlay.get_or_none(play_id)
        if play is None:
            return HttpResponseNotFound()
        if play.data.instance.id != widget_instance_id:
            return HttpResponseBadRequest()

        redirect = None
        is_embedded = False

        # Allow event listeners to redirect users
        # This is mostly to redirect them to failure status pages
        # TODO event trigger here - see php
        # $results = \Event::trigger('before_single_score_review',
        # ['play_id' => $play_id, 'content_id' => $play->context_id], 'array');

        results = []
        for result in results:
            # Allow events to redirect
            if "redirect" in result:
                redirect = result["redirect"]
            if "is_embedded" in result:
                is_embedded = result["is_embedded"]

        if redirect:
            return HttpResponseRedirect(redirect)

        context = _get_context_data(
            request, widget_instance_id, is_embedded, False, token
        )
        return self.render_to_response(context)


def _get_context_data(
    request: HttpRequest,
    widget_instance_id: str,
    is_embedded: bool = False,
    is_preview: bool = False,
    token: str = None,
) -> dict:
    # Get widget instance
    instance = WidgetInstance.objects.filter(pk=widget_instance_id).first()
    if not instance:
        raise Http404()

    # Verify user is able to play this widget
    if not instance.playable_by_current_user(request.user):
        raise MateriaLoginNeeded(login_message="Please log in to view your scores.")

    # Set up context and return
    js_globals = {
        "IS_EMBEDDED": is_embedded,
        "IS_PREVIEW": is_preview,
    }

    if token:
        js_globals["LAUNCH_TOKEN"] = token

    return ContextUtil.create(
        title="Score Results",
        js_resources=settings.JS_GROUPS["scores"],
        css_resources=settings.CSS_GROUPS["scores"],
        js_globals=js_globals,
        request=request,
    )
