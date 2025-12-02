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
        token = request.GET.get("token")

        # Grab and verify play
        play = LogPlay.objects.get(pk=play_id)
        if play is None:
            return HttpResponseNotFound()
        if play.instance.id != widget_instance_id:
            return HttpResponseBadRequest()

        # TODO
        # Revisit this redirect: this event trigger was associated LTI 1.1

        # Allow event listeners to redirect users
        # This is mostly to redirect them to failure status pages
        # $results = \Event::trigger('before_single_score_review',
        # ['play_id' => $play_id, 'content_id' => $play->context_id], 'array');

        # if redirect:
        #     return HttpResponseRedirect(redirect)

        # allow lti launches from only authors or staff
        if LTILaunchService.is_lti_launch(request):
            launch = LTILaunchService.get_launch_data(request)
            is_author_or_staff = LTILaunchService.is_user_course_author(
                launch
            ) or LTILaunchService.is_user_staff(launch)
            if not is_author_or_staff:
                raise MateriaLoginNeeded(
                    login_message="You do not have permission to view this score."
                )

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
    js_globals = {
        "USER_ID": request.user.id,
    }

    # if there is a token param present, append additional globals to communicate LTI context
    if token:
        js_globals["LTI_TOKEN"] = token
        launch = LTILaunchService.get_session_launch(request, token)
        if launch:
            js_globals["CONTEXT_ID"] = LTILaunchService.get_context_id(launch)
    else:
        if LTILaunchService.is_lti_launch(request):
            js_globals["LTI_EMBEDDED"] = True

    return ContextUtil.create(
        title="Score Results",
        js_resources=settings.JS_GROUPS["scores"],
        css_resources=settings.CSS_GROUPS["scores"],
        js_globals=js_globals,
        request=request,
    )
