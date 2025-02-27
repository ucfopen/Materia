import json
import logging

from django.http import JsonResponse, HttpResponseNotFound

from core.models import WidgetInstance, Widget
from util.message_util import MsgBuilder
from util.logging.session_play import SessionPlay
from util.serialization import SerializationUtil
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
            return MsgBuilder.invalid_input(msg=widget_id).as_json_response()

        widget = Widget.objects.filter(pk=widget_id).first()
        if not widget:
            return MsgBuilder.invalid_input(msg="Invalid widget type").as_json_response()

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

        # Verify user session
        # TODO if (\Service_User::verify_session() !== true) return Msg::no_login();
        # TODO if (\Service_User::verify_session('no_author')) return Msg::invalid_input('You are not able to create or edit widgets.');

        # Get and validate widget
        if not ValidatorUtil.is_positive_integer_or_zero(widget_id):
            return MsgBuilder.invalid_input(msg=widget_id).as_json_response()
        widget_id = int(widget_id)

        widget = Widget.objects.filter(pk=widget_id).first()

        if not widget:
            return MsgBuilder.invalid_input(msg="Invalid widget type").as_json_response()
        if not is_draft and not widget.publishable_by(-0):  # TODO Model_User::find_current_id()
            return MsgBuilder.no_perm(msg="Widget type can not be published by students.").as_json_response()
        if is_draft and not widget.is_editable:
            return MsgBuilder.failure(msg="Non-editable widgets can not be saved as drafts!").as_json_response()

        widget_instance, msg = WidgetInstanceUtil.save(widget_id, name, qset, is_draft)
        if msg is not None:
            return msg.as_json_response()

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

        widget_instance, msg = WidgetInstanceUtil.update(
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

        if msg is not None:
            return msg.as_json_response()

        return JsonResponse(widget_instance.as_dict(serialize_fks=["widget", "qset"]))

    # WAS question_set_get
    @staticmethod
    def get_qset(request):
        json_data = json.loads(request.body)
        instance_id = json_data.get("instanceId")
        play_id = json_data.get("playId")  # Empty if in preview mode
        timestamp = json_data.get("timestamp")
        if not instance_id:
            return MsgBuilder.invalid_input(msg="Missing instance ID").as_json_response()

        # Grab widget instance, verify it exists
        instance = WidgetInstance.objects.get(pk=instance_id)
        if not instance:
            return HttpResponseNotFound()
        if not instance.playable_by_current_user():
            return MsgBuilder.no_login().as_json_response()

        # Validate play ID
        if play_id and not timestamp and not SessionPlay.validate_by_play_id(play_id):
            return MsgBuilder.no_login().as_json_response()

        # TODO check preview mode, see php

        return JsonResponse({"qset": instance.qset.as_dict()})

    @staticmethod
    def history(request):
        instance_id = request.GET.get("inst_id")

        if instance_id is None:
            return MsgBuilder.invalid_input(msg="Missing instance ID").as_json_response()
        if not ValidatorUtil.is_valid_hash(instance_id):
            return MsgBuilder.invalid_input(msg=f"Invalid instance ID '{instance_id}'").as_json_response()

        instance = WidgetInstance.objects.filter(pk=instance_id).first()
        if not instance:
            return MsgBuilder.not_found(msg="Instance not found").as_json_response()

        # TODO if (! \Materia\Perm_Manager::user_has_any_perm_to(\Model_User::find_current_id(), $inst_id,  \Materia\Perm::INSTANCE, [\Materia\Perm::FULL])) return $this->response(\Materia\Msg::no_perm(), 401);

        return JsonResponse({
            "history": SerializationUtil.serialize_set(instance.get_qset_history())
        })

    @staticmethod
    def lock(request):
        # TODO
        return JsonResponse({})
