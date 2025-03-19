import json
import logging

from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import Widget, WidgetInstance
from django.core import serializers
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden

from util.logging.session_play import SessionPlay
from util.message_util import MsgUtil
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
        if self.request.query_params.get("ids", ""):
            return widgets.filter(id__in=self.request.query_params.get("ids","").split(","))
        else:
            return widgets

    @action(detail=True, methods=["get"])
    def publish_perms_verify(self, request, pk):
        widget = self.get_object()
        return Response({
            "publishPermsValid": widget.publishable_by(request.user)
        })


## API stuff below this line is not yet fully converted to DRF ##

    @staticmethod
    def question_set_get(request):
        json_data = json.loads(request.body)
        instance_id = json_data.get("instanceId")
        play_id = json_data.get("playId")  # Empty if in preview mode
        timestamp = json_data.get("timestamp")
        if not instance_id:
            return MsgUtil.create_invalid_input_msg(msg="Missing instance ID")

        # Grab widget instance, verify it exists
        instance = WidgetInstance.objects.get(pk=instance_id)
        if not instance:
            return HttpResponseNotFound()
        if not instance.playable_by_current_user(request.user):
            return MsgUtil.create_no_login_msg()

        # Validate play ID
        if play_id and not timestamp and not SessionPlay.validate_by_play_id(play_id, request):
            return MsgUtil.create_no_login_msg()

        # TODO check preview mode, see php

        return JsonResponse({"qset": instance.qset.as_dict()})
