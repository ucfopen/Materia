from django.core.management import base, call_command


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

        call_command("showmigrations")

        self.stdout.write(
            self.style.SUCCESS(
                "Faked current database state. Confirm migrations above."
            )
        )
