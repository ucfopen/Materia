import logging
from datetime import datetime

from django.conf import settings
from django.contrib.auth.models import User
from django.core.cache import cache
from django.http import HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden, HttpResponseServerError, \
    JsonResponse
from django.utils.timezone import make_aware

from core.models import WidgetInstance, Widget, PermObjectToUser
from util.message_util import MsgBuilder, MsgSeverity, Msg
from util.perm_manager import PermManager
from util.widget.validator import ValidatorUtil

logger = logging.getLogger("django")


class WidgetInstanceUtil:
    @staticmethod
    def save_new(
            widget: Widget, name: str = None, qset=None, is_draft: bool = None, student_made: bool = False
    ) -> WidgetInstance | Msg:

        # Create the widget instance
        widget_instance = WidgetInstance(
            user=None,  # TODO Model_User::find_current_id(),
            name=name,
            is_draft=is_draft,
            created_at=make_aware(datetime.now()),
            widget=widget,
            is_student_made=student_made,
            guest_access=True,  # TODO IMPORTANT should be is_student, always true just for easy development rn
            attempts=-1,
        )

        # Load instance with qset
        widget_instance.qset = qset

        # Save and return ID
        try:
            widget_instance.save()
            return widget_instance
        except Exception as e:
            logger.error("Failed to save widget instance:")
            logger.error(e)
            return MsgBuilder.failure(msg="Widget instance could not be saved")

    @staticmethod
    def update(
        widget_instance: WidgetInstance,
        name: str = None,
        qset=None,
        is_draft: bool = None,
        open_at: datetime = None,
        close_at: datetime = None,
        attempts: int = None,
        guest_access: bool = None,
        embedded_only: bool = None,
    ) -> WidgetInstance | Msg:
        # Verify user is logged in
        # TODO
        # if (\Service_User::verify_session() !== true) return Msg::no_login();
        # if (\Service_User::verify_session('no_author')) return Msg::invalid_input('You are not able to create or edit widgets.');

        # Update instance
        if qset is not None and "data" in qset and "version" in qset:
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
                    object_id=widget_instance.id, object_type=PermObjectToUser.ObjectType.INSTANCE
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
            return widget_instance
        except Exception as e:
            logger.info("WHAT THE FUCK")
            logger.exception(e)
            return MsgBuilder.failure(msg="Widget instance could not be updated.")

    # Obtains a lock on a widget instance that will last for 2 minutes.
    # Returns True if that lock is obtained by the user (or if they already have a lock on it)
    # Returns False if another lock is already owned by someone else
    # Can pass in either a WidgetInstance object or the id of that instance
    @staticmethod
    def get_lock(instance: WidgetInstance | str, user: User) -> bool:
        # Get instance id depending on what was passed in
        if type(instance) is WidgetInstance:
            instance_id = instance.id
        else:
            instance_id = instance

        # Get current lock, if any
        locked_by = cache.get(instance_id)

        # Not currently locked by anyone else, obtain a lock
        if locked_by is None:
            locked_by = user.pk
            cache.set(instance_id, locked_by, settings.LOCK_TIMEOUT)

        # Return True if requesting user owns the lock. False otherwise.
        return locked_by == user.pk

    # Checks if the user has a lock on this instance (if there is one)
    # Returns True if the user owns the lock, or if there is no lock on this instance
    # Returns False if there is a lock and the user doesn't own it
    # Can pass in either a WidgetInstance object or the id of that instance
    @staticmethod
    def user_has_lock_or_is_unlocked(instance: WidgetInstance | str, user: User) -> bool:
        # Get instance id depending on what was passed in
        if type(instance) is WidgetInstance:
            instance_id = instance.id
        else:
            instance_id = instance

        # Get current lock. Return True if no lock exists for this instance.
        locked_by = cache.get(instance_id)
        if locked_by is None:
            return True

        # Return True if requesting user owns the lock. False otherwise.
        return locked_by == user.pk

