import logging
from datetime import datetime

from core.models import PermObjectToUser, WidgetQset, Widget, WidgetInstance
from core.serializers import WidgetInstanceSerializer, QuestionSetSerializer
from django.http import HttpResponseServerError
from django.utils.timezone import make_aware

from rest_framework import permissions, viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from rest_framework.decorators import action

from util.message_util import MsgUtil
from util.perm_manager import PermManager
from util.widget.validator import ValidatorUtil

logger = logging.getLogger("django")


class WidgetInstanceViewSet(viewsets.ModelViewSet):
    serializer_class = WidgetInstanceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # If user param is specified, return that user's instances. Otherwise, return all.
        user_query = self.request.query_params.get('user')
        if user_query:
            return WidgetInstance.objects.filter(user=user_query)
        else:
            return WidgetInstance.objects.all()

    def get_permissions(self):
        user_query = self.request.query_params.get('user')
        # Require superuser to use list without a user param
        if user_query is None and self.action == 'list':
            permission_classes = [permissions.IsAdminUser]
        # Otherwise, all users can read details and make modifications if they are authenticated
        else:
            permission_classes = [permissions.IsAuthenticatedOrReadOnly]

        return [permission() for permission in permission_classes]

    # /api/instances/<inst id>/question_sets/
    # ?latest=true GET param for only the latest qset
    @action(detail=True, methods=["get"])
    def question_sets(self, request, pk=None):
        instance = self.get_object()

        get_latest = request.query_params.get("latest", "false")
        if get_latest is "true":
            qset = instance.qset
            serializer = QuestionSetSerializer(qset)
            return Response(serializer.data)
        else:
            qsets = instance.qsets.all()
            serializer = QuestionSetSerializer(qsets, many=True)
            return Response(serializer.data)
    
    # /api/instances/<inst id>/question_sets/<qset id>
    @action(detail=True, methods=["get"], url_path='question_sets/(?P<qset_id>[^/.]+)')
    def question_set(self, request, pk=None, qset_id=None):
        instance = self.get_object()
        try:
            qset = instance.qsets.get(id=qset_id)
            serializer = QuestionSetSerializer(qset)
            return Response(serializer.data)
        except WidgetQset.DoesNotExist:
            raise NotFound(detail="Qset not found.")


## API stuff below this line is not yet converted to DRF ##
# TODO this file is temporary just to make the installer work. django-creator-2 has a solution in it
#      that unifies both this and widget_instance_api.py. this filed will be removed with django-creator-2.

class WidgetInstancesApi:
    @staticmethod
    def new(widget_id=None, name=None, qset=None, is_draft=None):
        # ordinarily there would be several checks here requiring an active login
        #  and making sure the current user can edit the relevant widget instance
        # since this can potentially be called by a command line process, we can't do that - because there is no user

        # if (\Service_User::verify_session() !== true) return Msg::no_login();
        # if (\Service_User::verify_session('no_author')) {
        #     return Msg::invalid_input('You are not able to create or edit widgets.');
        # }

        # TODO: move the part of this code that actually does stuff somewhere else and call that new function from here
        if not ValidatorUtil.is_positive_integer_or_zero(widget_id):
            return MsgUtil.create_invalid_input_msg(msg="Invalid widget engine ID provided")
        if type(is_draft) is not bool:
            is_draft = True

        widget = None
        try:
            widget = Widget.objects.get(id=widget_id)
        except Widget.DoesNotExist:
            return MsgUtil.create_invalid_input_msg(msg="Invalid widget engine ID provided")

        # TODO: implement this when we can get user data in here somehow
        # if not is_draft and not widget.publishable_by(user):
        #     # originally this called Msg
        #     return HttpResponseServerError('Widget type can not be published by the current user')

        if is_draft and not widget.is_editable:
            return MsgUtil.create_failure_msg(msg="Non-editable widgets can not be saved as drafts!")
        # TODO: implement when users are a thing etc.
        # is_student = PermManager.user_is_student(user)
        is_student = False

        instance = WidgetInstance()
        # instance.user = user
        qset.instance = instance
        instance.qset = qset
        instance.name = name
        instance.is_draft = is_draft
        instance.created_at = make_aware(datetime.now())
        instance.widget = widget
        instance.is_student_made = is_student
        instance.guest_access = is_student

        try:
            instance.save()
            return instance
        except Exception:
            # originally this called Msg
            return HttpResponseServerError("Widget instance could not be saved")

    @staticmethod
    def update(
        inst_id=None,
        name=None,
        qset=None,
        is_draft=None,
        open_at=None,
        close_at=None,
        attempts=None,
        guest_access=None,
        embedded_only=None,
        is_student_made=None,
    ):
        # ordinarily there would be several checks here requiring an active login
        #  and making sure the current user can edit the relevant widget instance
        # since this can potentially be called by a command line process, we can't do that - because there is no user

        # if (\Service_User::verify_session() !== true) return Msg::no_login();
        # if (\Service_User::verify_session('no_author')) {
        #     return Msg::invalid_input('You are not able to create or edit widgets.');
        # }
        # if ( ! static::has_perms_to_inst($inst_id, [Perm::FULL])) return Msg::no_perm();

        # TODO: move the part of this code that actually does stuff somewhere else and call that new function from here
        if not ValidatorUtil.is_valid_hash(inst_id):
            return MsgUtil.create_invalid_input_msg(msg="Instance ID is invalid")
        try:
            instance = WidgetInstance.objects.get(id=inst_id)
            widget = instance.widget
        except WidgetInstance.DoesNotExist:
            # originally this was calling Msg::failure
            return HttpResponseServerError("Widget instance could not be found.")

        if is_draft and not widget.is_editable:
            # originally this was calling Msg::failure
            return MsgUtil.create_failure_msg(msg="Non-editable widgets can not be saved as drafts!")
        # TODO: rewrite this when we have a way of implementing users, see above
        # if not is_draft and not widget.publishable_by(current_user):
        #     # originally this was calling Msg::no_perm
        #     return MsgUtil.create_no_perm_msg(msg="Widget type can not be published by students.")

        # student-made widgets are locked forever
        if instance.is_student_made:
            if guest_access is False:
                # return new Msg(
                #     'Student-made widgets must stay in guest access mode.',
                #     'Student Made',
                #     'error',
                #     false
                # );
                return HttpResponseServerError(
                    "Student-made widgets must stay in guest access mode."
                )
            attempts = -1
            guest_access = True

        if bool(qset):
            instance.qset = qset

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

        if is_draft is not None:
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

        if open_at is not None:
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

        if close_at is not None:
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

        if attempts is not None:
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

        if guest_access is not None:
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
                access = PermObjectToUser.objects.filter(
                    object_id=inst_id, object_type=PermObjectToUser.ObjectType.INSTANCE
                )
                for a in access:
                    if (
                        PermManager.user_is_student(a.user)
                        and a.user is not instance.user
                    ):
                        # TODO: implement notifications
                        # \Model_Notification::send_item_notification(
                        #     \Model_user::find_current_id(),
                        #     $user_id,
                        #     Perm::INSTANCE,
                        #     $inst_id,
                        #     'disabled',
                        #     null
                        # );
                        a.delete()

        if embedded_only is not None:
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
            logger.info("WHAT THE FUCK")
            logger.exception(e)
            # originally this was calling Msg::failure
            return HttpResponseServerError("Widget instance could not be created.")