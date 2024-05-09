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

        def add_id_column_to_table(table_name):
            cursor = connection.cursor()
            cursor.execute(
                f"ALTER TABLE `{table_name}`"
                f"ADD `id` bigint PRIMARY KEY AUTO_INCREMENT FIRST;"
            )

        add_id_column_to_table("widget_metadata")
        add_id_column_to_table("perm_object_to_user")
        add_id_column_to_table("log_storage")
        add_id_column_to_table("map_asset_to_object")
        add_id_column_to_table("map_question_to_qset")
        add_id_column_to_table("user_extra_attempts")
        add_id_column_to_table("user_meta")

        call_command("showmigrations")

        self.stdout.write(
            self.style.SUCCESS(
                "Faked current database state. Confirm migrations above."
            )
        )
