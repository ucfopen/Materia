from core.utils.context_util import ContextUtil
from django.conf import settings
from django.shortcuts import render
from django.views.generic import TemplateView


class CommunityLibraryView(TemplateView):
    @staticmethod
    def index(request):
        context = ContextUtil.create(
            title="Community Library",
            js_resources=settings.JS_GROUPS["community-library"],
            css_resources=settings.CSS_GROUPS["community-library"],
            request=request,
        )

        return render(request, "react.html", context)
