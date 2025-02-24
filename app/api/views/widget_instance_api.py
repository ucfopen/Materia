import json
import logging
from datetime import datetime

from django.http import JsonResponse, HttpResponseServerError, HttpResponseNotFound, HttpResponseForbidden, \
    HttpResponseBadRequest
from django.utils.timezone import make_aware

from core.models import PermObjectToUser, WidgetInstance, Widget
from util.logging.session_play import SessionPlay
from util.perm_manager import PermManager
from util.widget.instance.instance_util import WidgetInstanceUtil
from util.widget.validator import ValidatorUtil

logger = logging.getLogger("django")


class WidgetInstanceAPI:
    # WAS widget_instances_get
    @staticmethod
    def get(request):
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

        instances = instances[:80]  # TODO: add way to control limit?

        json_instances = []
        for raw_instance in instances:
            json_instances.append(raw_instance.as_dict(serialize_fks=["widget"]))

        return JsonResponse({"instances": json_instances})

    # WAS widget_publish_perms_verify
    @staticmethod
    def publish_perms_verify(request):
        # Get, parse, validate body
        json_data = json.loads(request.body)
        widget_id = json_data.get("widgetId")
        if not widget_id:
            return HttpResponseNotFound()

        # Verify user session
        # TODO if (\Service_User::verify_session() !== true) return Msg::no_login();

        # Get and validate widget
        if not ValidatorUtil.is_positive_integer_or_zero(widget_id):
            return HttpResponseBadRequest()  # TODO was return Msg::invalid_input($widget_id);

        widget = Widget.objects.filter(pk=widget_id).first()
        if not widget:
            return HttpResponseNotFound()  # TODO was Msg::invalid_input('Invalid widget type');

        return JsonResponse({
            "publishPermsValid": widget.publishable_by(-0)  # TODO
        })

    # WAS widget_instance_save
    @staticmethod
    def save(request):
        # Get, parse, validate body
        json_data = json.loads(request.body)
        widget_id = json_data.get("widgetId")
        name = json_data.get("name")
        qset = json_data.get("qset")
        is_draft = json_data.get("isDraft", True)

        widget_instance = WidgetInstanceUtil.save(widget_id, name, qset, is_draft)

        # Save and return ID
        serialized_model = widget_instance.as_dict(serialize_fks=["widget", "qset"])
        return JsonResponse(serialized_model)

    # WAS widget_instance_update
    @staticmethod
    def update(request):
        # Get, parse, validate body
        json_data = json.loads(request.body)
        widget_instance_id = json_data.get("instId")
        name = json_data.get("name")
        qset = json_data.get("qset")
        is_draft = json_data.get("isDraft")
        open_at = json_data.get("openAt")
        close_at = json_data.get("closeAt")
        attempts = json_data.get("attempts")
        guest_access = json_data.get("guestAccess")
        embedded_only = json_data.get("embeddedOnly")
        is_student_made = json_data.get("isStudentMade")

        widget_instance = WidgetInstanceUtil.update(
            widget_instance_id,
            name,
            qset,
            is_draft,
            open_at,
            close_at,
            attempts,
            guest_access,
            embedded_only,
            is_student_made,
        )

        return JsonResponse(widget_instance.as_dict(serialize_fks=["widget", "qset"]))

    # WAS question_set_get
    @staticmethod
    def get_qset(request):
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

    @staticmethod
    def lock(request):
        # TODO
        return JsonResponse({})
