from core.models import WidgetInstance
from util.context_util import ContextUtil


class ScoresView(TemplateView):
    template_name = "react.html"
    is_preview = False

    def get(self, request, *args, **kwargs):
        self.widget_instance_id = kwargs.get("widget_instance_id")
        self.play_id = kwargs.get("play_id")
        self.token = kwargs.get("token")
        self.is_embedded = kwargs.get("is_embedded", False)

        # Get widget instance
        instance = WidgetInstance.objects.filter(pk=self.widget_instance_id).first()
        if not instance:
            return HttpResponseNotFound("Widget instance not found")

        # Check if user is allowed
        if not instance.playable_by_current_user(request.user):
            return HttpResponseForbidden("Not authorized to view scores")

        return super().get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        print("WE ARE GETTING CONTEXT DATA")
        print("WE ARE GETTING CONTEXT DATA")
        print("WE ARE GETTING CONTEXT DATA")
        print("WE ARE GETTING CONTEXT DATA")
        context = super().get_context_data(**kwargs)

        js_globals = {
            "IS_EMBEDDED": is_embedded,
            "IS_PREVIEW": self.is_preview,
        }

        if self.token:
            js_globals["LAUNCH_TOKEN"] = self.token

        context.update(
            {
                "title": "Score Results",
                "js_resources": settings.JS_GROUPS["scores"],
                "css_resources": settings.CSS_GROUPS["scores"],
                "js_global_variables": js_globals,
            }
        )

        return ContextUtil.create(
            title="Score Results",
            js_resources=settings.JS_GROUPS["scores"],
            css_resources=settings.CSS_GROUPS["scores"],
            js_globals=js_globals,
            request=self.request,
        )
