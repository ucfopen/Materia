import json
import logging

from core.models import Widget, WidgetInstance
from django.core import serializers
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden

from util.logging.session_play import SessionPlay
from util.widget.widget_util import WidgetUtil

logger = logging.getLogger("django")


class WidgetsApi:
    @staticmethod
    def widgets_get(request):
        widget_ids = json.loads(request.body).get("widgetIds") or []
        all_widgets = Widget.objects.all().order_by("name")

        # Filter out widgets based on ID. Treat empty lists as 'all widgets'.
        if widget_ids:
            all_widgets = all_widgets.filter(id__in=widget_ids)

        return JsonResponse(WidgetUtil.hack_return(all_widgets), safe=False)

    @staticmethod
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

        return JsonResponse(WidgetUtil.hack_return(all_widgets), safe=False)

    @staticmethod
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

        instances = instances[:80]  # TODO: add way to control limit?

        raw_json_instances = json.loads(serializers.serialize("json", instances))
        json_instances = []
        for raw_json_instance in raw_json_instances:
            fields = raw_json_instance["fields"]
            WidgetUtil.convert_booleans(fields)
            fields["widget"] = WidgetUtil.hack_return(Widget.objects.filter(pk=fields["widget"]))[0]
            fields["id"] = raw_json_instance["pk"]
            json_instances.append(fields)
            # TODO fix serialization

        return JsonResponse({"instances": json_instances})

    @staticmethod
    def question_set_get(request):
        json_data = json.loads(request.body)
        instance_id = json_data.get("instanceId")
        play_id = json_data.get("playId")  # Empty if in preview mode
        timestamp = json_data.get("timestamp")
        if not instance_id:
            return HttpResponseBadRequest()

        # Grab widget instance, verify it exists
        instance = WidgetInstance.objects.get(pk=instance_id)
        if not instance:
            return HttpResponseNotFound()
        if not instance.playable_by_current_user():
            return HttpResponseForbidden()  # TODO: return message instead, see php

        # Validate play ID
        if play_id and not timestamp and not SessionPlay.validate_by_play_id(play_id):
            return HttpResponseForbidden()  # TODO was Msg::no_login();

        # TODO check preview mode, see php

        return JsonResponse({"qset": instance.qset.as_dict()})
