import json

from django.conf import settings
from django.contrib.auth.decorators import login_required, permission_required
from django.core import serializers
from django.http import JsonResponse, HttpResponseServerError
from django.utils.timezone import make_aware

from core.models import LogActivity, PermObjectToUser, Widget, WidgetInstance, WidgetQset
from util.widget.validator import ValidatorUtil
from util.perm_manager import PermManager

from datetime import datetime

import logging
logger = logging.getLogger('django')

class WidgetInstancesApi:
    def new(widget_id=None, name=None, qset=None, is_draft=None):
        # ordinarily there would be several checks here requiring an active login and making sure the current user can edit the relevant widget instance
        # since this can potentially be called by a command line process, we can't do that - because there is no user
        # if (\Service_User::verify_session() !== true) return Msg::no_login();
        # if (\Service_User::verify_session('no_author')) return Msg::invalid_input('You are not able to create or edit widgets.');

        #TODO: move the part of this code that actually does stuff somewhere else and call that new function from here
        if not ValidatorUtil.is_positive_integer_or_zero(widget_id):
            # originally this called Msg::invalid_input
            return HttpResponseServerError("Invalid widget engine ID provided")
        if type(is_draft) is not bool:
            is_draft = True

        widget = None
        try:
            widget = Widget.objects.get(id=widget_id)
        except Widget.DoesNotExist:
            # originally this called Msg::invalid_input
            return HttpResponseServerError("Invalid widget engine ID provided")

        #TODO: implement this when we can get user data in here somehow
        # if not is_draft and not widget.publishable_by(user):
        #     # originally this called Msg
        #     return HttpResponseServerError('Widget type can not be published by the current user')

        if is_draft and not widget.is_editable:
            # originally this called Msg
            return HttpResponseServerError('Non-editable widgets can not be saved as drafts!')
        #TODO: implement when users are a thing etc.
        # is_student = PermManager.user_is_student(user)
        is_student = False

        instance = WidgetInstance()
        # instance.user = user
        instance.name = name
        instance.is_draft = is_draft
        instance.created_at = make_aware(datetime.now())
        instance.widget = widget
        instance.is_student_made = is_student
        instance.guest_access = is_student

        try:
            instance.db_store()

            if qset.data and qset.version:
                try:
                    qset.instance = instance
                    qset.db_store()
                except Exception as e:
                    logger.info('New instance qset could not be saved!')
                    raise e

            return instance
        except Exception as e:
            logger.info('PROBLEM IS HERE')
            logger.exception('')
            # originally this called Msg
            return HttpResponseServerError('Widget instance could not be saved')

    def update(inst_id=None, name=None, qset=None, is_draft=None, open_at=None, close_at=None, attempts=None, guest_access=None, embedded_only=None, is_student_made=None):
        # ordinarily there would be several checks here requiring an active login and making sure the current user can edit the relevant widget instance
        # since this can potentially be called by a command line process, we can't do that - because there is no user
        # if (\Service_User::verify_session() !== true) return Msg::no_login();
        # if (\Service_User::verify_session('no_author')) return Msg::invalid_input('You are not able to create or edit widgets.');
        # if ( ! static::has_perms_to_inst($inst_id, [Perm::FULL])) return Msg::no_perm();

        #TODO: move the part of this code that actually does stuff somewhere else and call that new function from here
        if not ValidatorUtil.is_valid_hash(inst_id):
            # originally this was calling Msg::invalid_input
            return HttpResponseServerError('Instance ID is invalid')
        try:
            instance = WidgetInstance.objects.get(id=inst_id)
            widget = instance.widget
        except WidgetInstance.DoesNotExist:
            # originally this was calling Msg::failure
            return HttpResponseServerError('Widget instance could not be found.')

        if is_draft and not widget.is_editable:
            # originally this was calling Msg::failure
            return HttpResponseServerError('Non-editable widgets can not be saved as drafts!')
        #TODO: rewrite this when we have a way of implementing users, see above
        # if not is_draft and not widget.publishable_by(current_user):
        #     # originally this was calling Msg::no_perm
        #     return HttpResponseServerError('Widget type can not be published by students.')

        # student-made widgets are locked forever
        if instance.is_student_made:
            if guest_access is False:
                # return new Msg('Student-made widgets must stay in guest access mode.', 'Student Made', 'error', false);
                return HttpResponseServerError('Student-made widgets must stay in guest access mode.')
            attempts = -1
            guest_access = True

        if bool(name):
            # this is another thing that expects a user to be logged in and performing this action somehow
            # TODO: figure out how to get relevant user data implemented here
            # if instance.name != name:
            #     activity = LogActivity()
            #     activity.user = user.id
            #     activity.type = LogActivity.TYPE_EDIT_WIDGET_SETTINGS
            #     activity.item_id = inst_id
            #     activity.value_1 = 'Name'
            #     activity.value_2 = name
            #     activity.save()
            instance.name = name

        if is_draft != None:
            # this is another thing that expects a user to be logged in and performing this action somehow
            # TODO: figure out how to get relevant user data implemented here
            # if instance.is_draft != is_draft:
            #     activity = LogActivity()
            #     activity.user = user.id
            #     activity.type = LogActivity.TYPE_EDIT_WIDGET_SETTINGS
            #     activity.item_id = inst_id
            #     activity.value_1 = 'Is Draft'
            #     activity.value_2 = is_draft
            #     activity.save()
            instance.is_draft = is_draft

        if open_at != None:
            # this is another thing that expects a user to be logged in and performing this action somehow
            # TODO: figure out how to get relevant user data implemented here
            # if instance.open_at != open_at:
            #     activity = LogActivity()
            #     activity.user = user.id
            #     activity.type = LogActivity.TYPE_EDIT_WIDGET_SETTINGS
            #     activity.item_id = inst_id
            #     activity.value_1 = 'Open At'
            #     activity.value_2 = open_at
            #     activity.save()
            instance.open_at = open_at

        if close_at != None:
            # this is another thing that expects a user to be logged in and performing this action somehow
            # TODO: figure out how to get relevant user data implemented here
            # if instance.close_at != close_at:
            #     activity = LogActivity()
            #     activity.user = user.id
            #     activity.type = LogActivity.TYPE_EDIT_WIDGET_SETTINGS
            #     activity.item_id = inst_id
            #     activity.value_1 = 'Close At'
            #     activity.value_2 = close_at
            #     activity.save()
            instance.close_at = close_at

        if attempts != None:
            # this is another thing that expects a user to be logged in and performing this action somehow
            # TODO: figure out how to get relevant user data implemented here
            # if instance.attempts != attempts:
            #     activity = LogActivity()
            #     activity.user = user.id
            #     activity.type = LogActivity.TYPE_EDIT_WIDGET_SETTINGS
            #     activity.item_id = inst_id
            #     activity.value_1 = 'Attempts'
            #     activity.value_2 = attempts
            #     activity.save()
            instance.attempts = attempts

        if guest_access != None:
            # this is another thing that expects a user to be logged in and performing this action somehow
            # TODO: figure out how to get relevant user data implemented here

            # if the user is a student and they're not the owner, they can't do anything
            # if the user is a student and they're the owner, they're allowed to set it to guest access
            # if instance.user is user and guest_access or PermManger.user_is_student(user):
                # if instance.guest_access != guest_access:
                #     activity = LogActivity()
                #     activity.user = user.id
                #     activity.type = LogActivity.TYPE_EDIT_WIDGET_SETTINGS
                #     activity.item_id = inst_id
                #     activity.value_1 = 'Is Draft'
                #     activity.value_2 = guest_access
                #     activity.save()
            instance.guest_access = guest_access
            # when disabling guest mode on a widget instance, make sure no students have access to it
            if not guest_access:
                access = PermObjectToUser.objects.filter(object_id=inst_id, object_type=PermObjectToUser.ObjectType.INSTANCE)
                for a in access:
                    if PermManager.user_is_student(a.user) and a.user is not instance.user:
                        #TODO: implement notifications
                        # \Model_Notification::send_item_notification(\Model_user::find_current_id(), $user_id, Perm::INSTANCE, $inst_id, 'disabled', null);
                        a.delete()

        if embedded_only != None:
            # this is another thing that expects a user to be logged in and performing this action somehow
            # TODO: figure out how to get relevant user data implemented here
            # if instance.embedded_only != embedded_only:
            #     activity = LogActivity()
            #     activity.user = user.id
            #     activity.type = LogActivity.TYPE_EDIT_WIDGET_SETTINGS
            #     activity.item_id = inst_id
            #     activity.value_1 = 'Embedded Only'
            #     activity.value_2 = embedded_only
            #     activity.save()
            instance.embedded_only = embedded_only

        try:
            instance.save()
            return instance
        except Exception as e:
            logger.info('WHAT THE FUCK')
            logger.exception(e)
            # originally this was calling Msg::failure
            return HttpResponseServerError('Widget instance could not be created.')
