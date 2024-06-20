# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
from django.utils.translation import gettext_lazy

from datetime import datetime
from django.contrib.auth.models import User


class Asset(models.Model):
    id = models.CharField(primary_key=True, max_length=10, db_collation="utf8_bin")
    file_type = models.CharField(max_length=10)
    created_at = models.IntegerField()
    title = models.CharField(max_length=300)
    file_size = models.IntegerField()
    deleted_at = models.IntegerField()  # consider converting to nullable date field
    is_deleted = models.CharField(max_length=1)  # convert to boolean field

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
    created_at = models.IntegerField()
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
    PERM_CHOICES = [
        (1, "visible/view scores"),
        (30, "full"),
        (85, "support user"),
        (90, "super user"),
    ]
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
    perm = models.IntegerField(choices=PERM_CHOICES)
    # appears to be a generic relationship combined with object_type
    object_type = models.IntegerField()
    # will be auto-nulled when the expiration date elapses
    expires_at = models.DateTimeField(default=datetime.now, null=True)

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
        null=True
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
    created_at = models.IntegerField()
    extra_attempts = models.IntegerField()
    context_id = models.CharField(max_length=255)
    semester = models.PositiveBigIntegerField()  # foreign key to DateRange model

    class Meta:
        db_table = "user_extra_attempts"
        indexes = [
            models.Index(fields=["user_id"], name="user_extra_attempts_user_id"),
            models.Index(fields=["inst_id"], name="user_extra_attempts_inst_id"),
        ]


class Widget(models.Model):
    SCORE_TYPE_CHOICES = [
        ("SERVER", "widget is scored on the server"),
        ("CLIENT", "widget is scored on the client"),
        ("SERVER-CLIENT", "widget is partially scored in both server and client"),
    ]

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    created_at = models.PositiveIntegerField()
    flash_version = models.PositiveIntegerField()
    height = models.PositiveSmallIntegerField()
    width = models.PositiveSmallIntegerField()
    is_scalable = models.BooleanField()  # previously varchar field, enum in db
    score_module = models.CharField(max_length=100)
    score_type = models.CharField(max_length=13, choices=SCORE_TYPE_CHOICES)
    is_qset_encrypted = models.BooleanField()  # previously varchar field, enum in db
    is_answer_encrypted = models.BooleanField()  # previously varchar field, enum in db
    is_storage_enabled = models.BooleanField()  # previously varchar field, enum in db
    is_editable = models.BooleanField()  # previously varchar field, enum in db
    is_playable = models.BooleanField()  # previously varchar field, enum in db
    is_scorable = models.BooleanField()  # previously varchar field, enum in db
    in_catalog = models.BooleanField()  # previously varchar field, enum in db
    creator = models.CharField(max_length=255)
    clean_name = models.CharField(max_length=255)
    player = models.CharField(max_length=255)
    api_version = models.IntegerField()
    package_hash = models.CharField(max_length=32, db_collation="utf8_bin")
    score_screen = models.CharField(max_length=255)
    restrict_publish = models.BooleanField()  # previously varchar field, enum in db
    creator_guide = models.CharField(max_length=255)
    player_guide = models.CharField(max_length=255)

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
    )
    created_at = models.IntegerField()
    name = models.CharField(max_length=100)
    is_draft = models.BooleanField()  # previously varchar field, enum in db
    height = models.IntegerField()
    width = models.IntegerField()
    open_at = models.IntegerField()
    close_at = models.IntegerField()
    attempts = models.IntegerField()
    is_deleted = models.BooleanField()  # previously varchar field, enum in db
    guest_access = models.BooleanField()  # previously varchar field, enum in db
    is_student_made = models.BooleanField()  # previously varchar field, enum in db
    updated_at = models.IntegerField()
    embedded_only = models.BooleanField()  # previously varchar field, enum in db
    published_by = models.ForeignKey(
        User,
        related_name="published_instances",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        db_column="published_by",
    )

    @property
    def qset(self):
        return self.qsets.latest()

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


class WidgetQset(models.Model):
    id = models.BigAutoField(primary_key=True)
    instance = models.ForeignKey(
        "WidgetInstance",
        related_name="qsets",
        on_delete=models.PROTECT,
        db_column="inst_id",
    )
    created_at = models.IntegerField()
    data = models.TextField()
    version = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        db_table = "widget_qset"
        indexes = [
            models.Index(fields=["created_at"], name="widget_qset_created_at"),
        ]
