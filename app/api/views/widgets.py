import base64
import json
import logging
import os

from django.db.models import QuerySet

from core.models import Widget, WidgetInstance
from django.core import serializers
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden

logger = logging.getLogger("django")

def widgets_get(request):
    widget_ids = json.loads(request.body).get("widgetIds") or []
    all_widgets = Widget.objects.all().order_by("name")

    # Filter out widgets based on ID. Treat empty lists as 'all widgets'.
    if widget_ids:
        all_widgets = all_widgets.filter(id__in=widget_ids)

    return JsonResponse(_hack_return(all_widgets), safe=False)


def widgets_get_by_type(request):
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

    return JsonResponse(_hack_return(all_widgets), safe=False)


def widget_instances_get(request):
    json_data = json.loads(request.body)
    instance_ids = json_data.get("instanceIds", [])
    get_deleted = json_data.get("getDeleted", False)

    # Treat empty id list as 'all my widgets' - must be logged in
    if not instance_ids:
        # TODO
        pass

    # Get specific set of widget instances
    instances = (WidgetInstance.objects
                 .filter(pk__in=instance_ids)
                 .filter(is_deleted=get_deleted)
                 .order_by("-created_at", "-id"))
    # TODO: ^ make this functionality into its own 'manager' class like the php code?

    instances = instances[:80] # TODO: add way to control limit?

    raw_json_instances = json.loads(serializers.serialize("json", instances))
    json_instances = []
    for raw_json_instance in raw_json_instances:
        fields = raw_json_instance["fields"]
        _convert_booleans(fields)
        fields["widget"] = _hack_return(Widget.objects.filter(pk=fields["widget"]))[0]
        fields["id"] = raw_json_instance["pk"]
        json_instances.append(fields)
        # TODO fix serialization

    return JsonResponse({"instances": json_instances})


def question_set_get(request):
    json_data = json.loads(request.body)
    instance_id = json_data.get("instanceId")
    play_id = json_data.get("playId")
    timestamp = json_data.get("timestamp")
    if not instance_id:
        return HttpResponseBadRequest()

    # Grab widget instance, verify it exists
    instance = WidgetInstance.objects.get(pk=instance_id)
    if not instance:
        return HttpResponseNotFound()
    if not instance.playable_by_current_user():
        return HttpResponseForbidden() # TODO: return message instead, see php

    # TODO check play_id, see php

    # TODO check preview mode, see php

    return JsonResponse({"qset": instance.qset.as_json()})


def _hack_return(raw_widgets: QuerySet) -> list:
    hack_return = []
    # this is a bit hacky - probably need to define a method/serializer on this model
    # that cleanly produces the output we need instead of doing it here
    for widget_raw in raw_widgets:
        widget_dict = json.loads(serializers.serialize("json", [widget_raw]))[0]
        widget_dict["fields"]["dir"] = f"{widget_raw.id}-{widget_raw.clean_name}{os.sep}"
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

    return hack_return

def _convert_booleans(fields: dict):
    for field in fields:
        if field[:3] in ["is_", "in_"]:
            if fields[field] is True:
                fields[field] = "1"
            if fields[field] is False:
                fields[field] = "0"
