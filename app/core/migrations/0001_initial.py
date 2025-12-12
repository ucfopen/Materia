# IMPORTANT NOTE:
# This migration will produce tables in the state they were last in as of the final version of the
#  FuelPHP iteration of the application
# When migrating from an existing FuelPHP install to a Django install, this migration should be skipped
# To do so, in the `docker` directory, run:
# `./run.sh python manage.py migrate --fake-initial`
# This will create all necessary Django boilerplate auth/admin/contenttypes tables and skip this file,
#  allowing subsequent migrations which modify old tables to be Django compliant to run

import core.models

from django.db import migrations, models
from django.utils import timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Asset",
            fields=[
                (
                    "id",
                    models.CharField(
                        db_collation="utf8_bin",
                        max_length=10,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("type", models.CharField(max_length=10)),
                ("created_at", models.DateTimeField(default=timezone.now)),
                ("title", models.CharField(max_length=300)),
                ("file_size", models.IntegerField()),
                ("deleted_at", models.DateTimeField(default=None, null=True)),
                ("is_deleted", models.CharField(max_length=1)),
            ],
            options={"db_table": "asset"},
        ),
        migrations.CreateModel(
            name="AssetData",
            fields=[
                (
                    "id",
                    models.CharField(
                        db_collation="utf8_bin",
                        max_length=10,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("type", models.CharField(max_length=10)),
                ("status", models.CharField(max_length=20)),
                ("size", models.CharField(max_length=20)),
                ("bytes", models.IntegerField()),
                ("hash", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(default=timezone.now)),
                (
                    "data",
                    core.models.LongBlobField(),
                ),
            ],
            options={"db_table": "asset_data"},
        ),
        migrations.CreateModel(
            name="DateRange",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("semester", models.CharField(max_length=255)),
                ("year", models.IntegerField()),
                ("start_at", models.DateTimeField(default=timezone.now)),
                ("end_at", models.DateTimeField(default=timezone.now)),
            ],
            options={"db_table": "date_range"},
        ),
        migrations.CreateModel(
            name="Log",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("play_id", models.CharField(db_collation="utf8_bin", max_length=100)),
                ("type", models.CharField(blank=True, max_length=26, null=True)),
                ("item_id", models.CharField(max_length=255)),
                ("text", models.TextField()),
                ("value", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(default=timezone.now)),
                ("game_time", models.IntegerField()),
                ("ip", models.CharField(max_length=20)),
            ],
            options={"db_table": "log"},
        ),
        migrations.CreateModel(
            name="LogActivity",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("user_id", models.PositiveBigIntegerField(null=True)),
                ("type", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(default=timezone.now)),
                ("item_id", models.CharField(db_collation="utf8_bin", max_length=100)),
                ("value_1", models.CharField(blank=True, max_length=255, null=True)),
                ("value_2", models.CharField(blank=True, max_length=255, null=True)),
                ("value_3", models.CharField(blank=True, max_length=255, null=True)),
            ],
            options={"db_table": "log_activity"},
        ),
        migrations.CreateModel(
            name="LogPlay",
            fields=[
                (
                    "id",
                    models.CharField(
                        db_collation="utf8_bin",
                        max_length=100,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("inst_id", models.CharField(db_collation="utf8_bin", max_length=10)),
                ("is_valid", models.CharField(max_length=1)),
                ("created_at", models.DateTimeField(default=timezone.now)),
                ("user_id", models.PositiveBigIntegerField(null=True)),
                ("ip", models.CharField(max_length=20)),
                ("is_complete", models.CharField(max_length=1)),
                ("score", models.DecimalField(decimal_places=2, max_digits=52)),
                ("score_possible", models.IntegerField()),
                ("percent", models.FloatField()),
                ("elapsed", models.IntegerField()),
                ("qset_id", models.IntegerField()),
                ("auth", models.CharField(max_length=100)),
                ("referrer_url", models.CharField(max_length=255)),
                ("context_id", models.CharField(max_length=255)),
                ("semester", models.PositiveBigIntegerField()),
            ],
            options={"db_table": "log_play"},
        ),
        migrations.CreateModel(
            name="LogStorage",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("inst_id", models.CharField(db_collation="utf8_bin", max_length=10)),
                ("play_id", models.CharField(db_collation="utf8_bin", max_length=100)),
                ("user_id", models.PositiveBigIntegerField(null=True)),
                ("created_at", models.DateTimeField(default=timezone.now)),
                ("name", models.CharField(max_length=64)),
                ("data", models.TextField()),
            ],
            options={"db_table": "log_storage"},
        ),
        migrations.CreateModel(
            name="Lti",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("item_id", models.CharField(db_collation="utf8_bin", max_length=255)),
                ("resource_link", models.CharField(max_length=255)),
                ("consumer", models.CharField(max_length=255)),
                ("consumer_guid", models.CharField(max_length=255)),
                ("user_id", models.IntegerField(null=True)),
                ("name", models.CharField(blank=True, max_length=255, null=True)),
                ("context_id", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "context_title",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                ("created_at", models.DateTimeField(default=timezone.now)),
                ("updated_at", models.DateTimeField(default=timezone.now)),
            ],
            options={"db_table": "lti"},
        ),
        migrations.CreateModel(
            name="MapAssetToObject",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "object_id",
                    models.CharField(db_collation="utf8_bin", max_length=255),
                ),
                ("object_type", models.IntegerField()),
                ("asset_id", models.CharField(db_collation="utf8_bin", max_length=10)),
            ],
            options={"db_table": "map_asset_to_object"},
        ),
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("from_id", models.PositiveBigIntegerField(null=True)),
                ("to_id", models.PositiveBigIntegerField(null=True)),
                ("item_type", models.IntegerField()),
                ("item_id", models.CharField(db_collation="utf8_bin", max_length=100)),
                ("is_email_sent", models.CharField(max_length=1)),
                ("created_at", models.DateTimeField(default=timezone.now)),
                ("subject", models.CharField(max_length=511)),
                ("avatar", models.CharField(max_length=511)),
                ("updated_at", models.DateTimeField(default=timezone.now)),
                ("action", models.CharField(max_length=255)),
            ],
            options={"db_table": "notification"},
        ),
        migrations.CreateModel(
            name="PermObjectToUser",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("object_id", models.CharField(db_collation="utf8_bin", max_length=10)),
                ("user_id", models.PositiveBigIntegerField(null=True)),
                ("perm", models.IntegerField()),
                ("object_type", models.IntegerField()),
                ("expires_at", models.DateTimeField(default=None, null=True)),
            ],
            options={"db_table": "perm_object_to_user"},
        ),
        migrations.CreateModel(
            name="PermRoleToUser",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("user_id", models.PositiveBigIntegerField()),
                ("role_id", models.PositiveBigIntegerField()),
            ],
            options={"db_table": "perm_role_to_user"},
        ),
        migrations.CreateModel(
            name="UserExtraAttempts",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("inst_id", models.CharField(db_collation="utf8_bin", max_length=100)),
                ("user_id", models.PositiveBigIntegerField()),
                ("created_at", models.DateTimeField(default=timezone.now)),
                ("extra_attempts", models.IntegerField()),
                ("context_id", models.CharField(max_length=255)),
                ("semester", models.PositiveBigIntegerField()),
            ],
            options={"db_table": "user_extra_attempts"},
        ),
        migrations.CreateModel(
            name="UserRole",
            fields=[
                ("role_id", models.BigAutoField(primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=50)),
            ],
            options={"db_table": "user_role"},
        ),
        migrations.CreateModel(
            name="Users",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("username", models.CharField(max_length=50)),
                ("first", models.CharField(max_length=100)),
                ("last", models.CharField(max_length=100)),
                ("email", models.CharField(max_length=255)),
                ("last_login", models.PositiveIntegerField()),
                ("created_at", models.PositiveIntegerField()),
                ("password", models.CharField(max_length=255)),
                ("login_hash", models.CharField(max_length=255)),
                ("profile_fields", models.TextField()),
                ("updated_at", models.PositiveIntegerField()),
                ("group", models.IntegerField()),
            ],
            options={"db_table": "users"},
        ),
        migrations.CreateModel(
            name="Widget",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(default=timezone.now)),
                ("flash_version", models.PositiveIntegerField()),
                ("height", models.PositiveSmallIntegerField()),
                ("width", models.PositiveSmallIntegerField()),
                ("is_scalable", models.CharField(max_length=1)),
                ("score_module", models.CharField(max_length=100)),
                ("score_type", models.CharField(max_length=13)),
                ("is_qset_encrypted", models.CharField(max_length=1)),
                ("is_answer_encrypted", models.CharField(max_length=1)),
                ("is_storage_enabled", models.CharField(max_length=1)),
                ("is_editable", models.CharField(max_length=1)),
                ("is_playable", models.CharField(max_length=1)),
                ("is_scorable", models.CharField(max_length=1)),
                ("is_generable", models.CharField(max_length=1)),
                ("uses_prompt_generation", models.CharField(max_length=1)),
                ("in_catalog", models.CharField(max_length=1)),
                ("featured", models.CharField(max_length=1)),
                ("creator", models.CharField(max_length=255)),
                ("clean_name", models.CharField(max_length=255)),
                ("player", models.CharField(max_length=255)),
                ("api_version", models.IntegerField()),
                (
                    "package_hash",
                    models.CharField(db_collation="utf8_bin", max_length=32),
                ),
                ("score_screen", models.CharField(max_length=255)),
                ("restrict_publish", models.CharField(max_length=1)),
                ("creator_guide", models.CharField(max_length=255)),
                ("player_guide", models.CharField(max_length=255)),
            ],
            options={"db_table": "widget"},
        ),
        migrations.CreateModel(
            name="WidgetInstance",
            fields=[
                (
                    "id",
                    models.CharField(
                        db_collation="utf8_bin",
                        max_length=10,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("widget_id", models.PositiveBigIntegerField()),
                ("user_id", models.PositiveBigIntegerField(null=True)),
                ("created_at", models.DateTimeField(default=timezone.now)),
                ("name", models.CharField(max_length=100)),
                ("is_draft", models.CharField(max_length=1)),
                ("height", models.IntegerField()),
                ("width", models.IntegerField()),
                ("open_at", models.DateTimeField(default=None, null=True)),
                ("close_at", models.DateTimeField(default=None, null=True)),
                ("attempts", models.IntegerField()),
                ("is_deleted", models.CharField(max_length=1)),
                ("guest_access", models.CharField(max_length=1)),
                ("is_student_made", models.CharField(max_length=1)),
                ("updated_at", models.DateTimeField(default=None, null=True)),
                ("embedded_only", models.CharField(max_length=1)),
                ("published_by", models.PositiveBigIntegerField(blank=True, null=True)),
            ],
            options={"db_table": "widget_instance"},
        ),
        migrations.CreateModel(
            name="WidgetMetadata",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("widget_id", models.PositiveBigIntegerField()),
                ("name", models.CharField(max_length=255)),
                ("value", models.TextField()),
            ],
            options={"db_table": "widget_metadata"},
        ),
        migrations.CreateModel(
            name="WidgetQset",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("inst_id", models.CharField(db_collation="utf8_bin", max_length=10)),
                ("created_at", models.DateTimeField(default=timezone.now)),
                ("data", models.TextField()),
                ("version", models.CharField(blank=True, max_length=10, null=True)),
            ],
            options={"db_table": "widget_qset"},
        ),
    ]
