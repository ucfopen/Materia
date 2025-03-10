import json
import logging
from datetime import datetime

from django.http import JsonResponse, HttpResponseServerError, HttpResponseNotFound, HttpResponseForbidden, \
    HttpResponseBadRequest
from django.utils.timezone import make_aware

from core.models import PermObjectToUser, WidgetInstance, Widget
from util.message_util import MsgUtil, MsgType
from util.perm_manager import PermManager
from util.widget.validator import ValidatorUtil

logger = logging.getLogger("django")


class WidgetInstanceAPI:
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
            return MsgUtil.create_invalid_input_msg(msg=widget_id)

        widget = Widget.objects.filter(pk=widget_id).first()
        if not widget:
            return MsgUtil.create_invalid_input_msg("Invalid widget type")

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
        is_draft = json_data.get("isDraft")

        # Verify user session
        # TODO if (\Service_User::verify_session() !== true) return Msg::no_login();
        # TODO if (\Service_User::verify_session('no_author')) return Msg::invalid_input('You are not able to create or edit widgets.');

        # Get and validate widget
        if not ValidatorUtil.is_positive_integer_or_zero(widget_id):
            return MsgUtil.create_invalid_input_msg(msg=widget_id)
        widget_id = int(widget_id)

        widget = Widget.objects.filter(pk=widget_id).first()

        if not widget:
            return MsgUtil.create_invalid_input_msg("Invalid widget type")
        if not is_draft and not widget.publishable_by(-0):  # TODO Model_User::find_current_id()
            return MsgUtil.create_no_perm_msg("Widget type can not be published by students.")
        if is_draft and not widget.is_editable:
            return MsgUtil.create_failure_msg("Non-editable widgets can not be saved as drafts!")

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
        widget_instance.qset = qset

        # Save and return ID
        try:
            widget_instance.save()
            print("widget saved successfully")
            serialized_model = widget_instance.as_dict(serialize_fks=["widget", "qset"])
            return JsonResponse(serialized_model)
        except Exception as e:
            logger.error("Failed to save widget instance:")
            logger.error(e)
            return MsgUtil.create_failure_msg("Widget instance could not be saved")

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

        # Verify user is logged in
        # TODO
        # if (\Service_User::verify_session() !== true) return Msg::no_login();
        # if (\Service_User::verify_session('no_author')) return Msg::invalid_input('You are not able to create or edit widgets.');

        # Get and validate widget instance
        if not ValidatorUtil.is_valid_hash(widget_instance_id):
            return MsgUtil.create_invalid_input_msg("Instance ID is invalid")
        # TODO if ( ! static::has_perms_to_inst($inst_id, [Perm::FULL])) return Msg::no_perm();

        widget_instance = WidgetInstance.objects.filter(pk=widget_instance_id).first()
        if not widget_instance:
            return MsgUtil.create_failure_msg("Widget instance could not be found")
        if is_draft and not widget_instance.widget.is_editable:
            return MsgUtil.create_failure_msg("Non-editable widgets can not be saved as drafts!")
        if not is_draft and not widget_instance.widget.publishable_by(-0):  # TODO \Model_User::find_current_id()
            return MsgUtil.create_no_perm_msg("Widget type can not be published by students.")

        # Check if student-made, ensure guest access remains enabled
        if widget_instance.is_student_made:
            if not guest_access:
                return MsgUtil.create(
                    title="Student Made",
                    msg="Student-made widgets must stay in guest access mode.",
                    msg_type=MsgType.ERROR,
                    halt=False
                )
            attempts = -1
            guest_access = True

        # Update instance
        if "data" in qset and "version" in qset:
            pass
            widget_instance.qset = qset

        if name is not None and widget_instance.name != name:
            # TODO
            # $activity = new Session_Activity([
            # 					'user_id' => \Model_User::find_current_id(),
            # 					'type'    => Session_Activity::TYPE_EDIT_WIDGET_SETTINGS,
            # 					'item_id' => $inst_id,
            # 					'value_1' => 'Name',
            # 					'value_2' => $name
            # 				]);
            widget_instance.name = name

        if is_draft is not None and widget_instance.is_draft != is_draft:
            # this is another thing that expects a user to be logged in and performing this action somehow
            # TODO: figure out how to get relevant user data implemented here
            #     activity = LogActivity()
            #     activity.user = user.id
            #     activity.type = LogActivity.TYPE_EDIT_WIDGET_SETTINGS
            #     activity.item_id = instId
            #     activity.value_1 = 'Is Draft'
            #     activity.value_2 = is_draft
            #     activity.save()
            widget_instance.is_draft = is_draft

        if open_at is not None and widget_instance.open_at != open_at:
            # this is another thing that expects a user to be logged in and performing this action somehow
            # TODO: figure out how to get relevant user data implemented here
            #     activity = LogActivity()
            #     activity.user = user.id
            #     activity.type = LogActivity.TYPE_EDIT_WIDGET_SETTINGS
            #     activity.item_id = instId
            #     activity.value_1 = 'Open At'
            #     activity.value_2 = open_at
            #     activity.save()
            widget_instance.open_at = open_at

        if close_at is not None and widget_instance.close_at != close_at:
            # this is another thing that expects a user to be logged in and performing this action somehow
            # TODO: figure out how to get relevant user data implemented here
            #     activity = LogActivity()
            #     activity.user = user.id
            #     activity.type = LogActivity.TYPE_EDIT_WIDGET_SETTINGS
            #     activity.item_id = instId
            #     activity.value_1 = 'Close At'
            #     activity.value_2 = close_at
            #     activity.save()
            widget_instance.close_at = close_at

        if attempts is not None and widget_instance.attempts != attempts:
            # this is another thing that expects a user to be logged in and performing this action somehow
            # TODO: figure out how to get relevant user data implemented here
            #     activity = LogActivity()
            #     activity.user = user.id
            #     activity.type = LogActivity.TYPE_EDIT_WIDGET_SETTINGS
            #     activity.item_id = instId
            #     activity.value_1 = 'Attempts'
            #     activity.value_2 = attempts
            #     activity.save()
            widget_instance.attempts = attempts

        if guest_access is not None and widget_instance.guest_access != guest_access:
            # this is another thing that expects a user to be logged in and performing this action somehow
            # TODO: figure out how to get relevant user data implemented here

            # if the user is a student and they're not the owner, they can't do anything
            # if the user is a student and they're the owner, they're allowed to set it to guest access
            # if instance.user is user and guest_access or PermManger.user_is_student(user):
            #     activity = LogActivity()
            #     activity.user = user.id
            #     activity.type = LogActivity.TYPE_EDIT_WIDGET_SETTINGS
            #     activity.item_id = instId
            #     activity.value_1 = 'Is Draft'
            #     activity.value_2 = guest_access
            #     activity.save()
            widget_instance.guest_access = guest_access

            # when disabling guest mode on a widget instance, make sure no students have access to it
            if not guest_access:
                access = PermObjectToUser.objects.filter(
                    object_id=widget_instance_id, object_type=PermObjectToUser.ObjectType.INSTANCE
                )
                for a in access:
                    if (
                            PermManager.user_is_student(a.user)
                            and a.user is not widget_instance.user
                    ):
                        # TODO: implement notifications
                        # \Model_Notification::send_item_notification(
                        #     \Model_user::find_current_id(),
                        #     $user_id,
                        #     Perm::INSTANCE,
                        #     $instId,
                        #     'disabled',
                        #     null
                        # );
                        a.delete()

        if embedded_only is not None and widget_instance.embedded_only != embedded_only:
            # this is another thing that expects a user to be logged in and performing this action somehow
            # TODO: figure out how to get relevant user data implemented here
            #     activity = LogActivity()
            #     activity.user = user.id
            #     activity.type = LogActivity.TYPE_EDIT_WIDGET_SETTINGS
            #     activity.item_id = instId
            #     activity.value_1 = 'Embedded Only'
            #     activity.value_2 = embedded_only
            #     activity.save()
            widget_instance.embedded_only = embedded_only

        try:
            widget_instance.save()
            return JsonResponse(widget_instance.as_dict(serialize_fks=["widget", "qset"]))
        except Exception as e:
            logger.info("WHAT THE FUCK")
            logger.exception(e)
            return MsgUtil.create_failure_msg(msg="Widget instance could not be created")

    @staticmethod
    def widget_instance_lock(request):
        # TODO
        return JsonResponse({})
