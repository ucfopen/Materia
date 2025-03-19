# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
import base64
import json
import logging
import os
from datetime import datetime

from django.contrib.auth.models import User
from django.core import serializers
from django.db import models, transaction
from django.utils.timezone import make_aware
from django.utils.translation import gettext_lazy

from util.perm_manager import PermManager
from util.serialization import SerializableModel
from util.widget.validator import ValidatorUtil

from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger("django")


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
    created_at = models.DateTimeField(default=datetime.now)
    title = models.CharField(max_length=300, default="")
    file_size = models.IntegerField(default=0)
    deleted_at = models.DateTimeField(default=None, null=True)
    is_deleted = models.BooleanField(default=False)

    def is_valid(self):
        from util.widget.validator import ValidatorUtil

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
        from util.widget.instance.hash import WidgetInstanceHash

        asset_id = None

        # try 10 times to get an unused asset ID
        for i in range(10):
            try_id = WidgetInstanceHash.generate_key_hash()
            try:
                Asset.objects.get(id=try_id)
                continue
            except Asset.DoesNotExist:
                asset_id = try_id
                break

        return asset_id

    # TODO: make this more Django-y
    def db_store(self, user=None):
        from core.models import PermObjectToUser
        from django.utils.timezone import make_aware
        from util.widget.validator import ValidatorUtil

        if ValidatorUtil.is_valid_hash(self.id) and not bool(self.file_type):
            return False
        asset_id = Asset.get_unused_id()
        if not bool(asset_id):
            return False
        try:
            with transaction.atomic():
                self.id = asset_id
                self.created_at = make_aware(datetime.now())
                self.save()

                p = PermObjectToUser()
                p.object_id = asset_id
                p.user = user
                p.perm = PermObjectToUser.Perm.FULL
                p.object_type = PermObjectToUser.ObjectType.ASSET
                p.save()

            return True

        except Exception as e:
            logger.error(
                "The following exception occurred while attempting to store an asset:"
            )
            logger.error(e)
            return False

    def db_remove(self):
        if len(str(self.id)) == 0:
            return False

        try:
            with transaction.atomic():
                self.delete()
                try:
                    ad_obj = AssetData.objects.get(id=self.id)
                    ad_obj.delete()
                except AssetData.DoesNotExist:
                    pass
                for perm in PermObjectToUser.objects.filter(
                        object_id=self.id, object_type=PermObjectToUser.ObjectType.ASSET
                ):
                    perm.delete()
            self = Asset()
            return True

        except Exception as e:
            logger.error(
                "The following exception occurred while attempting to remove an asset:"
            )
            logger.error(e)
            return False

    def upload_asset_data(self, source_asset_path):
        # TODO: come back to this later and allow for DB or S3 bucket media storage
        from storage.file import FileStorageDriver

        FileStorageDriver.store(self, source_asset_path, "original")

    class Meta:
        db_table = "asset"


# Revisit this later - either it sticks in the new version or is replaced with something Django-y
# Rebuild the FuelPHP version locally using the DB storage driver for assets, see what goes in here
# Maybe come up with a process to pull binaries out of this table and write them to disk somewhere?
# BIG WARNING: we (UCF) do not use this, we have no idea if any of this is even viable
class AssetData(models.Model):
    # This model is not used in the application. The table is empty.
    id = models.CharField(primary_key=True, max_length=10, db_collation="utf8_bin")
    type = models.CharField(max_length=10)
    status = models.CharField(max_length=20)
    size = models.CharField(max_length=20)
    bytes = models.IntegerField()  # consider using db_column to change the name
    hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=datetime.now)
    data = models.TextField()

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
    start_at = models.DateTimeField(default=datetime.now)
    end_at = models.DateTimeField(default=datetime.now)

    class Meta:
        db_table = "date_range"
        constraints = [
            models.UniqueConstraint(
                fields=["semester", "year", "start_at", "end_at"],
                name="date_range_main",
            ),
        ]


class Log(SerializableModel):
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
    created_at = models.DateTimeField(default=datetime.now)
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
    created_at = models.DateTimeField(default=datetime.now)
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
    created_at = models.DateTimeField(default=datetime.now)
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
    environment_data = models.TextField()
    auth = models.CharField(max_length=3, choices=AUTH_CHOICES)
    referrer_url = models.CharField(max_length=255)
    context_id = models.CharField(max_length=255)
    semester = models.ForeignKey(
        DateRange,
        related_name="play_logs",
        on_delete=models.PROTECT,
        db_column="semester_id",
    )

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
    created_at = models.DateTimeField(default=datetime.now)
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
    consumer = models.CharField(max_length=255)
    consumer_guid = models.CharField(max_length=255)
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
    created_at = models.DateTimeField(default=datetime.now)
    updated_at = models.DateTimeField(default=datetime.now)

    class Meta:
        db_table = "lti"
        indexes = [
            models.Index(fields=["resource_link"], name="lti_resource_link"),
            models.Index(fields=["consumer_guid"], name="lti_consumer_guid"),
        ]


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


# Convert to be a through model for a many-to-many relationship between Question and WidgetQset
# models ignoring related_names on foreign keys for now as it probably won't be used in this way
class MapQuestionToQset(models.Model):
    id = models.BigAutoField(primary_key=True)
    qset = models.ForeignKey(
        "WidgetQset", on_delete=models.PROTECT, db_column="qset_id"
    )
    question = models.ForeignKey(
        "Question", on_delete=models.PROTECT, db_column="question_id"
    )

    class Meta:
        db_table = "map_question_to_qset"


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
    # is_email_sent = models.CharField(max_length=1)  # convert to boolean field
    is_email_sent = models.BooleanField()  # was previously CharField, enum in DB
    created_at = models.DateTimeField(default=datetime.now)
    subject = models.CharField(max_length=511)
    # consider deleting this column & pulling the avatar from relevant user metadata just in time
    avatar = models.CharField(max_length=511)
    updated_at = models.DateTimeField(default=datetime.now, null=True)
    action = models.CharField(max_length=255)

    class Meta:
        db_table = "notification"
        indexes = [
            models.Index(fields=["is_email_sent"], name="notification_is_email_sent"),
            models.Index(fields=["to_id"], name="notification_to_id"),
            models.Index(fields=["from_id"], name="notification_from_id"),
            models.Index(fields=["item_type"], name="notification_item_type"),
        ]


# We may want to use Django's built-in permissions and roles system instead of these perm models.
# Will need a migration plan for them potential foreign key relationship re: object_id, object_type
# for assets, questions, and widget instances
class PermObjectToUser(models.Model):
    # historically unused options commented out for now
    class Perm(models.IntegerChoices):
        VISIBLE = 1, gettext_lazy("Can see object and view scores")
        # PLAY = 5, gettext_lazy("Can play object")
        # SCORE = 10, gettext_lazy("Can receive a score for object")
        # DATA = 15, gettext_lazy("Can see logs for object")
        # EDIT = 20, gettext_lazy("Can edit the object")
        # COPY = 25, gettext_lazy("Can copy the object")
        FULL = 30, gettext_lazy("Full access to object")
        # SHARE = 35, gettext_lazy("Can share rights to object with another user")

    class ObjectType(models.IntegerChoices):
        QUESTION = 1, gettext_lazy("Question")
        ASSET = 2, gettext_lazy("Media asset")
        WIDGET = 3, gettext_lazy("Widget engine")
        INSTANCE = 4, gettext_lazy("Widget instance")

    # Needs primary key
    id = models.BigAutoField(primary_key=True)
    # appears to be a generic relationship combined with object_type
    object_id = models.CharField(max_length=10, db_collation="utf8_bin")
    user = models.ForeignKey(
        User,
        related_name="object_permissions",
        on_delete=models.SET_NULL,
        db_column="user_id",
        blank=True,
        null=True,
    )
    perm = models.IntegerField(choices=Perm.choices)
    # appears to be a generic relationship combined with object_type
    object_type = models.IntegerField(choices=ObjectType.choices)
    # will be auto-nulled when the expiration date elapses
    expires_at = models.DateTimeField(default=None, null=True)

    class Meta:
        db_table = "perm_object_to_user"
        constraints = [
            models.UniqueConstraint(
                fields=["object_id", "user_id", "perm", "object_type"],
                name="perm_object_to_user_main",
            ),
        ]


class Question(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        related_name="questions",
        on_delete=models.PROTECT,
        db_column="user_id",
        blank=True,
        null=True,
    )
    type = models.CharField(max_length=255)  # type is a "soft" reserved word in Python
    text = models.TextField()
    created_at = models.DateTimeField(default=datetime.now)
    data = models.TextField(blank=True, null=True)
    hash = models.CharField(unique=True, max_length=32)
    qset = models.ManyToManyField(
        "WidgetQset", through=MapQuestionToQset, related_name="questions"
    )

    class Meta:
        db_table = "question"
        indexes = [
            models.Index(fields=["hash"], name="question_hash"),
            models.Index(fields=["type"], name="question_type"),
        ]


class UserExtraAttempts(models.Model):
    # Needs primary key
    inst_id = models.CharField(
        max_length=100, db_collation="utf8_bin"
    )  # foreign key to WidgetInstance model
    user_id = models.PositiveBigIntegerField()  # foreign key to Users model
    created_at = models.DateTimeField(default=datetime.now)
    extra_attempts = models.IntegerField()
    context_id = models.CharField(max_length=255)
    semester = models.PositiveBigIntegerField()  # foreign key to DateRange model

    class Meta:
        db_table = "user_extra_attempts"
        indexes = [
            models.Index(fields=["user_id"], name="user_extra_attempts_user_id"),
            models.Index(fields=["inst_id"], name="user_extra_attempts_inst_id"),
        ]


class Widget(SerializableModel):
    # update these to the relevant paths when those Python files exist
    PATHS_PLAYDATA = os.path.join("_exports", "playdata_exporters.php")
    PATHS_SCOREMOD = os.path.join("_score-modules", "score_module.php")

    SCORE_TYPE_CHOICES = [
        ("SERVER", "widget is scored on the server"),
        ("CLIENT", "widget is scored on the client"),
        ("SERVER-CLIENT", "widget is partially scored in both server and client"),
    ]

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255, default="")
    created_at = models.DateTimeField(default=datetime.now)
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

    def as_dict(self, select_fields: list[str] = None, serialize_fks: list[str] = None):
        result = super().as_dict(select_fields, serialize_fks)
        result["dir"] = f"{self.id}-{self.clean_name}{os.sep}"
        result["meta_data"] = self.metadata_clean()
        return result

    def metadata_clean(self):
        meta_raw = self.metadata.all()
        meta_final = {}
        for meta in meta_raw:
            # special checks for metadata values that need to be tracked in lists
            if meta.name in ["features", "supported_data", "playdata_exporters"]:
                # initialize the list if needed
                if meta.name not in meta_final:
                    meta_final[meta.name] = []
                meta_final[meta.name].append(meta.value)
            else:
                meta_final[meta.name] = meta.value
        # set the 'meta_data' property of this Widget object for potential future reads
        self.meta_data = meta_final
        return self.meta_data

    def publishable_by(self, user: User) -> bool:
        if not self.restrict_publish:
            return True
        return not PermManager.user_is_student(user)


    @staticmethod
    def make_clean_name(name):
        return name.replace(" ", "-").lower()

    @staticmethod
    def load_script(script_path):
        if not os.path.isfile(script_path):
            raise Exception(f"Script not found: {script_path}")
        # okay so this is kind of a weird one
        # in PHP this function would open the file at the given path
        #  and 'include' it - basically the same as importing it and
        #  making all of its classes/methods/etc. available in the
        #  scope in which this function is run
        #

    """
    public static function load_script(string $script_path)
    {
        // closure helps to prevent the script poluting this and isolate scope
        // in within the included script
        $load_safer = function($file)
        {
            if ( ! file_exists($file))
            {
                trace("Script not found: {$file}");
                return [];
            }

            return include($file);
        };

        return $load_safer($script_path);
    }
    """

    class Meta:
        db_table = "widget"
        indexes = [
            models.Index(fields=["clean_name"], name="widget_clean_name"),
            models.Index(fields=["in_catalog"], name="widget_in_catalog"),
        ]


class WidgetInstance(SerializableModel):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._qset = None

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
    created_at = models.DateTimeField(default=datetime.now)
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

    # TODO: re-evaluate this - it makes widget instance creation kind of inconvenient
    # at least with the existing approach
    @property
    def qset(self):
        if self._qset is None:
            try:
                self._qset = WidgetQset.objects.filter(instance=self).latest("created_at")
            except WidgetQset.DoesNotExist:
                self._qset = WidgetQset(version=None, data=None, instance=self)
        return self._qset

    @qset.setter
    def qset(self, new_qset):
        if type(new_qset) is WidgetQset:
            self._qset = new_qset
        elif type(new_qset) is dict:
            self._qset = WidgetQset(version=new_qset["version"], data=new_qset["data"], instance=self)
        else:
            logger.error(f"Invalid qset type passed into setter: {type(new_qset)}")

    def playable_by_current_user(self, user: User):
        return self.widget.is_playable and (user.is_authenticated or self.guest_access)

    def save(self, *args, **kwargs):
        # check for requirements
        # TODO: this requires a user check, revisit later
        # if not self.is_draft and not self.widget.publishable_by(user):
        #     return False
        is_new = not ValidatorUtil.is_valid_hash(self.id)
        success = False

        # ADDING A NEW INSTANCE
        if is_new:
            from util.widget.instance.hash import WidgetInstanceHash

            # try this many times to generate an instance ID to avoid collisions
            tries = 3

            while not success:
                tries = tries - 1
                if tries < 0:
                    raise Exception("Unable to save new widget instance")
                # TODO: figure users out
                # self.published_by = None if self.is_draft else user

                try:
                    hash = WidgetInstanceHash.generate_key_hash()
                    self.id = hash
                    self.created_at = make_aware(datetime.now())
                    super().save(*args, **kwargs)
                    self.qset.save()
                    success = True
                # TODO: use a more specific exception
                except Exception as e:
                    logger.info(e)
                    # try again until the retries run out
            # success must be true to get here
            # TODO: give the current user perms to this instance, however that works
            # Perm_Manager::set_user_object_perms($hash, Perm::INSTANCE, $this->user_id, [Perm::FULL => Perm::ENABLE]);

        # UPDATING AN EXISTING INSTANCE
        else:
            new_publisher = self.published_by
            if not new_publisher and not self.is_draft:
                # TODO: figure users out
                # new_publisher = user
                pass

            self.published_by = new_publisher
            self.updated_at = make_aware(datetime.now())
            super().save(*args, **kwargs)
            self.qset.save()
            # ^ If qset is a whole new object, it'll be saved as a new object.
            #   Otherwise, it'll just save the current qset.

            # TODO: originally this was meant to check if the number of rows affected by the 'update' query
            # is greater than zero - may make more sense to try/except this to check for failures?
            success = True

        # historically this is where we would save the qset
        # due to the way foreign key relationships etc. work the qset isn't really an arbitrary object
        #  that we can do with as we please any more, so the qset relationship and maintenance should
        #  probably happen outside of this function

        # TODO: figure users out
        # activity = LogActivity()
        # activity.user_id = user.id
        # activity.type = LogActivity.TYPE_CREATE_WIDGET if is_new else LogActivity.TYPE_EDIT_WIDGET
        # item_id = self.id
        # value_1 = self.name
        # value_2 = self.widget.id
        # activity.save()

        return success

    class Meta:
        db_table = "widget_instance"
        indexes = [
            models.Index(fields=["created_at"], name="widget_instance_created_at"),
            models.Index(fields=["is_draft"], name="widget_instance_is_draft"),
            models.Index(fields=["is_deleted"], name="widget_instance_is_deleted"),
        ]


class WidgetMetadata(models.Model):
    id = models.BigAutoField(primary_key=True)
    widget = models.ForeignKey(
        "Widget",
        related_name="metadata",
        on_delete=models.PROTECT,
        db_column="widget_id",
    )
    name = models.CharField(max_length=255)
    value = models.TextField()

    class Meta:
        db_table = "widget_metadata"


class WidgetQset(SerializableModel):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._data_dict: dict | None = None
        if hasattr(self, "_data") and self._data:  # Loaded from DB
            self._data_dict = self._decode_data()
        elif "data" in kwargs:  # Initializing new instance from Python
            self._data_dict = kwargs["data"]

    id = models.BigAutoField(primary_key=True)
    instance = models.ForeignKey(
        "WidgetInstance",
        related_name="qsets",
        on_delete=models.PROTECT,
        db_column="inst_id",
    )
    created_at = models.DateTimeField(default=datetime.now)
    _data = models.TextField(db_column="data")
    version = models.CharField(max_length=10, blank=True, null=True)

    @property
    def data(self):
        # Return self as a dict
        if self._data_dict is None:
            self._data_dict = self._decode_data()
        return self._data_dict

    @data.setter
    def data(self, new_data):
        self._data_dict = new_data

    def save(self, *args, **kwargs):
        try:
            # preserve the qset data, save with no data to reserve an ID while we do transformation and encoding
            # this... may be unnecessary?
            self.version = self.version if self.version else 0
            self._data = ""
            self.created_at = make_aware(datetime.now())
            super().save(*args, **kwargs)

            # at this point we used to convert the qset to an associative array so we could go through it and
            #  identify questions, then save those as separate database entities
            # Python doesn't have associative arrays, so we're going to have to overhaul that process
            # just skip it for now
            # questions = self.find_questions()

            self._data = self._encode_data()
            super().save(*args, **kwargs)

            # redo this when find_questions is rewritten
            # or just have find_questions do the saving?
            # for q in questions:
            #     q.db_store(self.id)

            return True
        except Exception:
            logger.info("Could not save qset")
            logger.exception("")

        return False

    # TODO: implement this, old code below
    def find_questions(self):
        pass

    # TODO: find the assets!!!
    # Widget_Asset_Manager::register_assets_to_item(Widget_Asset::MAP_TYPE_QSET, $qset_id, $recursiveQGroup->assets);
    # public static function find_questions(&$source, $create_ids=false, &$questions=[])
    # {
    #     if (is_array($source))
    #     {
    #         foreach ($source as $key => &$q)
    #         {
    #             if (self::is_question($q))
    #             {
    #                 $json = json_encode($q);

    #                 $real_q = Widget_Question::forge()->from_json($json);

    #                 // new question sets need ids
    #                 if ($create_ids)
    #                 {
    #                     if (empty($real_q->id)) $real_q->id = \Str::random('uuid');
    #                     foreach ($real_q->answers as &$a)
    #                     {
    #                         if (empty($a['id'])) $a['id'] = \Str::random('uuid');
    #                     }
    #                     $source[$key] = json_decode(json_encode($real_q), true);
    #                 }
    #                 if ($real_q->id)	$questions[$real_q->id] = $real_q;
    #                 else $questions[] = $real_q;
    #             }
    #             elseif (is_array($q))
    #             {
    #                 // INCEPTION TIME!!
    #                 self::find_questions($q, $create_ids, $questions);
    #             }
    #         }
    #     }
    #     return $questions;
    # }

    def _decode_data(self) -> dict:
        result = str(self._data)  # Might be loaded as a bytes object, not str
        # TODO determine if we need to conditionally check for b'...' wrapper around qset data blob
        # Remove the b' ... ' that appears when stringifying the bytes object
        if result.startswith("b'") and result.endswith("'"):
            result = result[2:-1]

        if result:  # Make sure it's not an empty string or some other falsy object
            decoded_qset_data = base64.b64decode(result).decode("utf-8")
            result = json.loads(decoded_qset_data)
        else:
            result = {}
        return result

    def _encode_data(self) -> str:
        return base64.b64encode(json.dumps(self.data).encode("utf-8")).decode("utf-8")

    class Meta:
        db_table = "widget_qset"
        indexes = [
            models.Index(fields=["created_at"], name="widget_qset_created_at"),
        ]


class UserSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile_settings")
    profile_fields = models.JSONField(default=dict)


    def set_profile_fields(self, key, value):
        self.profile_fields[key] = value
        self.save()


    def get_profile_fields(self):
        return self.profile_fields

@receiver(post_save, sender=User)
def create_user_settings(sender, instance, created, **kwargs):
    if created:
        UserSettings.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_settings(sender, instance, **kwargs):
    instance.profile_settings.save()
