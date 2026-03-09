# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from __future__ import annotations

import logging
import os
import re
import types
from pathlib import Path
from typing import Self

from core.message_exception import MsgFailure
from core.services.asset_service import AssetService
from core.services.email_service import EmailService
from core.services.perm_service import PermService
from core.services.user_service import UserService
from core.utils.b64_util import Base64Util
from core.utils.validator_util import ValidatorUtil
from django.conf import settings
from django.contrib.auth.models import AnonymousUser, User
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import DatabaseError, models, transaction
from django.db.models import Q, QuerySet
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.functional import classproperty
from django.utils.text import slugify
from django.utils.translation import gettext_lazy
from lti_tool.models import LtiDeployment

logger = logging.getLogger(__name__)


class ObjectPermission(models.Model):
    PERMISSION_ADMIN = "admin"
    PERMISSION_VISIBLE = "visible"
    PERMISSION_FULL = "full"
    PERMISSION_CHOICES = [
        (PERMISSION_VISIBLE, "Read-Only"),
        (PERMISSION_FULL, "Full Access"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="object_permissions"
    )

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=10, db_collation="utf8_bin")
    content_object = GenericForeignKey("content_type", "object_id")
    permission = models.CharField(max_length=20, choices=PERMISSION_CHOICES)
    expires_at = models.DateTimeField(default=None, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    context_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        unique_together = ("user", "content_type", "object_id", "context_id")
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["user", "permission"]),
        ]


class Asset(models.Model):
    MIME_TYPE_TO_EXTENSION = {
        "image/png": "png",
        "image/gif": "gif",
        "image/jpeg": "jpg",
        "audio/mp4": "m4a",
        "audio/x-m4a": "m4a",
        "audio/mpeg": "mp3",
        "audio/wav": "wav",
        "audio/wave": "wav",
        "audio/x-wav": "wav",
        "text/plain": "obj",
    }

    MIME_TYPE_FROM_EXTENSION = {
        "png": "image/png",
        "gif": "image/gif",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "m4a": "audio/mp4",
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "obj": "text/plain",
    }

    id = models.CharField(primary_key=True, max_length=10, db_collation="utf8_bin")
    file_type = models.CharField(max_length=10, default="")
    created_at = models.DateTimeField(default=timezone.now)
    title = models.CharField(max_length=300, default="")
    file_size = models.IntegerField(default=0)
    deleted_at = models.DateTimeField(default=None, null=True)
    is_deleted = models.BooleanField(default=False)

    permissions = GenericRelation(ObjectPermission)

    def is_valid(self):
        from core.utils.validator_util import ValidatorUtil

        return (
            ValidatorUtil.is_valid_hash(self.id)
            and self.file_type in Asset.MIME_TYPE_FROM_EXTENSION.keys()
        )

    # Get the materia asset type based on the mime type
    # param string mime_type: string mime type to convert to materia asset type: ex 'image/png'
    @staticmethod
    def get_type_from_mime_type(mime_type):
        if mime_type not in Asset.MIME_TYPE_TO_EXTENSION.keys():
            return ""
        return Asset.MIME_TYPE_TO_EXTENSION[mime_type]

    # Finds an available asset ID to avoid database collisions
    @staticmethod
    def get_unused_id():
        from core.utils.hash_util import HashUtil

        asset_id = None

        # try 10 times to get an unused asset ID
        for i in range(10):
            try_id = HashUtil.generate_key_hash()
            try:
                Asset.objects.get(id=try_id)
                continue
            except Asset.DoesNotExist:
                asset_id = try_id
                break

        return asset_id

    def save(self, *args, **kwargs) -> bool:
        from core.utils.validator_util import ValidatorUtil

        if ValidatorUtil.is_valid_hash(self.id) and not bool(self.file_type):
            return False
        asset_id = self.id if self.id != "" else Asset.get_unused_id()
        if not bool(asset_id):
            return False
        try:
            with transaction.atomic():
                self.id = asset_id
                self.created_at = timezone.now()
                super().save(*args, **kwargs)

            return True

        except Exception:
            logger.error(
                "The following exception occurred while attempting to store an asset",
                exc_info=True,
            )
            return False

    def delete(self, *args, **kwargs) -> bool:
        if len(str(self.id)) == 0:
            return False

        try:
            with transaction.atomic():
                super().delete()
                try:
                    ad_obj = AssetData.objects.get(id=self.id)
                    ad_obj.delete()
                except AssetData.DoesNotExist:
                    pass

            self = Asset()
            return True

        except Exception:
            logger.error(
                "The following exception occurred while attempting to remove an asset",
                exc_info=True,
            )
            return False

    def render(self, size="original"):
        return AssetService.get_asset_storage_driver().render(self, size)

    def get_mime_type(self):
        return Asset.MIME_TYPE_FROM_EXTENSION[self.file_type]

    @classproperty
    def content_type(cls):
        return ContentType.objects.get_for_model(cls)

    @staticmethod
    def handle_uploaded_file(user, uploaded_file):
        asset = Asset()
        # ordinarily this would be handled in db_store()
        # we're pre-setting an ID here so we can fail without writing a DB row if there's a driver problem
        asset.id = Asset.get_unused_id()
        asset.file_type = Asset.MIME_TYPE_TO_EXTENSION[uploaded_file.content_type]
        asset.title = uploaded_file.name
        asset.file_size = uploaded_file.size

        AssetService.get_asset_storage_driver().handle_uploaded_file(
            asset, uploaded_file
        )

        asset.save()

        return asset

    class Meta:
        db_table = "asset"


# Custom LONGBLOB field for storing binary asset data
# Django doesn't natively support LONGBLOB - BinaryField is BLOB
class LongBlobField(models.BinaryField):
    def db_type(self, connection):
        if connection.vendor == "mysql":
            return "LONGBLOB"
        return super().db_type(connection)


# Revisit this later - either it sticks in the new version or is replaced with something Django-y
# Rebuild the FuelPHP version locally using the DB storage driver for assets, see what goes in here
# Maybe come up with a process to pull binaries out of this table and write them to disk somewhere?
# BIG WARNING: we (UCF) do not use this, we have no idea if any of this is even viable
class AssetData(models.Model):
    # This model is not used in the application. The table is empty.
    id = models.CharField(primary_key=True, max_length=10, db_collation="utf8_bin")
    file_type = models.CharField(max_length=10)
    status = models.CharField(max_length=20)
    size = models.CharField(max_length=20)
    bytes = models.IntegerField()  # consider using db_column to change the name
    hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)
    data = LongBlobField()

    class Meta:
        db_table = "asset_data"
        constraints = [
            models.UniqueConstraint(fields=["id", "size"], name="asset_data_main"),
        ]
        indexes = [
            models.Index(fields=["hash"], name="asset_data_hash"),
            models.Index(fields=["created_at"], name="asset_data_created_at"),
        ]


class DateRange(models.Model):
    id = models.BigAutoField(primary_key=True)
    semester = models.CharField(max_length=255)
    year = models.IntegerField()
    start_at = models.DateTimeField(default=timezone.now)
    end_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "date_range"
        constraints = [
            models.UniqueConstraint(
                fields=["semester", "year", "start_at", "end_at"],
                name="date_range_main",
            ),
        ]


class Log(models.Model):
    class LogType(models.TextChoices):
        EMPTY = "", gettext_lazy("Empty")
        BUTTON_PRESS = "BUTTON_PRESS", gettext_lazy("Button Press")
        ERROR_GENERAL = "ERROR_GENERAL", gettext_lazy("General Error")
        ERROR_TIME_VALIDATION = "ERROR_TIME_VALIDATION", gettext_lazy(
            "Time Validation Error"
        )
        KEY_PRESS = "KEY_PRESS", gettext_lazy("Key Press")
        SCORE_ACTIVITY_FROM_CLIENT = "SCORE_ACTIVITY_FROM_CLIENT", gettext_lazy(
            "Client Score Activity"
        )
        SCORE_FINAL_FROM_CLIENT = "SCORE_FINAL_FROM_CLIENT", gettext_lazy(
            "Final Client Score"
        )
        SCORE_QUESTION_ANSWERED = "SCORE_QUESTION_ANSWERED", gettext_lazy(
            "Question Answered"
        )
        SCORE_WIDGET_INTERACTION = "SCORE_WIDGET_INTERACTION", gettext_lazy(
            "Widget Score Interaction"
        )
        SCORE_PARTICIPATION = "SCORE_PARTICIPATION", gettext_lazy("Participation Score")
        WIDGET_CORE_INIT = "WIDGET_CORE_INIT", gettext_lazy("Widget Initialization")
        WIDGET_END = "WIDGET_END", gettext_lazy("Widget End")
        WIDGET_LOAD_DONE = "WIDGET_LOAD_DONE", gettext_lazy("Finish Widget Load")
        WIDGET_LOAD_START = "WIDGET_LOAD_START", gettext_lazy("Start Widget Load")
        WIDGET_LOGIN = "WIDGET_LOGIN", gettext_lazy("Widget Login")
        WIDGET_PLAY_REQ = "WIDGET_PLAY_REQ", gettext_lazy("Widget Play Request")
        WIDGET_PLAY_START = "WIDGET_PLAY_START", gettext_lazy("Widget Play Start")
        WIDGET_RESTART = "WIDGET_RESTART", gettext_lazy("Widget Restart")
        WIDGET_START = "WIDGET_START", gettext_lazy("Widget Start")
        WIDGET_STATE = "WIDGET_STATE", gettext_lazy("Widget State")
        DATA = "DATA", gettext_lazy("Data")

        @staticmethod
        def get_log_type(log_type_id: int) -> str:
            """
            Maps integer codes to log types
            TODO: some of these don't seem to have equivalents in python. is this intentional?
            """
            match log_type_id:
                case 1:
                    return Log.LogType.WIDGET_START
                case 2:
                    return Log.LogType.WIDGET_END
                case 4:
                    return Log.LogType.WIDGET_RESTART
                case 5:
                    # return Log.LogType.ASSET_LOADING
                    return Log.LogType.EMPTY
                case 6:
                    # return Log.LogType.ASSET_LOADED
                    return Log.LogType.EMPTY
                case 7:
                    # return Log.LogType.FRAMEWORK_INIT
                    return Log.LogType.WIDGET_CORE_INIT
                case 8:
                    # return Log.LogType.PLAY_REQUEST
                    return Log.LogType.WIDGET_PLAY_REQ
                case 9:
                    # return Log.LogType.PLAY_CREATED
                    return Log.LogType.WIDGET_PLAY_START
                case 13:
                    # return Log.LogType.LOG_IN
                    return Log.LogType.WIDGET_LOGIN
                case 15:
                    # return Log.LogType.WIDGET_STATE_CHANGE
                    return Log.LogType.WIDGET_STATE
                case 500:
                    return Log.LogType.KEY_PRESS
                case 1000:
                    return Log.LogType.BUTTON_PRESS
                case 1001:
                    # return Log.LogType.WIDGET_INTERACTION
                    return Log.LogType.SCORE_WIDGET_INTERACTION
                case 1002:
                    # return Log.LogType.FINAL_SCORE_FROM_CLIENT
                    return Log.LogType.SCORE_FINAL_FROM_CLIENT
                case 1004:
                    # return Log.LogType.QUESTION_ANSWERED
                    return Log.LogType.SCORE_QUESTION_ANSWERED
                case 1006:
                    return Log.LogType.SCORE_PARTICIPATION
                case 1008:
                    # return Log.LogType.SCORE_FEEDBACK
                    return Log.LogType.EMPTY
                case 1009:
                    # return Log.LogType.SCORE_ALERT
                    return Log.LogType.EMPTY
                case 1500:
                    return Log.LogType.ERROR_GENERAL
                case 1509:
                    return Log.LogType.ERROR_TIME_VALIDATION
                case 2000:
                    return Log.LogType.DATA
                case _:
                    return Log.LogType.EMPTY

    id = models.BigAutoField(primary_key=True)
    # consider converting to UUID field. Note: there appear to be some non-UUID values in the table
    # TODO: should this be a foreign key to LogPlay?
    play_id = models.CharField(max_length=100, db_collation="utf8_bin")
    # type is a "soft" reserved word in Python
    log_type = models.CharField(
        max_length=26,
        blank=True,
        null=True,
        choices=LogType.choices,
        default=LogType.EMPTY,
    )
    # typically contains internal qset IDs for questions, may contain 0, may contain nothing
    item_id = models.CharField(max_length=255)
    text = models.TextField()
    value = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)
    game_time = models.IntegerField()
    ip = models.CharField(max_length=20)

    class Meta:
        db_table = "log"
        indexes = [
            models.Index(fields=["play_id"], name="log_play_id"),
            models.Index(fields=["log_type"], name="log_type"),
            models.Index(fields=["created_at"], name="log_created_at"),
        ]


# this sucks
# re-engineer it to be useful and sensible
class LogActivity(models.Model):
    # Activity Types
    TYPE_CREATE_WIDGET = "createdWidget"
    TYPE_DELETE_WIDGET = "deletedWidget"
    TYPE_PUBLISH_WIDGET = "publishedWidget"
    TYPE_EDIT_WIDGET = "editedWidget"
    TYPE_EDIT_WIDGET_SETTINGS = "editedWidgetSettings"
    TYPE_LOGGED_IN = "loggedIn"
    TYPE_LOGGED_OUT = "loggedOut"
    TYPE_INSTALL_WIDGET = "installWidget"
    TYPE_UPDATE_WIDGET = "updateWidget"
    TYPE_ADMIN_EDIT_WIDGET = "adminEditWidget"
    TYPE_ADMIN_EDIT_USER = "adminEditUser"

    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        User,
        related_name="activity_logs",
        on_delete=models.SET_NULL,
        db_column="user_id",
        blank=True,
        null=True,
    )

    type = models.CharField(max_length=255)  # type is a "soft" reserved word in Python
    created_at = models.DateTimeField(default=timezone.now)
    # item_id contains arbitrary values based on what 'type' of activity is being logged
    item_id = models.CharField(max_length=100, db_collation="utf8_bin")
    value_1 = models.CharField(max_length=255, blank=True, null=True)
    value_2 = models.CharField(max_length=255, blank=True, null=True)
    value_3 = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "log_activity"
        indexes = [
            models.Index(fields=["type"], name="log_activity_type"),
            models.Index(fields=["item_id"], name="log_activity_item_id"),
            models.Index(fields=["created_at"], name="log_activity_created_at"),
        ]


class LogPlay(models.Model):
    AUTH_CHOICES = [("", ""), ("lti", "lti")]

    id = models.CharField(primary_key=True, max_length=100, db_collation="utf8_bin")
    instance = models.ForeignKey(
        "WidgetInstance",
        related_name="play_logs",
        on_delete=models.PROTECT,
        db_column="inst_id",
    )
    is_valid = models.BooleanField()  # was previously CharField, enum in DB
    created_at = models.DateTimeField(default=timezone.now)
    user = models.ForeignKey(
        User,
        related_name="play_logs",
        on_delete=models.SET_NULL,
        db_column="user_id",
        blank=True,
        null=True,
    )
    ip = models.CharField(max_length=20)
    is_complete = models.BooleanField()  # was previously CharField, enum in DB
    score = models.DecimalField(max_digits=52, decimal_places=2)
    score_possible = models.IntegerField()
    percent = models.FloatField()
    elapsed = models.IntegerField()
    qset = models.ForeignKey(
        "WidgetQset",
        related_name="play_logs",
        on_delete=models.PROTECT,
        db_column="qset_id",
    )
    auth = models.CharField(max_length=3, choices=AUTH_CHOICES)
    lti_token = models.CharField(max_length=100, default="")
    referrer_url = models.CharField(max_length=255)
    context_id = models.CharField(max_length=255)
    semester = models.ForeignKey(
        DateRange,
        related_name="play_logs",
        on_delete=models.PROTECT,
        db_column="semester_id",
    )

    # TODO this can (should?) be replaced with a proper foreign key relationship in Log model
    def get_logs(self):
        return Log.objects.filter(play_id=self.id)

    def update_elapsed(self):
        self.elapsed = (timezone.now() - self.created_at).total_seconds()
        self.save()

    def set_complete(self, score, possible, percent):
        self.is_complete = True
        self.is_valid = False
        self.score = score
        self.score_possible = possible
        self.percent = percent if percent <= 100 else 100
        self.save()

    class Meta:
        db_table = "log_play"
        indexes = [
            models.Index(fields=["created_at"], name="log_play_created_at"),
            models.Index(fields=["is_complete"], name="log_play_is_complete"),
            models.Index(fields=["percent"], name="log_play_percent"),
        ]


class LogStorage(models.Model):
    id = models.BigAutoField(primary_key=True)
    instance = models.ForeignKey(
        "WidgetInstance",
        related_name="storage_logs",
        on_delete=models.PROTECT,
        db_column="inst_id",
    )
    play_log = models.ForeignKey(
        LogPlay,
        related_name="storage_logs",
        on_delete=models.PROTECT,
        db_column="play_id",
    )
    user = models.ForeignKey(
        User,
        related_name="storage_logs",
        on_delete=models.SET_NULL,
        db_column="user_id",
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(default=timezone.now)
    name = models.CharField(max_length=64)
    data = models.TextField()

    class Meta:
        db_table = "log_storage"
        indexes = [
            models.Index(fields=["created_at"], name="log_storage_created_at"),
            models.Index(fields=["name"], name="log_storage_name"),
        ]


class Lti(models.Model):
    id = models.BigAutoField(primary_key=True)
    widget_instance = models.ForeignKey(
        "WidgetInstance",
        related_name="lti_embeds",
        on_delete=models.PROTECT,
        db_column="item_id",
    )
    resource_link = models.CharField(max_length=255)

    # legacy 1.1 fields
    consumer = models.CharField(max_length=255, null=True)
    consumer_guid = models.CharField(max_length=255, null=True)

    lti_version = models.CharField(
        max_length=10, choices=[("1.1", "LTI 1.1"), ("1.3", "LTI 1.3")], default="1.1"
    )

    # LTI 1.3 foreign key to deployment
    # Deployments are themselves FK'd to registrations and platforms
    deployment = models.ForeignKey(
        LtiDeployment,
        related_name="deployment",
        on_delete=models.PROTECT,
        db_column="deployment_id",
        blank=True,
        null=True,
    )

    user = models.ForeignKey(
        User,
        related_name="lti_embeds",
        on_delete=models.SET_NULL,
        db_column="user_id",
        blank=True,
        null=True,
    )
    name = models.CharField(max_length=255, blank=True, null=True)
    context_id = models.CharField(max_length=255, blank=True, null=True)
    context_title = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "lti"
        indexes = [
            models.Index(fields=["resource_link"], name="lti_resource_link"),
            models.Index(fields=["consumer_guid"], name="lti_consumer_guid"),
            models.Index(fields=["deployment"], name="lti_deployment"),
        ]

    def platform(self):
        if self.lti_version == "1.3":
            return self.deployment.platform_instance
        else:
            return self.consumer_guid


class LtiPlayState(models.Model):
    class SubmissionStatus(models.TextChoices):
        NOT_SUBMITTED = "NOT_SUBMITTED", gettext_lazy("Not Submitted")
        SUCCESS = "SUCCESS", gettext_lazy("Success")
        AGS_NOT_INCLUDED = "AGS_NOT_INCLUDED", gettext_lazy("AGS Not Included")
        NOT_GRADED = "NOT_GRADED", gettext_lazy("Not Graded")
        ERR_NO_ATTEMPTS = "ERR_NO_ATTEMPTS", gettext_lazy("No Attempts")
        ERR_FAILURE = "ERR_FAILURE", gettext_lazy("Failure")

    id = models.BigAutoField(primary_key=True)
    play = models.OneToOneField(
        LogPlay,
        related_name="lti_play_state",
        on_delete=models.PROTECT,
        db_column="play_id",
    )
    lti_association = models.ForeignKey(
        Lti,
        related_name="lti_association",
        on_delete=models.PROTECT,
        db_column="lti_assoc",
    )
    ags_line_item = models.CharField(max_length=255, db_collation="utf8_bin")
    ags_user_id = models.CharField(max_length=255, db_collation="utf8_bin")
    ags_scoring_enabled = models.BooleanField(default=True)
    submission_status = models.CharField(
        max_length=26,
        choices=SubmissionStatus.choices,
        default=SubmissionStatus.NOT_SUBMITTED,
    )
    submission_attempts = models.PositiveIntegerField(default=0)
    last_submitted = models.DateTimeField(default=None, null=True)


# this sucks
# consider redoing the whole 'associate assets with questions that use them' process
class MapAssetToObject(models.Model):
    # table used in one function that's checking how many times an asset is used to see if it's
    # safe to delete except the function downstream of that function, which would actually use
    # the result, is never used

    # object generic model?
    # Needs primary key
    # refers to a question ID or a qset id
    object_id = models.CharField(max_length=255, db_collation="utf8_bin")
    # object_type  1 = widget_qset,  2 = question
    object_type = models.IntegerField()
    # ids seem arbitrary, don't map to rows in the assets table
    # possibly internal to the qset somehow?
    asset_id = models.CharField(
        max_length=10, db_collation="utf8_bin"
    )  # foreign key to Asset model

    class Meta:
        db_table = "map_asset_to_object"
        constraints = [
            models.UniqueConstraint(
                fields=["object_id", "object_type", "asset_id"],
                name="map_asset_to_object_main",
            ),
        ]


class Notification(models.Model):
    id = models.BigAutoField(primary_key=True)
    from_id = models.ForeignKey(
        User,
        related_name="notifications_from",
        on_delete=models.SET_NULL,
        db_column="from_id",
        blank=True,
        null=True,
    )
    to_id = models.ForeignKey(
        User,
        related_name="notifications_to",
        on_delete=models.SET_NULL,
        db_column="to_id",
        blank=True,
        null=True,
    )
    item_type = models.IntegerField(null=True)
    # this refers to a widget instance ID
    # can't foreign key it properly because we can't reliably expect every value to be valid
    # potentially sanitize data and revisit
    item_id = models.CharField(max_length=100, db_collation="utf8_bin")
    is_email_sent = models.BooleanField()  # was previously CharField, enum in DB
    created_at = models.DateTimeField(default=timezone.now)
    subject = models.CharField(max_length=511)
    # consider deleting this column & pulling the avatar from relevant user metadata just in time
    avatar = models.CharField(max_length=511)
    updated_at = models.DateTimeField(default=timezone.now)
    action = models.CharField(max_length=255)

    permissions = GenericRelation(ObjectPermission)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        # Create/update ownership permission
        self.permissions.update_or_create(
            user=self.to_id, permission=ObjectPermission.PERMISSION_FULL
        )

        # Send email, if not sent already
        self.send_email()

    @classmethod
    def create_instance_notification(
        cls,
        from_user: User,
        to_user: User,
        instance: WidgetInstance,
        mode: str,
        new_perm: str = None,
    ) -> Self | None:
        # Dont send notifs to self
        if from_user == to_user:
            return None

        # Create some strings that will be used later
        user_link = (
            f"{from_user.first_name} {from_user.last_name} ({from_user.username})"
        )
        widget_name = instance.name
        widget_type = instance.widget.name
        widget_link = (
            f"<a href='{settings.URLS['BASE_URL']}my-widgets#{instance.id}' target='_blank'>"
            f"{widget_name}</a>"
        )

        # Create permission string
        match new_perm:
            case ObjectPermission.PERMISSION_FULL:
                perm_string = "Full"
            case ObjectPermission.PERMISSION_VISIBLE:
                perm_string = "View Scores"
            case _:
                perm_string = "Unknown"

        # Create message
        action = ""
        match mode:
            case "disabled":
                content = f"{user_link} is no longer sharing '{widget_name}' with you."
            case "changed":
                content = (
                    f"{user_link} changed your access to widget '{widget_link}'.<br/>"
                    f"You now have {perm_string} access."
                )
            case "expired":
                content = f"Your access to '{widget_name}' has automatically expired."
            case "deleted":
                content = f"{user_link} deleted {widget_type} widget '{widget_name}'."
            case "access_request":
                content = (
                    f"{user_link} is requesting access to your widget '{widget_link}'.<br/>"
                    f"The widget is currently being used within a course in your LMS."
                )
                action = "access_request"
            case _:
                return None

        # Create notification object
        notification = cls.objects.create(
            from_id=from_user,
            to_id=to_user,
            item_type=WidgetInstance.content_type.id,
            item_id=instance.id,
            is_email_sent=False,
            avatar=UserService.get_avatar_url(from_user),
            subject=content,
            action=action,
        )

        return notification

    def send_email(self, force_resend: bool = False):
        # Check if sent already
        if self.is_email_sent and not force_resend:
            return

        # Check if recipient has notification emails enabled
        user_settings = UserSettings.objects.filter(user=self.to_id).first()
        if user_settings is not None:
            notify = user_settings.get_profile_fields().get("notify", False)
            if not notify:
                return

        # Create context for basic_notification
        context = {
            "message_html": self.subject,
        }
        if self.action == "access_request":
            context["action_text"] = "Go to Widget Collaboration Settings"
            context["action_link"] = (
                f"{settings.URLS['BASE_URL']}my-widgets/#{self.item_id}-collab"
            )

        # Send email
        email_sent = EmailService.send_email(
            template="basic_notification.html",
            context=context,
            plain_msg=self.subject,
            sender=self.from_id,
            to=self.to_id,
        )

        if email_sent:
            self.is_email_sent = True
            self.save()

    class Meta:
        db_table = "notification"
        indexes = [
            models.Index(fields=["is_email_sent"], name="notification_is_email_sent"),
            models.Index(fields=["to_id"], name="notification_to_id"),
            models.Index(fields=["from_id"], name="notification_from_id"),
            models.Index(fields=["item_type"], name="notification_item_type"),
        ]


class Question(models.Model):
    id = models.BigAutoField(primary_key=True)
    qset = models.ForeignKey(
        "WidgetQset",
        related_name="questions",
        on_delete=models.PROTECT,
        db_column="qset_id",
        null=True,
    )
    # base 64 encoded json question
    _data = models.TextField(db_column="data")
    item_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    type = models.ForeignKey(
        "Widget", related_name="widget_type", on_delete=models.PROTECT, db_column="type"
    )

    @property
    def data(self) -> dict:
        return Base64Util.decode(self._data)

    @data.setter
    def data(self, value: dict):
        if isinstance(value, dict):
            self._data = Base64Util.encode(value)
        else:
            self._data = value

    @staticmethod
    def is_question(item):
        # Convert item to a dictionary if it's not already
        if not isinstance(item, dict):
            try:
                item = dict(item)
            except (TypeError, ValueError):
                return False

        # Check if required keys exist
        if "id" not in item:
            return False
        if "type" not in item:
            return False
        if "questions" not in item:
            return False
        if "answers" not in item:
            return False

        # Check if values are not empty
        # In some rare cases an empty answers array is acceptable, as with Adventure
        if not item["type"] or not item["questions"]:
            return False

        # Check if questions and answers are lists
        if not isinstance(item["answers"], list):
            return False
        if not isinstance(item["questions"], list):
            return False

        return True

    class Meta:
        db_table = "question"


class UserExtraAttempts(models.Model):
    @staticmethod
    def get_cur_semester():
        from core.services.semester_service import SemesterService

        return SemesterService.get_current_semester()

    instance = models.ForeignKey(
        "WidgetInstance",
        related_name="extra_attempts",
        on_delete=models.CASCADE,
        null=False,
    )
    user = models.ForeignKey(
        User,
        related_name="extra_attempts",
        on_delete=models.CASCADE,
        null=False,
    )
    created_at = models.DateTimeField(default=timezone.now)
    extra_attempts = models.IntegerField()
    context_id = models.CharField(max_length=255)
    semester = models.ForeignKey(
        DateRange,
        related_name="extra_attempts",
        on_delete=models.CASCADE,
        null=False,
    )

    class Meta:
        db_table = "user_extra_attempts"


class Widget(models.Model):
    # update these to the relevant paths when those Python files exist
    PATHS_PLAYDATA = os.path.join("_exports", "playdata_exporters.py")
    PATHS_SCOREMOD = os.path.join("_score-modules", "score_module.php")

    SCORE_TYPE_CHOICES = [
        ("SERVER", "widget is scored on the server"),
        ("CLIENT", "widget is scored on the client"),
        ("SERVER-CLIENT", "widget is partially scored in both server and client"),
    ]

    UPDATE_METHODS = [("github", "Update via a Github releases API URL")]

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255, default="")
    created_at = models.DateTimeField(default=timezone.now)
    flash_version = models.PositiveIntegerField(default=0)
    height = models.PositiveSmallIntegerField(default=0)
    width = models.PositiveSmallIntegerField(default=0)
    is_scalable = models.BooleanField(default=True)
    score_module = models.CharField(max_length=100, default="base")
    score_type = models.CharField(
        max_length=13, choices=SCORE_TYPE_CHOICES, default="SERVER"
    )
    is_qset_encrypted = models.BooleanField(default=True)
    is_answer_encrypted = models.BooleanField(default=True)
    is_storage_enabled = models.BooleanField(default=False)
    is_editable = models.BooleanField(default=True)
    is_playable = models.BooleanField(default=True)
    is_scorable = models.BooleanField(default=True)
    in_catalog = models.BooleanField(default=True)
    featured = models.BooleanField(default=False)
    is_generable = models.BooleanField(default=False)
    uses_prompt_generation = models.BooleanField(default=False)
    creator = models.CharField(max_length=255, default="")
    clean_name = models.CharField(max_length=255, default="")
    player = models.CharField(max_length=255, default="")
    api_version = models.IntegerField(default=0)
    package_hash = models.CharField(max_length=32, db_collation="utf8_bin", default="")
    score_screen = models.CharField(max_length=255, default="")
    restrict_publish = models.BooleanField(default=False)
    creator_guide = models.CharField(max_length=255, default="")
    player_guide = models.CharField(max_length=255, default="")
    metadata = models.JSONField(default=dict)

    @property
    def dir(self):
        return f"{self.id}-{self.clean_name}{os.sep}"

    def publishable_by(self, user: User) -> bool:
        if not self.restrict_publish:
            return True
        return not PermService.user_is_student(user)

    @staticmethod
    def make_clean_name(name):
        base = name.replace(" ", "-").lower()
        return re.sub(r"[^a-z0-9-]", "", base)

    def get_playdata_exporter_methods(
        self, script_path: str = None
    ) -> dict[str, types.FunctionType]:
        # Check to see if methods are cached already
        if hasattr(Widget, "playdata_exporter_methods"):
            return Widget.playdata_exporter_methods

        # Grab and load the playdata exporter script
        if script_path is None:
            script_path = Path(self._make_relative_widget_path(self.PATHS_PLAYDATA))

        if not script_path.exists():
            return {}  # no custom playdata exporter, no custom methods to return

        script_text = script_path.read_text()

        # Execute the script to load the class
        script_globals = types.ModuleType(
            "temp_exporter_module"
        )  # Create empty module to act as the script's globals
        exec(
            script_text, script_globals.__dict__
        )  # Script will load the class, which we can find in the globals

        # Find the mappings field in the globals, which should map a human-readable name to each function
        exporter_mappings = getattr(script_globals, "mappings", None)
        if exporter_mappings is None:
            logger.error(
                "Play data exporter for widget '%s' (%s) is invalid!"
                "\n - Missing top level dict object named 'mappings'.",
                self.name,
                self.id,
            )
            raise MsgFailure(
                msg="Play data exporter script is invalid; missing 'mappings' dict"
            )

        # Cache these methods for re-use later
        Widget.playdata_exporter_methods = exporter_mappings

        return exporter_mappings

    def _make_relative_widget_path(self, script: str) -> str:
        script_path = os.path.join(settings.DIRS["widgets"], self.dir, script)
        return script_path

    class Meta:
        db_table = "widget"
        indexes = [
            models.Index(fields=["clean_name"], name="widget_clean_name"),
            models.Index(fields=["in_catalog"], name="widget_in_catalog"),
        ]


class WidgetInstance(models.Model):
    id = models.CharField(primary_key=True, max_length=10, db_collation="utf8_bin")
    widget = models.ForeignKey(
        "Widget",
        related_name="instances",
        on_delete=models.PROTECT,
        db_column="widget_id",
    )
    user = models.ForeignKey(
        User,
        related_name="created_instances",
        on_delete=models.PROTECT,
        db_column="user_id",
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(default=timezone.now)
    name = models.CharField(max_length=100)
    is_draft = models.BooleanField(default=False)
    height = models.IntegerField(default=0)
    width = models.IntegerField(default=0)
    open_at = models.DateTimeField(default=None, null=True)
    close_at = models.DateTimeField(default=None, null=True)
    attempts = models.IntegerField(default=-1)
    is_deleted = models.BooleanField(default=False)
    guest_access = models.BooleanField(default=False)
    is_student_made = models.BooleanField(default=False)
    updated_at = models.DateTimeField(default=None, null=True)
    embedded_only = models.BooleanField(default=False)
    published_by = models.ForeignKey(
        User,
        related_name="published_instances",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        db_column="published_by",
    )
    permissions = GenericRelation(ObjectPermission)

    @property
    def dir(self):
        return f"{self.id}-{self.clean_name}{os.sep}"

    def attempts_left_for_user(self, user: User, context: str = ""):
        from core.services.semester_service import SemesterService

        # short-circuit for guest users
        if isinstance(user, AnonymousUser):
            return -1

        semester = SemesterService.get_current_semester()
        attempts_used = LogPlay.objects.filter(
            user=user,
            instance=self,
            context_id=context,
            semester=semester,
            is_complete=True,
        ).count()

        # Check to see if any extra attempts have been provided to the context. Decrement attempts_used if so.
        extra_attempts_ref = UserExtraAttempts.objects.filter(
            user=user,
            instance=self,
            context_id=context,
            semester=semester.id,
        ).first()

        extra_attempts = (
            0 if extra_attempts_ref is None else extra_attempts_ref.extra_attempts
        )

        attempts_used -= extra_attempts

        return -1 if self.attempts == -1 else self.attempts - attempts_used

    def user_has_attempts(self, user: User, context: str = ""):
        attempts_left = self.attempts_left_for_user(user, context)

        return self.attempts == -1 or attempts_left > 0

    def availability_status(self):
        now = timezone.now()
        start = self.open_at
        end = self.close_at

        does_open = start is not None
        does_close = end is not None
        always_open = not does_open and not does_close
        will_open = does_open and start > now
        will_close = does_close and end > now
        is_open = always_open or (
            (not does_open or start < now) and (will_close or not does_close)
        )
        is_closed = not always_open and (does_close and end < now)

        return {
            "is_open": is_open,
            "is_closed": is_closed,
            "does_open": does_open,
            "does_close": does_close,
            "will_open": will_open,
            "will_close": will_close,
            "always_open": always_open,
        }

    def create_qset(self, data, version=None):
        qset = WidgetQset(
            instance=self,
            data=data,
            version=version or 1,
        )
        qset.save()

    def get_latest_qset(self) -> WidgetQset | None:
        return self.qsets.order_by("-created_at").first()

    def get_qset_for_play(self, play_id=None, is_preview=False):
        if play_id and not is_preview:
            play = LogPlay.objects.get(id=play_id)  # this will fail if we are a preview
            return (
                self.qsets.filter(created_at__lte=play.created_at)
                .order_by("-created_at")
                .first()
            )
        return self.get_latest_qset()

    def playable_by_current_user(self, user: User | AnonymousUser):
        return self.guest_access or user.is_authenticated

    def editable_by_current_user(self, user: User | AnonymousUser):
        if isinstance(user, AnonymousUser):
            return False
        return self.permissions.filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()),
            user=user,
            permission=ObjectPermission.PERMISSION_FULL,
        ).exists()

    def save(self, *args, **kwargs):
        # No user or permissions checks are checked here.
        # It is up to the endpoint itself to enforce permissions, etc.

        is_new = not ValidatorUtil.is_valid_hash(self.id)
        success = False

        # ADDING A NEW INSTANCE
        if is_new:
            from core.utils.hash_util import HashUtil

            tries = (
                3  # try this many times to generate an instance ID to avoid collisions
            )
            while not success:
                tries = tries - 1
                if tries < 0:
                    raise Exception("Unable to save new widget instance")
                self.published_by = None if self.is_draft else self.user
                try:
                    hash = HashUtil.generate_key_hash()
                    self.id = hash
                    self.created_at = timezone.now()
                    super().save(*args, **kwargs)
                    success = True
                except DatabaseError as e:
                    logger.info(e, exc_info=True)
                    # try again until the retries run out

        # UPDATING AN EXISTING INSTANCE
        else:
            self.updated_at = timezone.now()
            super().save(*args, **kwargs)

        return

    def get_qset_history(self) -> QuerySet["WidgetQset"]:
        qsets = WidgetQset.objects.filter(instance=self).order_by("-created_at")
        return qsets

    def duplicate(
        self, owner: User, new_name: str, copy_existing_perms: bool = False
    ) -> Self:
        dupe = WidgetInstance.objects.get(pk=self.pk)

        # Set this instance as a duplicate
        dupe.pk = None
        dupe._state.adding = True

        # Update name, if not empty
        if new_name:
            dupe.name = new_name

        # Set new owner to user requesting the copy
        dupe.user = owner

        # These fields should default to False for new instances (since the new instance won't have any play history)
        dupe.embedded_only = False

        # Manually update created_at
        dupe.created_at = timezone.now()

        # If original widget is student made, verify that the new user is a student or not.
        if dupe.is_student_made:
            can_new_owner_author = PermService.does_user_have_roles(
                owner, ["author", "superuser"]
            )
            if can_new_owner_author:
                dupe.is_student_made = False

        # Store instance
        dupe.save()

        # Create a duplicate qset that points to this instance
        dupe_qset = self.get_latest_qset()
        dupe_qset.pk = None
        dupe_qset._state.adding = True
        dupe_qset.instance = dupe
        dupe_qset.save()

        # Copy perms, if requested
        if copy_existing_perms:
            existing_perms = self.permissions.all()
            for existing_perm in existing_perms:
                dupe.permissions.create(
                    user=existing_perm.user,
                    permission=existing_perm.permission,
                    expires_at=existing_perm.expires_at,
                )

        # Otherwise, just give the requesting user FULL perms to this dupe
        else:
            dupe.permissions.create(
                user=owner, permission=ObjectPermission.PERMISSION_FULL, expires_at=None
            )

        return dupe

    def get_play_logs(self, semester=None, year=None, context_ids=None):
        """
        Returns a filtered queryset of play logs for the current instance
        Accepts semester, year, and context ID.
        All filters are applied combinatorially - if multiple filters are provided,
        they will all be applied together.
        """
        queryset = (
            self.play_logs.all()
            .select_related("semester", "user")
            .order_by("-created_at")
        )

        # treat "all" as None
        semester = None if semester == "all" else semester
        year = None if year == "all" else year

        # Apply context_ids filter if provided
        if context_ids:
            queryset = queryset.filter(context_id__in=context_ids)

        # Apply semester and year filters if provided
        if semester and year:
            date = DateRange.objects.filter(semester=semester, year=year).first()
            queryset = queryset.filter(semester=date)

        elif year and not semester:
            semesters = DateRange.objects.filter(year=year)
            queryset = queryset.filter(semester__in=semesters)

        elif semester and not year:
            semesters = DateRange.objects.filter(
                semester=semester, year=timezone.now().year
            )
            queryset = queryset.filter(semester__in=semesters)

        return queryset

    def get_play_logs_for_user(self, user, semester=None, year=None):
        perms = self.permissions.filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()),
            user=user,
        )

        if not perms.exists() and not PermService.is_superuser_or_elevated(user):
            return LogPlay.objects.none()

        contexts = [perm.context_id for perm in perms if perm.context_id is not None]

        if not contexts:
            contexts = None

        return self.get_play_logs(semester=semester, year=year, context_ids=contexts)

    @property
    def play_url(self):
        return f"{settings.URLS['BASE_URL']}play/{self.id}/{slugify(self.name)}/"

    @property
    def preview_url(self):
        return f"{settings.URLS['BASE_URL']}preview/{self.id}/{slugify(self.name)}/"

    @property
    def embed_url(self):
        if self.is_draft:
            return None
        return f"{settings.URLS['BASE_URL']}embed/{self.id}/{slugify(self.name)}/"

    @property
    def is_embedded(self):
        return self.lti_embeds.count() > 0

    @classproperty
    def content_type(cls):
        return ContentType.objects.get_for_model(cls)

    class Meta:
        db_table = "widget_instance"
        indexes = [
            models.Index(fields=["created_at"], name="widget_instance_created_at"),
            models.Index(fields=["is_draft"], name="widget_instance_is_draft"),
            models.Index(fields=["is_deleted"], name="widget_instance_is_deleted"),
        ]


class WidgetQset(models.Model):
    id = models.BigAutoField(primary_key=True)
    instance = models.ForeignKey(
        "WidgetInstance",
        related_name="qsets",
        on_delete=models.PROTECT,
        db_column="inst_id",
    )
    created_at = models.DateTimeField(default=timezone.now)
    data = models.TextField(db_column="data")
    version = models.CharField(max_length=10, blank=True, null=True)

    def get_data(self) -> dict:
        return Base64Util.decode(self.data)

    def set_data(self, data_dict: dict):
        self.data = Base64Util.encode(data_dict)

    def process_and_create_questions(self) -> list[Question]:
        """
        Older versions of Materia will not have Question model instances associated with a qset
        In this case, we unpack the qset, traverse it to identify individual questions, and create new question
        instances.
        This method will effectively be invoked once per qset at most,
        as subsequent requests for questions will be able to use the ORM
        """

        def find_questions(source):
            questions = []

            if isinstance(source, list):
                for item in source:
                    if Question.is_question(item):
                        questions.append(item)
                    else:
                        questions += find_questions(item)

            elif isinstance(source, dict):
                if Question.is_question(source):
                    questions.append(source)
                else:
                    for key, value in source.items():
                        if Question.is_question(value):
                            questions.append(value)
                        else:
                            questions += find_questions(value)
            else:
                return []

            return questions

        decoded_data = Base64Util.decode(self.data)
        questions = find_questions(decoded_data)
        questions_set = []
        for question in questions:
            new_question = Question(
                type=self.instance.widget,
                data=question,
                qset=self,
                item_id=question["id"] if question.get("id", None) is not None else "",
            )
            new_question.save()
            questions_set.append(new_question)

        return questions_set

    def get_questions(self) -> list[Question]:
        questions = self.questions.all()
        if questions.exists():
            return list(questions)
        else:
            return self.process_and_create_questions()

    def apply_ids_to_questions(self, qset):
        """
        Individual questions within qsets should be submitted with null ids
        Historically we've relied on Materia to provision ids to them
        before being committed to the database

        Note that in cases where a new qset is being saved for an
        existing widget, previously saved questions will already have uuids
        provisioned.
        """
        import copy
        import uuid

        def _assign_item_id_if_empty(item):
            if "id" in item and (
                item["id"] is None or item["id"] == 0 or item["id"] == ""
            ):
                item["id"] = str(uuid.uuid4())

        def _process_item(item, parent_key=None):
            if isinstance(item, list):
                return [_process_item(element, parent_key) for element in item]

            if isinstance(item, dict):
                result = copy.deepcopy(item)

                if Question.is_question(result) or parent_key == "answers":
                    _assign_item_id_if_empty(result)

                for key, value in result.items():
                    if isinstance(value, (dict, list)):
                        result[key] = _process_item(value, key)

                return result

            return item

        result = _process_item(qset)
        return result

    def save(self, *args, **kwargs):

        decoded = self.get_data()
        applied_ids = self.apply_ids_to_questions(decoded)
        self.set_data(applied_ids)

        super().save(*args, **kwargs)

        self.process_and_create_questions()

    @staticmethod
    def find_item_with_id(decoded, item_id):
        import copy

        def _process_item(item):
            if isinstance(item, list):
                for element in item:
                    result = _process_item(element)
                    if result is not None:
                        return result

            elif isinstance(item, dict):
                copied_item = copy.deepcopy(item)

                if Question.is_question(copied_item):
                    if copied_item.get("id") == item_id:
                        return copied_item

                for value in copied_item.values():
                    if isinstance(value, (dict, list)):
                        result = _process_item(value)
                        if result is not None:
                            return result
            return None

        return _process_item(decoded)

    class Meta:
        db_table = "widget_qset"
        indexes = [
            models.Index(fields=["created_at"], name="widget_qset_created_at"),
        ]


class UserSettings(models.Model):

    DEFAULT_PROFILE_FIELDS = {"useGravatar": True, "theme": "light"}

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profile_settings"
    )
    profile_fields = models.JSONField(default=dict)

    def set_profile_fields(self, key, value):
        self.profile_fields[key] = value
        self.save()

    def get_profile_fields(self):
        if not self.profile_fields:
            self.initialize_profile_fields()

        # prior versions of Materia used darkMode instead of theme. Replace the value if present.
        if "darkMode" in self.profile_fields:
            updated_fields = {**self.profile_fields}
            updated_fields["theme"] = "dark" if updated_fields["darkMode"] else "light"
            del updated_fields["darkMode"]
            self.profile_fields = updated_fields
            self.save()

        return self.profile_fields

    def initialize_profile_fields(self):
        self.profile_fields = {**self.DEFAULT_PROFILE_FIELDS}
        self.save()


@receiver(post_save, sender=User)
def create_user_settings(sender, instance, created, **kwargs):
    if created:
        settings = UserSettings.objects.create(user=instance)
        settings.initialize_profile_fields()


@receiver(post_save, sender=User)
def save_user_settings(sender, instance, **kwargs):
    instance.profile_settings.save()
