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
        cursor.execute(
            f"ALTER TABLE `log_activity` ENGINE = InnoDB;"
        )
        cursor.close()

        # existing PHP data features one table using a compound primary key
        # only single-column primary keys are viable for the Django ORM
        cursor = connection.cursor()
        cursor.execute(
            f"ALTER TABLE `user_meta` DROP PRIMARY KEY;"
        )
        cursor.close()

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
