import json
import logging

from core.models import Widget
from django.http import JsonResponse

from util.widget.widget_util import WidgetUtil

logger = logging.getLogger("django")


class WidgetsApi:
    # WAS widgets_get
    @staticmethod
    def get(request):
        widget_ids = json.loads(request.body).get("widgetIds") or []
        all_widgets = Widget.objects.all().order_by("name")

        # Filter out widgets based on ID. Treat empty lists as 'all widgets'.
        if widget_ids:
            all_widgets = all_widgets.filter(id__in=widget_ids)

        return JsonResponse(WidgetUtil.hack_return(all_widgets), safe=False)

    # WAS widgets_get_by_type
    @staticmethod
    def get_by_type(request):
        widget_type = json.loads(request.body).get("widgetType") or "default"
        all_widgets = Widget.objects.all().order_by("name")

        # Filter out all widgets based on type
        # TODO look more into this
        if widget_type == "admin":
            pass
        elif widget_type in ["all", "playable"]:
            all_widgets = all_widgets.filter(is_playable=True)
        elif widget_type in ["featured", "catalog", "default"]:
            all_widgets = all_widgets.filter(in_catalog=True, is_playable=True)

        return JsonResponse(WidgetUtil.hack_return(all_widgets), safe=False)
