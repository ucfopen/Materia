# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models

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

# revisit this later - either it sticks in the new version or is replaced with something Django-y
# rebuild the FuelPHP version locally using the DB storage driver for assets, see what goes in here
# possibly come up with a process to pull binaries out of this table and write them to disk somewhere?
class AssetData(
    models.Model
):  # This model is not used in the application. The table is empty.
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
            models.UniqueConstraint(fields=['id', 'size'], name='asset_data_main'),
        ]


class DateRange(models.Model):
    id = models.BigAutoField(primary_key=True)
    semester = models.CharField(max_length=255)
    year = models.IntegerField()
    start_at = models.IntegerField()  # consider converting to date field
    end_at = models.IntegerField()  # consider converting to date field

    # datetime fields to replace the unix timestamp integer fields above
    start_at_dt = models.DateTimeField(default=datetime.now())
    end_at_dt = models.DateTimeField(default=datetime.now())

    def start_at_datetime(self):
        from datetime import datetime
        return datetime.fromtimestamp(self.start_at)

    def end_at_datetime(self):
        from datetime import datetime
        return datetime.fromtimestamp(self.end_at)

    # do this in a migration
    # def convert_all():
    #     for dr in DateRange.objects.all():
    #         dr.start_at_dt = dr.start_at_datetime()
    #         dr.end_at_dt = dr.end_at_datetime()
    #         dr.save()

    class Meta:
        db_table = "date_range"
        constraints = [
            models.UniqueConstraint(fields=['semester', 'year', 'start_at', 'end_at'], name='date_range_main'),
        ]
        # unique_together = (("semester", "year", "start_at", "end_at"),)


class Log(models.Model):
    id = models.BigAutoField(primary_key=True)
    play_id = models.CharField(
        max_length=100, db_collation="utf8_bin"
    )  # consider converting to UUID field. Note: there appear to be some non-UUID values in the table
    type = models.CharField(
        max_length=26, blank=True, null=True
    )  # type is a "soft" reserved word in Python
    item_id = models.CharField(
        max_length=255
    ) # typically contains internal qset IDs for questions, may contain 0, may contain nothing
    text = models.TextField()
    value = models.CharField(max_length=255)
    created_at = models.IntegerField()  # consider converting to date field
    game_time = models.IntegerField()
    visible = models.BooleanField() # was previously CharField, enum in DB
    ip = models.CharField(max_length=20)

    created_at_dt = models.DateTimeField(default=datetime.now())

    class Meta:
        db_table = "log"

# this sucks
# re-engineer it to be useful and sensible
class LogActivity(models.Model):
    id = models.BigAutoField(primary_key=True)

    # user_id = models.PositiveBigIntegerField()  # convert to foreign key to Users model
    user_id = models.ForeignKey(
        User,
        related_name='activity_logs',
        on_delete=models.PROTECT
    )

    type = models.CharField(max_length=255)  # type is a "soft" reserved word in Python
    created_at = models.IntegerField()  # consider converting to date field
    item_id = models.CharField(
        max_length=100, db_collation="utf8_bin"
    )  # contains arbitrary values based on what 'type' of activity is being logged
    value_1 = models.CharField(max_length=255, blank=True, null=True)
    value_2 = models.CharField(max_length=255, blank=True, null=True)
    value_3 = models.CharField(max_length=255, blank=True, null=True)

    created_at_dt = models.DateTimeField(default=datetime.now())

    class Meta:
        db_table = "log_activity"


class LogPlay(models.Model):
    AUTH_CHOICES = {
        '': '',
        'lti': 'lti'
    }

    id = models.CharField(primary_key=True, max_length=100, db_collation="utf8_bin")
    inst_id = models.ForeignKey(
        'WidgetInstance',
        related_name='play_logs',
        on_delete=models.PROTECT
    )
    is_valid = models.BooleanField() # was previously CharField, enum in DB
    created_at = models.IntegerField()
    user_id = models.ForeignKey(
        User,
        related_name='play_logs',
        on_delete=models.PROTECT
    )
    ip = models.CharField(max_length=20)
    is_complete = models.BooleanField() # was previously CharField, enum in DB
    score = models.DecimalField(max_digits=52, decimal_places=2)
    score_possible = models.IntegerField()
    percent = models.FloatField()
    elapsed = models.IntegerField()
    qset_id = models.ForeignKey(
        'WidgetQset',
        related_name='play_logs',
        on_delete=models.PROTECT
    )
    environment_data = models.TextField()
    auth = models.CharField(
        max_length=100,
        choices=AUTH_CHOICES
    )
    referrer_url = models.CharField(max_length=255)
    context_id = models.CharField(max_length=255)
    semester = models.ForeignKey(
        DateRange,
        related_name='play_logs',
        on_delete=models.PROTECT,
        db_column='semester'
    )

    created_at_dt = models.DateTimeField(default=datetime.now())

    class Meta:
        db_table = "log_play"


class LogStorage(models.Model):
    id = models.BigAutoField(primary_key=True)
    inst_id = models.ForeignKey(
        'WidgetInstance',
        related_name='storage_logs',
        on_delete=models.PROTECT
    )
    play_id = models.ForeignKey(
        LogPlay,
        related_name='storage_logs',
        on_delete=models.PROTECT
    )
    user_id = models.ForeignKey(
        User,
        related_name='storage_logs',
        on_delete=models.PROTECT
    )
    created_at = models.PositiveIntegerField()
    name = models.CharField(max_length=64)
    data = models.TextField()

    created_at_dt = models.DateTimeField(default=datetime.now())

    class Meta:
        db_table = "log_storage"


class Lti(models.Model):
    id = models.BigAutoField(primary_key=True)
    item_id = models.ForeignKey(
        'WidgetInstance',
        related_name='lti_embeds',
        on_delete=models.PROTECT
    )
    resource_link = models.CharField(max_length=255)
    consumer = models.CharField(max_length=255)
    consumer_guid = models.CharField(max_length=255)
    user_id = models.ForeignKey(
        User,
        related_name='lti_embeds',
        on_delete=models.PROTECT
    )
    name = models.CharField(max_length=255, blank=True, null=True)
    context_id = models.CharField(max_length=255, blank=True, null=True)
    context_title = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.IntegerField()
    updated_at = models.IntegerField()

    created_at_dt = models.DateTimeField(default=datetime.now())
    updated_at_dt = models.DateTimeField(default=datetime.now())

    class Meta:
        db_table = "lti"

# this sucks
# consider redoing the whole 'associate assets with questions that use them' process
class MapAssetToObject(models.Model):
    # table used in one function that's checking how many times an asset is used to see if it's safe to delete
    # except the function downstream of that function, which would actually use the result, is never used

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
            models.UniqueConstraint(fields=['object_id', 'object_type', 'asset_id'], name='map_asset_to_object_main'),
        ]
        # unique_together = (("object_id", "object_type", "asset_id"),)


# Convert to be a through model for a many-to-many relationship between Question and WidgetQset models
# ignoring related_names on foreign keys for now as it probably won't be used in this way
class MapQuestionToQset(models.Model):
    id = models.BigAutoField(primary_key=True)
    qset_id = models.ForeignKey(
        'WidgetQset',
        on_delete=models.PROTECT
    )
    question_id = models.ForeignKey(
        'Question',
        on_delete=models.PROTECT
    )

    class Meta:
        db_table = "map_question_to_qset"


class Notification(models.Model):
    id = models.BigAutoField(primary_key=True)
    from_id = models.PositiveBigIntegerField()  # foreign key to Users model
    to_id = models.PositiveBigIntegerField()  # foreign key to Users model
    item_type = (
        models.IntegerField(null=True),
    )
    # this refers to a widget instance ID
    # can't foreign key it properly because we can't reliably expect every value to be valid
    # potentially sanitize data and revisit
    item_id = models.CharField(
        max_length=100, db_collation="utf8_bin"
    )
    # is_email_sent = models.CharField(max_length=1)  # convert to boolean field
    is_email_sent = models.BooleanField() # was previously CharField, enum in DB
    created_at = models.IntegerField()
    # is_read = models.CharField(max_length=1)  # convert to boolean field
    is_read = models.BooleanField() # was previously CharField, enum in DB
    subject = models.CharField(max_length=511)
    # consider deleting this column and pulling the avatar from a relevant user metadata row just in time
    avatar = models.CharField(max_length=511)
    updated_at = models.IntegerField()
    action = models.CharField(max_length=255)

    created_at_dt = models.DateTimeField(default=datetime.now())
    updated_at_dt = models.DateTimeField(default=datetime.now())

    class Meta:
        db_table = "notification"


# We may want to use Django's built-in permissions and roles system instead of these perm models. Will need a migration plan for them
# potential foreign key relationship re: object_id, object_type for assets, questions, and widget instances
class PermObjectToUser(models.Model):
    PERM_CHOICES = {
        1: 'visible/view scores',
        30: 'full',
        85: 'support user',
        90: 'super user'
    }
    # Needs primary key
    id = models.BigAutoField(primary_key=True),
    # appears to be a generic relationship combined with object_type
    object_id = models.CharField(
        max_length=10, db_collation="utf8_bin"
    )
    user_id = models.ForeignKey(
        User,
        related_name='object_permissions',
        on_delete=models.PROTECT
    )
    perm = models.IntegerField(choices=PERM_CHOICES)
    # appears to be a generic relationship combined with object_type
    object_type = models.IntegerField()
    # will be auto-nulled when the expiration date elapses
    expires_at = models.IntegerField(
        blank=True, null=True
    )

    expires_at_dt = models.DateTimeField(default=datetime.now())

    class Meta:
        db_table = "perm_object_to_user"
        constraints = [
            models.UniqueConstraint(fields=['object_id', 'user_id', 'perm', 'object_type'], name='perm_object_to_user_main'),
        ]


class Question(models.Model):
    id = models.BigAutoField(primary_key=True)
    user_id = models.ForeignKey(
        User,
        related_name='questions',
        on_delete=models.PROTECT
    )
    type = models.CharField(max_length=255)  # type is a "soft" reserved word in Python
    text = models.TextField()
    created_at = models.IntegerField()
    data = models.TextField(blank=True, null=True)
    hash = models.CharField(unique=True, max_length=32)
    qset = models.ManyToManyField(
        'WidgetQset',
        through=MapQuestionToQset
    )

    created_at_dt = models.DateTimeField(default=datetime.now())

    class Meta:
        db_table = "question"


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
        # indexes = [
        #     models.Index(fields=['user_id'], name='extra_attempts_user_id'),
        #     models.Index(fields=['inst_id'], name='extra_attempts_inst_id')
        # ]


class Widget(models.Model):
    SCORE_TYPE_CHOICES = {
        'SERVER': 'widget is scored on the server',
        'CLIENT': 'widget is scored on the client',
        'SERVER-CLIENT': 'widget is partially scored in both server and client',
    }

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    created_at = models.PositiveIntegerField()
    flash_version = models.PositiveIntegerField()
    height = models.PositiveSmallIntegerField()
    width = models.PositiveSmallIntegerField()
    is_scalable = models.BooleanField() # previously varchar field, enum in db
    score_module = models.CharField(max_length=100)
    score_type = models.CharField(
        max_length=13,
        choices=SCORE_TYPE_CHOICES
    )
    is_qset_encrypted = models.BooleanField() # previously varchar field, enum in db
    is_answer_encrypted = models.BooleanField() # previously varchar field, enum in db
    is_storage_enabled = models.BooleanField() # previously varchar field, enum in db
    is_editable = models.BooleanField() # previously varchar field, enum in db
    is_playable = models.BooleanField() # previously varchar field, enum in db
    is_scorable = models.BooleanField() # previously varchar field, enum in db
    in_catalog = models.BooleanField() # previously varchar field, enum in db
    creator = models.CharField(max_length=255)
    clean_name = models.CharField(max_length=255)
    player = models.CharField(max_length=255)
    api_version = models.IntegerField()
    package_hash = models.CharField(max_length=32, db_collation="utf8_bin")
    score_screen = models.CharField(max_length=255)
    restrict_publish = models.BooleanField() # previously varchar field, enum in db
    creator_guide = models.CharField(max_length=255)
    player_guide = models.CharField(max_length=255)

    class Meta:
        db_table = "widget"


class WidgetInstance(models.Model):
    id = models.CharField(primary_key=True, max_length=10, db_collation="utf8_bin")
    widget_id = models.ForeignKey(
        'Widget',
        related_name='instances',
        on_delete=models.PROTECT
    )
    user_id = models.ForeignKey(
        User,
        related_name='created_instances',
        on_delete=models.PROTECT
    )
    created_at = models.IntegerField()
    name = models.CharField(max_length=100)
    is_draft = models.BooleanField() # previously varchar field, enum in db
    height = models.IntegerField()
    width = models.IntegerField()
    open_at = models.IntegerField()
    close_at = models.IntegerField()
    attempts = models.IntegerField()
    is_deleted = models.BooleanField() # previously varchar field, enum in db
    guest_access = models.BooleanField() # previously varchar field, enum in db
    is_student_made = models.BooleanField() # previously varchar field, enum in db
    updated_at = models.IntegerField()
    embedded_only = models.BooleanField() # previously varchar field, enum in db
    published_by = models.ForeignKey(
        User,
        related_name='published_instances',
        on_delete=models.PROTECT,
        blank=True,
        null=True
    )

    class Meta:
        db_table = "widget_instance"


class WidgetMetadata(models.Model):
    id = models.BigAutoField(primary_key=True)
    widget_id = models.ForeignKey(
        'Widget',
        related_name='metadata',
        on_delete=models.PROTECT
    )
    name = models.CharField(max_length=255)
    value = models.TextField()

    class Meta:
        db_table = "widget_metadata"
        constraints = [
            models.UniqueConstraint(fields=['widget_id', 'name'], name='widget_metadata_main'),
        ]


class WidgetQset(models.Model):
    id = models.BigAutoField(primary_key=True)
    inst_id = models.ForeignKey(
        'WidgetInstance',
        related_name='qsets',
        on_delete=models.PROTECT
    )
    created_at = models.IntegerField()
    data = models.TextField()
    version = models.CharField(max_length=10, blank=True, null=True)
    # HANDLE WITH CARE
    # the many to many field on the Question model may take care of this for us
    # questions = models.ManyToManyField(
    #     Question,
    #     on_delete=models.PROTECT,
    #     through=MapQuestionToQset
    # )

    class Meta:
        db_table = "widget_qset"
