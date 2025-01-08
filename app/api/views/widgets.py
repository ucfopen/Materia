import json
import logging
import os

from core.models import Widget
from django.core import serializers
from django.http import JsonResponse

logger = logging.getLogger("django")

def by_id(request):
    widget_ids = request.GET.get("widgets") or []
    all_widgets = Widget.objects.all().order_by("name")

    # Filter out widgets based on ID. Treat empty lists as 'all widgets'.
    if widget_ids:
        all_widgets.filter(id__in=widget_ids)

    return _hack_return(all_widgets)

def by_type(request):
    widget_type = request.GET.get("type") or "default"
    all_widgets = Widget.objects.all().order_by("name")

    # Filter out all widgets based on type
    # TODO look more into this
    if widget_type == "admin":
        pass
    elif widget_type in ["all", "playable"]:
        all_widgets = all_widgets.filter(is_playable=True)
    elif widget_type in ["featured", "catalog", "default"]:
        all_widgets = all_widgets.filter(in_catalog=True, is_playable=True)

    return _hack_return(all_widgets)

def _hack_return(raw_widgets: list) -> JsonResponse:
    hack_return = []
    # this is a bit hacky - probably need to define a method/serializer on this model
    # that cleanly produces the output we need instead of doing it here
    for widget_raw in raw_widgets:
        widget_dict = json.loads(serializers.serialize("json", [widget_raw]))[0]
        widget_dict["fields"][
            "dir"
        ] = f"{widget_raw.id}-{widget_raw.clean_name}{os.sep}"
        widget_dict["fields"]["id"] = widget_dict["pk"]
        widget_dict["fields"]["meta_data"] = widget_raw.metadata_clean()
        # remove this stupid hack when the frontend is willing to accept true as true instead of '1' as true
        for field in widget_dict["fields"]:
            if field[:3] in ["is_", "in_"]:
                if widget_dict["fields"][field] is True:
                    widget_dict["fields"][field] = "1"
                if widget_dict["fields"][field] is False:
                    widget_dict["fields"][field] = "0"

        hack_return.append(widget_dict["fields"])

    return JsonResponse(hack_return, safe=False)
