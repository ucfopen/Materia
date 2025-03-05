import json
import logging

from core.models import Widget, WidgetInstance
from django.core import serializers
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden

from util.widget.widget_util import WidgetUtil

from rest_framework import permissions, viewsets
from core.serializers import WidgetSerializer

logger = logging.getLogger("django")

class WidgetViewSet(viewsets.ModelViewSet):
    serializer_class = WidgetSerializer
    permission_classes = [permissions.AllowAny]

    queryset = Widget.objects.all()

    def get_queryset(self):
        widgets = Widget.objects.all().order_by("name")
        if self.request.query_params.get("ids",""):
            return widgets.filter(id__in=self.request.query_params.get("ids","").split(","))
        else:
            return widgets
        
## API stuff below this line is not yet fully converted to DRF ##

class WidgetsApi:

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
        play_id = json_data.get("playId")
        timestamp = json_data.get("timestamp")
        if not instance_id:
            return HttpResponseBadRequest()

        # Grab widget instance, verify it exists
        instance = WidgetInstance.objects.get(pk=instance_id)
        if not instance:
            return HttpResponseNotFound()
        if not instance.playable_by_current_user():
            return HttpResponseForbidden()  # TODO: return message instead, see php

        # TODO check play_id, see php

        # TODO check preview mode, see php

        return JsonResponse({"qset": instance.qset.as_json()})
