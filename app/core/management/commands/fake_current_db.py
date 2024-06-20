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

        # fake core first migration
        call_command("migrate", "core", "0001_initial", fake=True)

        # add an 'id' auto-incrementing primary key to the top of the given table
        def add_id_column_to_table(table_name):
            cursor = connection.cursor()
            cursor.execute(
                f"ALTER TABLE `{table_name}`"
                f"ADD `id` bigint PRIMARY KEY AUTO_INCREMENT FIRST;"
            )
            cursor.close()

        # existing PHP data features one table using a different storage
        #  engine for some reason, needs to be the same as everything else
        cursor = connection.cursor()
        cursor.execute(f"ALTER TABLE `log_activity` ENGINE = InnoDB;")
        cursor.close()

        # existing PHP data features one table using a compound primary key
        # only single-column primary keys are viable for the Django ORM
        cursor = connection.cursor()
        cursor.execute(f"ALTER TABLE `user_meta` DROP PRIMARY KEY;")
        # the existing log table has the 'type' column set as an ENUM
        # core migration 0001 will build this column as a varchar instead
        # manually change it to match the migration 0001 expectation so
        #  future migrations are operating correctly
        cursor.execute("ALTER TABLE `log` MODIFY `type` VARCHAR(26) NULL DEFAULT ''")

        # Remove the 'visible' column from the log table as it is not used
        cursor.execute("ALTER TABLE `log` DROP COLUMN `visible`;")

        # Remove the 'is_read' column from the notification table as it is not used.
        # Look to add is_dismissed in the future
        cursor.execute("ALTER TABLE `notification` DROP COLUMN `is_read`;")

        # Remove an existing unique constraint so that Django can add its own in the correct way
        cursor.execute("ALTER TABLE `date_range` DROP INDEX `semester_year_start_at_end_at`;")

        cursor.close()

        # convert all 0/1 enums to VARCHAR
        def convert_enum_to_varchar(table, column):
            cursor = connection.cursor()
            cursor.execute(
                f"ALTER TABLE `{table}` MODIFY `{column}` VARCHAR(1) NULL DEFAULT '0'"
            )
            cursor.close()

        boolean_fields = [
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
            ("widget_instance", "embedded_only"),
            ("widget_instance", "guest_access"),
            ("widget_instance", "is_deleted"),
            ("widget_instance", "is_draft"),
            ("widget_instance", "is_student_made"),
        ]

        for field in boolean_fields:
            convert_enum_to_varchar(table=field[0], column=field[1])

        # convert all empty strings to 0
        def convert_empty_string_to_zero(table, column):
            cursor = connection.cursor()
            cursor.execute(
                f"UPDATE `{table}` SET `{column}` = '0' WHERE `{column}` = '';"
            )
            cursor.close()

        for field in boolean_fields:
            convert_empty_string_to_zero(table=field[0], column=field[1])

        def make_column_in_table_nullable_and_set_zero_to_null(table, column):
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
        make_column_in_table_nullable_and_set_zero_to_null("question", "user_id")

        # some tables carried over from the PHP version did not have
        #  a primary key
        # the initial migration would add an 'ID' field as a primary
        #  key to each of these tables, but since that migration does
        #  not run as part of this process those fields must be added
        #  manually in order for subsequent migrations to work
        add_id_column_to_table("log_storage")
        add_id_column_to_table("map_asset_to_object")
        add_id_column_to_table("map_question_to_qset")
        add_id_column_to_table("perm_object_to_user")
        add_id_column_to_table("user_meta")
        add_id_column_to_table("widget_metadata")

        call_command("showmigrations")

        self.stdout.write(
            self.style.SUCCESS(
                "Faked current database state. Confirm migrations above."
            )
        )
