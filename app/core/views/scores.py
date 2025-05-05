from core.models import WidgetInstance
from django.conf import settings
from django.http import (
    Http404,
    HttpRequest,
    HttpResponseBadRequest,
    HttpResponseForbidden,
    HttpResponseNotFound,
    HttpResponseRedirect,
)
from django.views.generic import TemplateView
from util.context_util import ContextUtil
from util.logging.session_play import SessionPlay


class ScoresView(TemplateView):
    template_name = "react.html"
    is_preview = False

    # Note: play_id isn't used on the backend, though the frontend will look for it in the URL
    def get_context_data(self, widget_instance_id, play_id=None):
        is_embedded = self.kwargs.get("is_embedded", False)
        token = self.kwargs.get("token")

        # Get widget instance
        instance = WidgetInstance.objects.filter(pk=widget_instance_id).first()
        if not instance:
            return HttpResponseNotFound()  # TODO must return context

        # Verify user is able to play this widget
        if not instance.playable_by_current_user(self.request.user):
            # TODO:
            # Session::set_flash('notice', 'Please log in to view your scores.');
            # Response::redirect(Router::get('login').'?redirect='.urlencode(URI::current()));
            return ContextUtil.create(
                title="Invalid",
                js_resources=[],
                css_resources=[],
                js_globals={},
                request=self.request,
            )

        return ContextUtil.create(
            title="Score Results",
            js_resources=settings.JS_GROUPS["scores"],
            css_resources=settings.CSS_GROUPS["scores"],
            js_globals={
                "IS_EMBEDDED": self.kwargs.get("is_embedded", False),
                "IS_PREVIEW": self.is_preview,
                "LAUNCH_TOKEN": self.kwargs.get("token", None),
            },
            request=self.request,
        )


# Allow LTI launches to score screens
# In Canvas, this is shown on the grade review
# enabled by launch param ext_outcome_data_values_accepted=url
class ScoresViewSingle(TemplateView):
    template_name = "react.html"

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
        # TODO:
        # Session::set_flash('notice', 'Please log in to view your scores.');
        # Response::redirect(Router::get('login').'?redirect='.urlencode(URI::current()));
        raise Http404()

    # Set up context and return
    js_globals = {
        "IS_EMBEDDED": is_embedded,
        "IS_PREVIEW": is_preview,
    }

    if token:
        js_globals["LAUNCH_TOKEN"] = token

    # TODO: insert support inline info - see php

    return ContextUtil.create(
        title="Score Results",
        js_resources=settings.JS_GROUPS["scores"],
        css_resources=settings.CSS_GROUPS["scores"],
        js_globals=js_globals,
        request=request,
    )
