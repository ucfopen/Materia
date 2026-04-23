from core.utils.context_util import ContextUtil
from django.conf import settings
from django.shortcuts import render
from django.views.generic import TemplateView
from core.models import (
    CommunityLibraryEntry
)

from django.http import Http404, HttpRequest


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

class CommunityLibraryDetailView(TemplateView):
    template_name = "react.html"

    def get_context_data(self, entry_id):
        entry = CommunityLibraryEntry.objects.filter(pk=entry_id).first()
        if entry is None:
            raise Http404

        return ContextUtil.create(
            title="Community Library",
            js_resources=settings.JS_GROUPS["cl-detail"],
            css_resources=settings.CSS_GROUPS["cl-detail"],
            js_globals={
                # "NO_AUTHOR": PermService.does_user_have_roles(
                #     self.request.user, "no_author"
                # ),
                # "WIDGET_HEIGHT": widget.height,
                # "MEDIA_URL": settings.URLS["MEDIA_URL"],
            },
            page_type="widget",
            request=self.request,
        )

    pass
