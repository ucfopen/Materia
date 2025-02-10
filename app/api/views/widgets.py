import json
import logging
from datetime import timezone, datetime
from venv import create

from django.utils.timezone import make_aware

from core.models import Widget, WidgetInstance
from django.core import serializers
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden

from util.logging.session_play import SessionPlay
from util.widget.validator import ValidatorUtil
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

    @staticmethod  # TODO maybe move this into it's own perms class/file?
    def widget_publish_perms_verify(request):
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

    @staticmethod
    def widget_instance_save(request):
        # Get, parse, validate body
        json_data = json.loads(request.body)
        widget_id = json_data.get("widgetId")
        name = json_data.get("name")
        qset = json_data.get("qset")
        is_draft = json_data.get("isDraft")

        # Verify user session
        # TODO if (\Service_User::verify_session() !== true) return Msg::no_login();
        # TODO if (\Service_User::verify_session('no_author')) return Msg::invalid_input('You are not able to create or edit widgets.');

        # Get and validate widget
        if not ValidatorUtil.is_positive_integer_or_zero(widget_id):
            return HttpResponseBadRequest()  # TODO was Msg::invalid_input($widget_id);
        widget_id = int(widget_id)

        widget = Widget.objects.filter(pk=widget_id).first()

        if not widget:
            print(f"not widget {widget_id}")
            return HttpResponseNotFound()  # TODO was Msg::invalid_input('Invalid widget type');
        if not is_draft and not widget.publishable_by(-0):  # TODO Model_User::find_current_id()
            return HttpResponseForbidden()  # TODO was Msg::no_perm('Widget type can not be published by students.');
        if is_draft and not widget.is_editable:
            return HttpResponseForbidden()  # TODO was Msg::failure('Non-editable widgets can not be saved as drafts!');

        is_student = False  # TODO was \Service_User::verify_session(['basic_author', 'super_user']);

        # Create the widget instance
        widget_instance = WidgetInstance(
            user=None,  # TODO Model_User::find_current_id(),
            name=name,
            is_draft=is_draft,
            created_at=make_aware(datetime.now()),
            widget=widget,
            is_student_made=is_student,
            guest_access=True,  # TODO IMPORTANT should be is_student, always true just for easy development rn
            attempts=-1,
        )

        # Load instance with qset
        instance_qset = widget_instance.qset  # TODO: I have to run this once and store its result as a variable, then modify that variable - this current property function will return 2 different WidgetQsets if I call them separately below. Might be worth to find out a better solution
        if "data" in qset:
            instance_qset.data = qset["data"]
        if "version" in qset:
            instance_qset.version = qset["version"]

        # Save and return ID
        try:
            widget_instance.save()
            instance_qset.db_store()  # TODO convert to save, see if the above .save() is supposed to auto save this one anyway?
            serialized_model = widget_instance.as_dict(serialize_fks=["widget", "qset"])
            return JsonResponse(serialized_model)
        except Exception as e:
            logger.error(e)
            return HttpResponseBadRequest()
            # TODO was Msg::failure('Widget instance could not be saved.');
