# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Asset(models.Model):
    id = models.CharField(primary_key=True, max_length=10, db_collation="utf8_bin")
    type = models.CharField(
        max_length=10
    )  # type is a "soft" reserved word in Python, consider renaming. We can use the db_column attribute to keep the original column name in the database
    created_at = models.IntegerField()
    title = models.CharField(max_length=300)
    file_size = models.IntegerField()
    deleted_at = models.IntegerField()  # consider converting to nullable date field
    is_deleted = models.CharField(max_length=1)  # convert to boolean field

    class Meta:
        managed = False
        db_table = "asset"


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
        managed = False
        db_table = "asset_data"
        unique_together = (("id", "size"),)


class DateRange(models.Model):
    id = models.BigAutoField(primary_key=True)
    semester = models.CharField(max_length=255)
    year = models.IntegerField()
    start_at = models.IntegerField()  # consider converting to date field
    end_at = models.IntegerField()  # consider converting to date field

    class Meta:
        managed = False
        db_table = "date_range"
        unique_together = (("semester", "year", "start_at", "end_at"),)


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
    )  # consider converting to foreign key to Asset model
    text = models.TextField()
    value = models.CharField(max_length=255)
    created_at = models.IntegerField()  # consider converting to date field
    game_time = models.IntegerField()
    visible = models.CharField(max_length=1)  # convert to boolean field
    ip = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = "log"


class LogActivity(models.Model):
    id = models.BigAutoField(primary_key=True)
    user_id = models.PositiveBigIntegerField()  # convert to foreign key to Users model
    type = models.CharField(max_length=255)  # type is a "soft" reserved word in Python
    created_at = models.IntegerField()  # consider converting to date field
    item_id = models.CharField(
        max_length=100, db_collation="utf8_bin"
    )  # consider converting to foreign key to Asset model
    value_1 = models.CharField(max_length=255, blank=True, null=True)
    value_2 = models.CharField(max_length=255, blank=True, null=True)
    value_3 = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "log_activity"


class LogPlay(models.Model):
    id = models.CharField(primary_key=True, max_length=100, db_collation="utf8_bin")
    inst_id = models.CharField(
        max_length=10, db_collation="utf8_bin"
    )  # foreign key to WidgetInstance model
    is_valid = models.CharField(max_length=1)  # convert to boolean field
    created_at = models.IntegerField()
    user_id = models.PositiveBigIntegerField()  # foreign key to Users model
    ip = models.CharField(max_length=20)
    is_complete = models.CharField(max_length=1)  # convert to boolean field
    score = models.DecimalField(max_digits=52, decimal_places=2)
    score_possible = models.IntegerField()
    percent = models.FloatField()
    elapsed = models.IntegerField()
    qset_id = models.IntegerField()
    environment_data = models.TextField()
    auth = models.CharField(max_length=100)  # consider adding choices to the field
    referrer_url = models.CharField(max_length=255)
    context_id = models.CharField(max_length=255)
    semester = models.PositiveBigIntegerField()  # foreign key to DateRange model

    class Meta:
        managed = False
        db_table = "log_play"


class LogStorage(models.Model):
    # Needs primary key
    inst_id = models.CharField(
        max_length=10, db_collation="utf8_bin"
    )  # foreign key to WidgetInstance model
    play_id = models.CharField(
        max_length=100, db_collation="utf8_bin"
    )  # foreign key to LogPlay model
    user_id = models.PositiveBigIntegerField()  # foreign key to Users model
    created_at = models.PositiveIntegerField()
    name = models.CharField(max_length=64)
    data = models.TextField()

    class Meta:
        managed = False
        db_table = "log_storage"


class Lti(models.Model):
    id = models.BigAutoField(primary_key=True)
    item_id = models.CharField(
        max_length=255, db_collation="utf8_bin"
    )  # foreign key to Asset model
    resource_link = models.CharField(max_length=255)
    consumer = models.CharField(max_length=255)
    consumer_guid = models.CharField(max_length=255)
    user_id = models.CharField(max_length=255)
    name = models.CharField(max_length=255, blank=True, null=True)
    context_id = models.CharField(max_length=255, blank=True, null=True)
    context_title = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.IntegerField()
    updated_at = models.IntegerField()

    class Meta:
        managed = False
        db_table = "lti"


class MapAssetToObject(models.Model):
    # May not be used? Used by some functions that aren't called anywhere.

    # object generic model?
    # object_type  1 = widget_qset,  2 = question
    # Needs primary key
    object_id = models.CharField(max_length=255, db_collation="utf8_bin")
    object_type = models.IntegerField()
    asset_id = models.CharField(
        max_length=10, db_collation="utf8_bin"
    )  # foreign key to Asset model

    class Meta:
        managed = False
        db_table = "map_asset_to_object"
        unique_together = (("object_id", "object_type", "asset_id"),)


class MapQuestionToQset(models.Model):
    # Convert to be a through model for a many-to-many relationship between Question and WidgetQset models
    # Needs primary key
    qset_id = models.PositiveBigIntegerField()  # foreign key to WidgetQset model
    question_id = models.PositiveBigIntegerField()  # foreign key to Question model

    class Meta:
        managed = False
        db_table = "map_question_to_qset"


class Migration(models.Model):
    # Appears to be a Fuel default table. Can probably omit in favor of Django's built-in migration system
    # Needs primary key
    type = models.CharField(max_length=25)  # type is a "soft" reserved word in Python
    name = models.CharField(max_length=50)
    migration = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = "migration"


class Notification(models.Model):
    id = models.BigAutoField(primary_key=True)
    from_id = models.PositiveBigIntegerField()  # foreign key to Users model
    to_id = models.PositiveBigIntegerField()  # foreign key to Users model
    item_type = (
        models.IntegerField()
    )  # consider adding choices to the field (what are the possible values? 0-4)
    item_id = models.CharField(
        max_length=100, db_collation="utf8_bin"
    )  # appears to be a generic relationship combined with item_type
    is_email_sent = models.CharField(max_length=1)  # convert to boolean field
    created_at = models.IntegerField()
    is_read = models.CharField(max_length=1)  # convert to boolean field
    subject = models.CharField(max_length=511)
    avatar = models.CharField(max_length=511)
    updated_at = models.IntegerField()
    action = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = "notification"


# We may want to use Django's built-in permissions and roles system instead of these perm models. Will need a migration plan for them
class PermObjectToUser(models.Model):
    # Needs primary key
    object_id = models.CharField(
        max_length=10, db_collation="utf8_bin"
    )  # appears to be a generic relationship combined with object_type
    user_id = models.PositiveBigIntegerField()  # foreign key to Users model
    perm = (
        models.IntegerField()
    )  # 1 = VISIBLE, 30 = FULL, 85 = SUPPORTUSER, 90 = SUPERUSER
    object_type = (
        models.IntegerField()
    )  # appears to be a generic relationship combined with object_type
    expires_at = models.IntegerField(
        blank=True, null=True
    )  # is Null for all records in the dev DB

    class Meta:
        managed = False
        db_table = "perm_object_to_user"
        unique_together = (("object_id", "user_id", "perm", "object_type"),)


class PermRoleToPerm(models.Model):
    # Needs primary key
    role_id = models.PositiveBigIntegerField()  # foreign key to UserRole model
    perm = (
        models.PositiveIntegerField()
    )  # 1 = VISIBLE, 30 = FULL, 85 = SUPPORTUSER, 90 = SUPERUSER

    class Meta:
        managed = False
        db_table = "perm_role_to_perm"
        unique_together = (("role_id", "perm"),)


class PermRoleToUser(models.Model):
    # Needs primary key
    user_id = models.PositiveBigIntegerField()  # foreign key to Users model
    role_id = models.PositiveBigIntegerField()  # foreign key to UserRole model

    class Meta:
        managed = False
        db_table = "perm_role_to_user"
        unique_together = (("user_id", "role_id"),)


# Not in prod. Appears to be a backup table. Can probably omit.
class PermRoleToUserBackup(models.Model):
    # Needs primary key
    user_id = models.PositiveBigIntegerField()
    role_id = models.PositiveBigIntegerField()

    class Meta:
        managed = False
        db_table = "perm_role_to_user_backup"


class Question(models.Model):
    id = models.BigAutoField(primary_key=True)
    user_id = models.PositiveBigIntegerField()  # foreign key to Users model
    type = models.CharField(max_length=255)  # type is a "soft" reserved word in Python
    text = models.TextField()
    created_at = models.IntegerField()
    data = models.TextField(blank=True, null=True)
    hash = models.CharField(unique=True, max_length=32)

    class Meta:
        managed = False
        db_table = "question"


class Sessions(models.Model):
    session_id = models.CharField(primary_key=True, max_length=40)
    previous_id = models.CharField(unique=True, max_length=40)
    user_agent = models.TextField()
    ip_hash = models.CharField(max_length=32)
    created = models.PositiveIntegerField()
    updated = models.PositiveIntegerField()
    payload = models.TextField()

    class Meta:
        managed = False
        db_table = "sessions"


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
        managed = False
        db_table = "user_extra_attempts"


class UserMeta(models.Model):
    user_id = models.PositiveBigIntegerField(
        primary_key=True
    )  # foreign key to Users model
    meta = models.CharField(max_length=255)
    value = models.TextField()

    class Meta:
        managed = False
        db_table = "user_meta"
        unique_together = (("user_id", "meta"),)


# Can be replaced with Django's built-in user roles and permissions system
class UserRole(models.Model):
    role_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = "user_role"


class Users(
    models.Model
):  # We'll probably want to use as much of Django's built-in user model as possible
    id = models.BigAutoField(primary_key=True)
    username = models.CharField(max_length=50)
    first = models.CharField(max_length=100)
    last = models.CharField(max_length=100)
    email = models.CharField(max_length=255)
    last_login = models.PositiveIntegerField()
    created_at = models.PositiveIntegerField()
    password = models.CharField(max_length=255)
    login_hash = models.CharField(max_length=255)
    profile_fields = models.TextField()
    updated_at = models.PositiveIntegerField()
    group = models.IntegerField()

    class Meta:
        managed = False
        db_table = "users"


class Widget(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    created_at = models.PositiveIntegerField()
    flash_version = models.PositiveIntegerField()
    height = models.PositiveSmallIntegerField()
    width = models.PositiveSmallIntegerField()
    is_scalable = models.CharField(
        max_length=1
    )  # convert to boolean field. Current options are 0 and empty
    score_module = models.CharField(max_length=100)
    score_type = models.CharField(max_length=13)
    is_qset_encrypted = models.CharField(max_length=1)  # convert to boolean field
    is_answer_encrypted = models.CharField(max_length=1)  # convert to boolean field
    is_storage_enabled = models.CharField(max_length=1)  # convert to boolean field
    is_editable = models.CharField(max_length=1)  # convert to boolean field
    is_playable = models.CharField(max_length=1)  # convert to boolean field
    is_scorable = models.CharField(max_length=1)  # convert to boolean field
    in_catalog = models.CharField(max_length=1)  # convert to boolean field
    creator = models.CharField(max_length=255)
    clean_name = models.CharField(max_length=255)
    player = models.CharField(max_length=255)
    api_version = models.IntegerField()
    package_hash = models.CharField(max_length=32, db_collation="utf8_bin")
    score_screen = models.CharField(max_length=255)
    restrict_publish = models.CharField(
        max_length=1
    )  # convert to boolean field. all values are 0 in dev
    creator_guide = models.CharField(max_length=255)
    player_guide = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = "widget"


class WidgetInstance(models.Model):
    id = models.CharField(primary_key=True, max_length=10, db_collation="utf8_bin")
    widget_id = models.PositiveBigIntegerField()  # foreign key to Widget model
    user_id = models.PositiveBigIntegerField()  # foreign key to Users model
    created_at = models.IntegerField()
    name = models.CharField(max_length=100)
    is_draft = models.CharField(max_length=1)  # convert to boolean field
    height = models.IntegerField()
    width = models.IntegerField()
    open_at = models.IntegerField()
    close_at = models.IntegerField()
    attempts = models.IntegerField()
    is_deleted = models.CharField(max_length=1)  # convert to boolean field
    guest_access = models.CharField(max_length=1)  # convert to boolean field
    is_student_made = models.CharField(max_length=1)  # convert to boolean field
    updated_at = models.IntegerField()
    embedded_only = models.CharField(
        max_length=1
    )  # convert to boolean field (some values are empty)
    published_by = models.PositiveBigIntegerField(
        blank=True, null=True
    )  # foreign key to Users model

    class Meta:
        managed = False
        db_table = "widget_instance"


class WidgetMetadata(models.Model):
    # needs primary key
    widget_id = models.PositiveBigIntegerField()  # foreign key to Widget model
    name = models.CharField(max_length=255)
    value = models.TextField()

    class Meta:
        managed = False
        db_table = "widget_metadata"


class WidgetQset(models.Model):
    id = models.BigAutoField(primary_key=True)
    inst_id = models.CharField(
        max_length=10, db_collation="utf8_bin"
    )  # foreign key to WidgetInstance model
    created_at = models.IntegerField()
    data = models.TextField()
    version = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "widget_qset"
