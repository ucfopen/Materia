from django.core.management import base, call_command
from django.db import connection


class Command(base.BaseCommand):
    help = "Fake current database state"

    def handle(self, *args, **options):
        # migrate django default apps
        call_command("migrate", "admin")
        call_command("migrate", "auth")
        call_command("migrate", "contenttypes")
        call_command("migrate", "sessions")

        def add_id_column_to_table(table_name):
            """Add an 'id' auto-incrementing primary key to the top of the given table"""
            self.stdout.write(f"Adding id primary key to {table_name} table")
            cursor = connection.cursor()
            cursor.execute(
                f"ALTER TABLE `{table_name}`"
                f"ADD `id` bigint PRIMARY KEY AUTO_INCREMENT FIRST;"
            )
            cursor.close()

        # existing PHP data features one table using a different storage
        #  engine for some reason, needs to be the same as everything else
        self.stdout.write("Altering log_activity table to InnoDB engine")
        cursor = connection.cursor()
        cursor.execute("ALTER TABLE `log_activity` ENGINE = InnoDB;")

        # remove tables unused by the Django implementation
        self.stdout.write("Dropping map_question_to_qset table")
        cursor.execute("DROP TABLE `map_question_to_qset`;")
        self.stdout.write("Dropping migration table")
        cursor.execute("DROP TABLE `migration`;")
        self.stdout.write("Dropping sessions table")
        cursor.execute("DROP TABLE `sessions`;")
        self.stdout.write("Dropping user_meta table")
        cursor.execute("DROP TABLE `user_meta`;")
        self.stdout.write("Dropping perm_role_to_perm table")
        cursor.execute("DROP TABLE `perm_role_to_perm`;")
        self.stdout.write("Dropping question table")
        cursor.execute("DROP TABLE `question`;")

        # drop log indexes that will be recreated properly by Django migrations
        self.stdout.write("Removing indexes that will be recreated by migrations")

        # TODO: consider renaming indexes instead of dropping/recreating
        indexes_to_drop = {
            "asset_data": ["hash"],  # TODO: look into PRIMARY on size
            "log": ["L_Type", "PlayID", "created_at"],
            "log_activity": ["uid", "type", "itemID", "createTime"],
            "log_play": ["is_complete", "inst_id", "percent", "user_id"],
            "log_storage": ["GIID", "PID", "UID", "createTime", "name"],
            "lti": ["item_id", "resource_link", "consumer_guid"],
            "map_asset_to_object": [
                "object_id_object_type_asset_id"
            ],  # TODO: there are 3 of these. see how it gets handled
            "notification": ["emailSent", "toID", "from_id", "item_type"],
            "perm_object_to_user": [
                "complex"
            ],  # TODO: there are 4 of these. see how it gets handled
            "perm_role_to_user": [
                "user_id_role_id"
            ],  # TODO: there are 2 of these. see how it gets handled
            "user_extra_attempts": ["inst_id", "user_id"],
            "widget": ["clean_name", "is_in_catalog"],
            "widget_instance": ["GI_UID", "is_draft", "is_deleted"],
            "widget_qset": ["GIID"],
        }

        for table, indexes in indexes_to_drop.items():
            for index in indexes:
                self.stdout.write(f"Removing index {table}.{index}")
                cursor.execute(f"ALTER TABLE `{table}` DROP INDEX `{index}`;")

        # the existing log table has the 'type' column set as an ENUM
        # core migration 0001 will build this column as a varchar instead
        # manually change it to match the migration 0001 expectation so
        #  future migrations are operating correctly
        self.stdout.write("Altering log.type column to be VARCHAR")
        cursor.execute("ALTER TABLE `log` MODIFY `type` VARCHAR(26) NULL DEFAULT ''")

        # Remove the 'visible' column from the log table as it is not used
        self.stdout.write("Removing log.visible column")
        cursor.execute("ALTER TABLE `log` DROP COLUMN `visible`;")

        # Remove the environment_data column from log_play as it is huge and unnecessary
        self.stdout.write("Removing log_play.environment_data column")
        cursor.execute("ALTER TABLE log_play DROP COLUMN environment_data;")

        # Remove the 'is_read' column from the notification table as it is not used.
        # Look to add is_dismissed in the future
        self.stdout.write("Removing notification.is_read column")
        cursor.execute("ALTER TABLE `notification` DROP COLUMN `is_read`;")

        # Remove an existing unique constraint so that Django can add its own in the correct way
        self.stdout.write("Removing date_range.semester_year_start_at_end_at index")
        cursor.execute(
            "ALTER TABLE `date_range` DROP INDEX `semester_year_start_at_end_at`;"
        )

        cursor.close()

        def convert_enum_to_varchar(table, column):
            """convert all 0/1 enums to VARCHAR"""
            self.stdout.write(f"Converting {table}.{column} from ENUM to VARCHAR")
            cursor = connection.cursor()
            cursor.execute(
                f"ALTER TABLE `{table}` MODIFY `{column}` VARCHAR(1) NULL DEFAULT '0'"
            )
            cursor.close()

        boolean_fields = [
            ("asset", "is_deleted"),
            ("log_play", "is_complete"),
            ("log_play", "is_valid"),
            ("notification", "is_email_sent"),
            ("widget", "in_catalog"),
            ("widget", "is_answer_encrypted"),
            ("widget", "is_editable"),
            ("widget", "is_playable"),
            ("widget", "is_qset_encrypted"),
            ("widget", "is_scalable"),
            ("widget", "is_scorable"),
            ("widget", "is_storage_enabled"),
            ("widget", "restrict_publish"),
            ("widget", "is_generable"),
            ("widget", "uses_prompt_generation"),
            ("widget", "featured"),
            ("widget_instance", "embedded_only"),
            ("widget_instance", "guest_access"),
            ("widget_instance", "is_deleted"),
            ("widget_instance", "is_draft"),
            ("widget_instance", "is_student_made"),
        ]

        for field in boolean_fields:
            convert_enum_to_varchar(table=field[0], column=field[1])

        def convert_empty_string_to_zero(table, column):
            """convert all empty strings to 0"""
            self.stdout.write(f"Converting empty strings to '0' in {table}.{column}")
            cursor = connection.cursor()
            cursor.execute(
                f"UPDATE `{table}` SET `{column}` = '0' WHERE `{column}` = '';"
            )
            cursor.close()

        for field in boolean_fields:
            convert_empty_string_to_zero(table=field[0], column=field[1])

        def make_column_in_table_nullable_and_set_zero_to_null(table, column):
            self.stdout.write(
                f"Making {table}.{column} nullable and setting 0 values to NULL"
            )
            cursor = connection.cursor()
            cursor.execute(f"ALTER TABLE {table} MODIFY {column} int(11) NULL;")
            cursor.execute(f"UPDATE {table} SET {column} = null WHERE {column} = 0;")
            cursor.close()

        make_column_in_table_nullable_and_set_zero_to_null("log_activity", "user_id")
        make_column_in_table_nullable_and_set_zero_to_null("log_play", "user_id")
        make_column_in_table_nullable_and_set_zero_to_null("log_storage", "user_id")
        make_column_in_table_nullable_and_set_zero_to_null("lti", "user_id")
        make_column_in_table_nullable_and_set_zero_to_null("notification", "from_id")
        make_column_in_table_nullable_and_set_zero_to_null("notification", "to_id")
        make_column_in_table_nullable_and_set_zero_to_null(
            "perm_object_to_user", "user_id"
        )
        make_column_in_table_nullable_and_set_zero_to_null("widget_instance", "user_id")

        # some tables carried over from the PHP version did not have
        #  a primary key
        # the initial migration would add an 'ID' field as a primary
        #  key to each of these tables, but since that migration does
        #  not run as part of this process those fields must be added
        #  manually in order for subsequent migrations to work
        add_id_column_to_table("log_storage")
        add_id_column_to_table("map_asset_to_object")
        add_id_column_to_table("perm_object_to_user")
        add_id_column_to_table("perm_role_to_user")
        add_id_column_to_table("widget_metadata")

        timestamp_fields = [
            ("asset", "created_at", False),
            ("asset", "deleted_at", True),
            ("asset_data", "created_at", False),
            ("date_range", "end_at", False),
            ("date_range", "start_at", False),
            ("log", "created_at", False),
            ("log_activity", "created_at", False),
            ("log_play", "created_at", False),
            ("log_storage", "created_at", False),
            ("lti", "created_at", False),
            ("lti", "updated_at", False),
            ("notification", "created_at", False),
            ("notification", "updated_at", False),
            ("perm_object_to_user", "expires_at", True),
            ("user_extra_attempts", "created_at", False),
            ("widget", "created_at", False),
            ("widget_instance", "created_at", False),
            ("widget_instance", "open_at", True),
            ("widget_instance", "close_at", True),
            ("widget_instance", "updated_at", True),
            ("widget_qset", "created_at", False),
        ]

        def convert_timestamp_column_to_datetime(table, column, is_nullable):
            """Handle datetime fields that were stored as timestamps in PHP"""
            self.stdout.write(
                f"Converting {table}.{column} from UNIX timestamp (INT) to DATETIME"
            )
            cursor = connection.cursor()

            # Create new datetime column
            if is_nullable:
                cursor.execute(
                    f"ALTER TABLE `{table}` ADD COLUMN `{column}_dt` DATETIME NULL;"
                )
                # Populate new datetime column with converted values
                # -1 timestamps become NULL datetimes as part of FROM_UNIXTIME
                # intentionally skip 0 to stay as default (NULL)
                cursor.execute(
                    f"UPDATE `{table}` SET `{column}_dt` = FROM_UNIXTIME(`{column}`) WHERE `{column}` <> 0;"
                )
            else:
                cursor.execute(
                    f"ALTER TABLE `{table}` ADD COLUMN `{column}_dt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;"
                )
                # convert all values, 0 timestamps become '1970-01-01 00:00:00'
                cursor.execute(
                    f"UPDATE `{table}` SET `{column}_dt` = FROM_UNIXTIME(`{column}`);"
                )

            # Drop old timestamp column
            cursor.execute(f"ALTER TABLE `{table}` DROP COLUMN `{column}`;")
            # Rename new datetime column to original column name
            cursor.execute(
                f"ALTER TABLE `{table}` RENAME COLUMN `{column}_dt` to `{column}`;"
            )

            cursor.close()

        for field in timestamp_fields:
            convert_timestamp_column_to_datetime(
                table=field[0], column=field[1], is_nullable=field[2]
            )

        # fake core first migration
        call_command("migrate", "core", "0001_initial", fake=True)

        call_command("showmigrations")

        self.stdout.write(
            self.style.SUCCESS(
                "Faked current database state. Confirm migrations above."
            )
        )
