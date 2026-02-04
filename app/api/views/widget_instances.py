import logging

from api.filters import UserInstanceFilterBackend
from api.permissions import (
    CanCreateWidgetInstances,
    DenyAll,
    HasAnyPerms,
    HasFullPerms,
    HasInstanceLock,
    InstanceHasGuestAccess,
    IsSuperOrSupportUser,
    ReadOnlyIfAuthenticated,
)
from api.serializers import (
    ObjectPermissionSerializer,
    PermsUpdateRequestListSerializer,
    PlayIdSerializer,
    QuestionSetSerializer,
    ScoreSummarySerializer,
    WidgetInstanceCopyRequestSerializer,
    WidgetInstanceSerializer,
)
from core.message_exception import MsgFailure, MsgInvalidInput, MsgNoPerm
from core.models import (
    LogActivity,
    LogPlay,
    Notification,
    ObjectPermission,
    WidgetInstance,
    WidgetQset,
)
from core.services.instance_service import WidgetInstanceService
from core.services.perm_service import PermService
from core.services.play_data_exporter_service import PlayDataExporterService
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

logger = logging.getLogger(__name__)


class WidgetInstancePagination(PageNumberPagination):
    page_size = 80
    page_size_query_param = "page_size"
    max_page_size = 80


# Viewset for widget instances.
# All users can access any instance, but if they are unable to play that instance (e.g. guest mode is disabled),
# any identifying info is stripped from the response.
# Only the superuser is able to get a list of all instances. Users however can get a list of their own instances.
class WidgetInstanceViewSet(viewsets.ModelViewSet):

    pagination_class = WidgetInstancePagination
    filter_backends = [UserInstanceFilterBackend, DjangoFilterBackend]
    serializer_class = WidgetInstanceSerializer

    # queryset filtering managed via UserInstanceFilterBackend
    def get_queryset(self):
        return WidgetInstance.objects.all()

    def get_permissions(self):
        user_query = self.request.query_params.get("user")
        # play_id = self.request.query_params.get("play_id")

        # Require special perms for list
        if self.action == "list":
            # Allow all if user is superuser or support user
            if user_query is None:
                permission_classes = [IsSuperOrSupportUser]
            # Otherwise, just make sure the user is authenticated. Do not allow reading if not. The queryset already
            # only contains this user's instances if they have requested their own.
            else:
                permission_classes = [IsAuthenticated]

        # score distribution needs to be accessible to anyone who can play an instance
        # this either requires authentication (for normal instances)
        # or public visibility (for guest instances)
        elif self.action == "performance":
            permission_classes = [IsAuthenticated | InstanceHasGuestAccess]

        # must have (any) access to instance or elevated perms
        # TODO: question_sets can't be restricted in this way, but we may want more context-sensitive authorization
        elif self.action == "copy":
            permission_classes = [HasFullPerms | IsSuperOrSupportUser]

        elif self.action == "export_playdata":
            permission_classes = [HasAnyPerms | IsSuperOrSupportUser]

        elif self.action == "undelete":
            permission_classes = [IsSuperOrSupportUser]

        # any authenticated user can ask what users have what perms on an instance
        elif self.action == "perms":
            permission_classes = [
                HasAnyPerms | IsSuperOrSupportUser | ReadOnlyIfAuthenticated
            ]

        # Special perms for creation
        elif self.action == "create":
            permission_classes = [CanCreateWidgetInstances]

        # User needs full perms to delete or lock widget
        elif self.action == "destroy" or self.action == "lock":
            permission_classes = [HasFullPerms | IsSuperOrSupportUser]

        # User must have full perms and lock to edit
        elif self.action == "update" or self.action == "partial_update":
            permission_classes = [
                (HasFullPerms & HasInstanceLock) | IsSuperOrSupportUser
            ]

        # Anyone can play a widget and get its qset
        elif self.action == "question_sets" or self.action == "retrieve":
            permission_classes = [AllowAny]

        # Catch all just to block anything else
        else:
            permission_classes = [DenyAll]

        return [permission() for permission in permission_classes]

    def get_serializer_context(self):
        context = super().get_serializer_context()

        # User isn't getting a widget detail, instead they are listing or updating.
        # By that logic, they already can edit the widget due to how perms are set up.
        if self.action != "retrieve":
            context["hide_identifying_info"] = False
        # Check if the user can play the instance. If they can't, don't include identifying info
        else:
            if self.get_object().playable_by_current_user(self.request.user):
                context["hide_identifying_info"] = False
            else:
                context["hide_identifying_info"] = True

        return context

    def perform_create(self, serializer):
        widget = serializer.validated_data["widget"]
        is_draft = serializer.validated_data["is_draft"]
        is_student = PermService.user_is_student(self.request.user)

        # Check to see if this widget is editable
        if not widget.is_editable:
            raise ValidationError("Non-editable widgets cannot be created")

        # Make sure user can publish this widget
        if not is_draft and not widget.publishable_by(self.request.user):
            raise ValidationError("You cannot publish this widget")

        # Add and override some additional info, including user and student status stuffs
        new_instance = serializer.save(
            user=self.request.user,
            is_student_made=is_student,
            guest_access=is_student,
            attempts=-1,
        )

        # add the permission record for the instance owner
        new_instance.permissions.create(user=self.request.user, permission="full")

    def perform_update(self, serializer):
        instance = self.get_object()
        is_draft = serializer.validated_data.get("is_draft", instance.is_draft)
        guest_access = serializer.validated_data.get(
            "guest_access", instance.guest_access
        )

        # Check to see if this widget is editable
        if not instance.widget.is_editable:
            raise ValidationError("Non-editable widgets cannot be updated")

        # Make sure user can publish this widget
        if not is_draft and not instance.widget.publishable_by(self.request.user):
            raise ValidationError("You cannot publish this widget")

        # Make sure student made widgets cannot leave guest access mode
        if instance.is_student_made:
            if guest_access is not True:
                raise ValidationError(
                    "Student-made widgets must stay in guest access mode"
                )
            serializer.validated_data["attempts"] = -1

        # If is no longer a draft, add current user as publisher
        if instance.published_by is None and not is_draft:
            serializer.validated_data["published_by"] = self.request.user

        # TODO create session_activities for each updated field? see original PHP code
        # TODO bundle below with above TODO when implemented
        # If user is a student and they're not the owner, they can't do anything
        # If user is a student and they're the owner, they're allowed to set it to guest access (but cant take it out)
        # If not a student, they can do whatever
        if (
            instance.user == self.request.user and guest_access
        ) or not PermService.user_is_student(self.request.user):
            # TODO make session activity here

            # Remove permissions from students when instance is no longer in guest mode
            if serializer.validated_data.get("guest_access") is False:
                for shared_user_perm in instance.permissions.all():
                    # Make sure shared user is student
                    if (
                        not PermService.user_is_student(shared_user_perm.user)
                        or shared_user_perm.user == instance.user
                    ):
                        continue

                    # Remove perm
                    shared_user_perm.delete()

                    # Send notif
                    Notification.create_instance_notification(
                        from_user=self.request.user,
                        to_user=shared_user_perm.user,
                        instance=instance,
                        mode="disabled",
                    )

        serializer.save()

    def perform_destroy(self, instance):
        instance = self.get_object()

        # TODO send event trigger

        # Set deleted flag
        instance.is_deleted = True
        instance.save()

        # Create activity log
        LogActivity.objects.create(
            user=self.request.user,
            type=LogActivity.TYPE_DELETE_WIDGET,
            item_id=instance.id,
            value_1=instance.name,
            value_2=instance.widget.id,
        )

        # Send notifications
        for shared_user_perm in instance.permissions.all():
            Notification.create_instance_notification(
                from_user=self.request.user,
                to_user=shared_user_perm.user,
                instance=instance,
                mode="deleted",
            )

    # /api/instances/<inst id>/question_sets/
    # ?latest=true GET param for only the latest qset
    # ?play_id=<play id> GET param to grant access
    @action(detail=True, methods=["get"])
    def question_sets(self, request, pk=None):
        instance = self.get_object()

        get_latest = request.query_params.get("latest", "false")
        play_id = request.query_params.get("play_id", None)

        if get_latest == "true":
            qset = instance.get_latest_qset()
            serializer = QuestionSetSerializer(qset)
            return Response(serializer.data)

        elif play_id is not None:
            play_id_serializer = PlayIdSerializer(data=play_id)
            if play_id_serializer.is_valid(raise_exception=True):
                qset = instance.get_qset_for_play(play_id)
                serializer = QuestionSetSerializer(qset)
                return Response(serializer.data)

        else:
            qsets = instance.qsets.all()
            serializer = QuestionSetSerializer(qsets, many=True)
            return Response(serializer.data)

    # /api/instances/<inst id>/question_sets/<qset id>
    # TODO this endpoint may not be required at all
    @action(detail=True, methods=["get"], url_path="question_sets/(?P<qset_id>[^/.]+)")
    def question_set(self, request, pk=None, qset_id=None):
        qset = WidgetQset.objects.filter(instance=pk, id=qset_id).first()
        serializer = QuestionSetSerializer(qset)
        return Response(serializer.data)

    # /api/instances/<inst id>/lock/
    @action(
        detail=True,
        methods=["get"],
    )
    def lock(self, request, pk=None):
        instance = self.get_object()
        return Response(
            {"lock_obtained": WidgetInstanceService.get_lock(instance.id, request.user)}
        )

    @action(detail=True, methods=["get"])
    def performance(self, request, pk=None):
        instance = self.get_object()

        logs = (
            LogPlay.objects.filter(instance=instance, is_complete=True)
            .order_by("-created_at", "semester")
            .select_related("semester")
        )
        summary = ScoreSummarySerializer.create_from_plays(logs)

        serialized = ScoreSummarySerializer(data=summary, many=True)
        serialized.is_valid(raise_exception=True)
        return Response(serialized.data)

    @action(
        detail=True,
        methods=["get", "put"],
    )
    def perms(self, request, pk=None):
        instance = self.get_object()

        if request.method == "GET":
            permissions = instance.permissions.all()
            serialized_data = ObjectPermissionSerializer.from_queryset(permissions)
            return Response(serialized_data)

        elif request.method == "PUT":
            # Get info about requester
            requester = self.request.user
            requester_perm = None

            # Elevated users have implicit permission to perform any action
            if PermService.is_superuser_or_elevated(requester):
                requester_perm = ObjectPermission.PERMISSION_ADMIN

            # check for global perm next
            elif requester_perm_obj := instance.permissions.filter(
                user=requester, context_id__isnull=True
            ).first():
                requester_perm = requester_perm_obj.permission

            # no global perm? check provisional access, understood to be PERMISSION_VISIBLE
            elif instance.permissions.filter(
                user=requester, context_id__isnull=False
            ).exists():
                requester_perm = ObjectPermission.PERMISSION_VISIBLE

            # requester should not be performing any PUT actions here
            else:
                raise MsgNoPerm(
                    msg="You do not have permission to perform this action."
                )

            # Verify request data
            request_serializer = PermsUpdateRequestListSerializer(data=request.data)
            request_serializer.is_valid(raise_exception=True)

            refusals = []
            updates = request_serializer.validated_data.get("updates", [])

            # Don't update perms if user is the only full perm holder
            full_perm_holders = [
                update
                for update in updates
                if update["perm_level"] == ObjectPermission.PERMISSION_FULL
            ]
            if (
                requester_perm == ObjectPermission.PERMISSION_FULL
                and len(full_perm_holders) == 0
            ):
                raise MsgFailure(
                    msg="Cannot remove permissions from the only full permission holder."
                )

            # Go through each perm request and process it
            for update in updates:
                perm_level = update["perm_level"]
                expiration = update["expiration"]
                user = update["user"]
                contexts = update["has_contexts"]

                user_existing_perm = None
                user_provisional_perms = instance.permissions.none()

                if user_existing_perm_obj := instance.permissions.filter(
                    user=user, context_id__isnull=True
                ).first():
                    user_existing_perm = user_existing_perm_obj.permission

                # provisional perms are only populated if a global perm isn't present
                if not user_existing_perm:
                    user_provisional_perms = instance.permissions.filter(user=user)

                # If perm_level is null, delete all perm entries for this user
                if perm_level is None:
                    if (
                        user_existing_perm is None
                        and not user_provisional_perms.exists()
                    ):
                        # user already doesnt have perms - neither global nor provisional
                        continue

                    # Requester requires a higher permission level than visible for anyone except themselves
                    if (
                        user != requester
                        and PermService.compare_perms(
                            requester_perm, ObjectPermission.PERMISSION_VISIBLE
                        )
                        < 1
                    ):
                        refusals.append(user)
                        continue

                    # Requester cannot remove perms from anyone w higher than them
                    if (
                        user_existing_perm is not None
                        and PermService.compare_perms(
                            requester_perm, user_existing_perm
                        )
                        > 0
                    ):
                        refusals.append(user)
                        continue

                    # Delete all permissions (both global and context-specific) for this user
                    instance.permissions.filter(user=user).delete()
                    # Send deletion notif
                    Notification.create_instance_notification(
                        from_user=requester,
                        to_user=user,
                        instance=instance,
                        mode="disabled",
                    )
                    continue

                # Make sure requester can't modify perms of others with higher perms than their own
                if (
                    user_existing_perm is not None
                    and PermService.compare_perms(requester_perm, user_existing_perm)
                    > 0
                ):
                    refusals.append(user)
                    continue

                # Make sure requester can't lower their own permission value
                # (they can only revoke their access completely)
                if (
                    user == requester
                    and not PermService.is_superuser_or_elevated(requester)
                    and PermService.compare_perms(requester_perm, perm_level) < 0
                ):
                    refusals.append(user)
                    continue

                # Make sure requester can't grant perms higher than their own
                if PermService.compare_perms(requester_perm, perm_level) > 0:
                    refusals.append(user)
                    continue

                # If this user is a student, make sure we can only give them perms if this instance is in guest mode
                if PermService.user_is_student(user):
                    if not instance.guest_access:
                        refusals.append(user)
                        continue

                    # Additionally, if this user is a student, give them view access to all assets of this instance
                    PermService.set_user_asset_perms_for_instance(
                        user, instance, perm_level
                    )

                # if contexts are not provided with the perm, we're updating from provisional to global
                if not contexts:

                    # Check if a global perm already exists with this permission level
                    will_update_or_create = not instance.permissions.filter(
                        user=user, permission=perm_level, context_id__isnull=True
                    ).exists()

                    # Delete any context-specific permissions for this user
                    # This elevates context-limited permissions to global permissions
                    instance.permissions.filter(
                        user=user, context_id__isnull=False
                    ).delete()

                    # Update or create the global permission (context_id=None)
                    instance.permissions.update_or_create(
                        user=user,
                        context_id=None,
                        defaults={"permission": perm_level, "expires_at": expiration},
                    )

                    # Send notification
                    if will_update_or_create:
                        Notification.create_instance_notification(
                            request.user, user, instance, "changed", perm_level
                        )

                else:
                    # provisional access cannot have an expiration
                    if expiration is not None:
                        refusals.append(user)
                        continue

                    # provisional access cannot be higher than visible
                    if (
                        PermService.compare_perms(
                            ObjectPermission.PERMISSION_VISIBLE, perm_level
                        )
                        > 0
                    ):
                        refusals.append(user)
                        continue

            # If there was a refusal, return a message
            if len(refusals) > 0:
                # TODO: evaluate logger level and details of `refusals`
                logger.error(refusals)
                raise MsgFailure(
                    msg=f"Could not update {len(refusals)} out of {len(updates)} permissions."
                )

            # Otherwise, return success
            return Response({"success": True})

        raise MethodNotAllowed(request.method)

    @action(detail=True, methods=["put"])
    def copy(self, request, pk=None):
        request_serializer = WidgetInstanceCopyRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        name = request_serializer.validated_data.get("new_name")
        copy_existing_perms = request_serializer.validated_data.get(
            "copy_existing_perms"
        )

        instance = self.get_object()
        try:
            duplicate = instance.duplicate(request.user, name, copy_existing_perms)
        except Exception:
            logger.error("Failed to copy widget instance", exc_info=True)
            raise MsgFailure(msg="Widget instance could not be copied.")

        return Response(WidgetInstanceSerializer(duplicate).data)

    # WAS /data/export/
    # This endpoint can be visited directly and the file will download, or can be called like a normal API endpoint
    @action(detail=True, methods=["get"])
    def export_playdata(self, request, pk=None):
        # Get and validate query params
        export_type = request.query_params.get("type", None)
        semester_ids = request.query_params.get("semesters", "")

        if export_type is None:
            raise MsgInvalidInput(msg="Missing export_type query parameter")

        instance = self.get_object()
        is_student = PermService.user_is_student(request.user)

        result, file_ext = PlayDataExporterService.export(
            instance, export_type, semester_ids, is_student
        )

        # technically supposed to use DRF's Response here, but it adds additional processing that makes switching
        # between different file formats (strings like CSVs, blobs like ZIP files, etc.) more difficult
        resp = HttpResponse(result)
        resp["Pragma"] = "public"
        resp["Expires"] = "0"
        resp["Cache-Control"] = "must-revalidate, post-check=0, pre-check=0"
        resp["Content-Type"] = "application/force-download"
        resp["Content-Type"] = "application/octet-stream"
        resp["Content-Type"] = "application/download"
        resp["Content-Disposition"] = (
            f'attachment; filename="export_{instance.name}.{file_ext}"'
        )
        return resp

    @action(detail=True, methods=["post"])
    def undelete(self, request, pk=None):
        instance = WidgetInstance.objects.get(id=pk)
        if not instance:
            return ValidationError("Must provide a valid instance ID.")

        if not instance.is_deleted:
            return ValidationError("Instance is not deleted.")

        instance.is_deleted = False
        instance.save()

        return Response({"success": True})
