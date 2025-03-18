from django.http import HttpResponseNotFound, HttpResponseForbidden
from django.conf import settings
from django.views.generic import TemplateView

from core.models import WidgetInstance
from util.context_util import ContextUtil


class ScoresView(TemplateView):
    template_name = 'react.html'
    is_preview = False

    # Note: play_id isn't used on the backend, though the frontend will look for it in the URL
    def get_context_data(self, widget_instance_id, play_id=None):
        is_embedded = self.kwargs.get('is_embedded', False)
        token = self.kwargs.get('token')

        # Get widget instance
        instance = WidgetInstance.objects.filter(pk=widget_instance_id).first()
        if not instance:
            return HttpResponseNotFound()  # TODO must return context

        # Verify user is able to play this widget
        if not instance.playable_by_current_user(self.request.user):
            # TODO:
            # Session::set_flash('notice', 'Please log in to view your scores.');
            # Response::redirect(Router::get('login').'?redirect='.urlencode(URI::current()));
            return HttpResponseForbidden()  # TODO must return context

        # Set up context and return
        js_globals = {
            "IS_EMBEDDED": is_embedded,
            "IS_PREVIEW": self.is_preview,
        }

        if token:
            js_globals["LAUNCH_TOKEN"] = token

        # TODO: insert support inline info - see php

        return ContextUtil.create(
            title="Score Results",
            js_resources=settings.JS_GROUPS["scores"],
            css_resources=settings.CSS_GROUPS["scores"],
            fonts=settings.FONTS_DEFAULT,
            js_globals=js_globals,
            request=self.request,
        )
