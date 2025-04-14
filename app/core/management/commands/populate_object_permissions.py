import logging

from django.core.management import base

logger = logging.getLogger("django")


class Command(base.BaseCommand):
    help = "Utility commands to back-populate the ObjectPermission table based on existing foreign key relationships"

    def add_arguments(self, parser):
        parser.add_argument(
            "subcommand", type=str, help="Which subcommand function to run"
        )
        parser.add_argument(  # this works for now (in regard to above comment)
            "arguments", nargs="*", type=str
        )

    def handle(self, *args, **kwargs):
        subcommand = kwargs["subcommand"]
        command_function = getattr(self, subcommand)

        try:
            command_function(*kwargs["arguments"])
        except Exception as e:
            logger.info(e)
            logger.exception("")

    # utility command to back-populate ObjectPermission records based on instance ownership
    def populate_instance_owner_perms(self):

        from core.models import WidgetInstance

        instances = WidgetInstance.objects.all()

        for instance in instances:
            if not instance.permissions.exists():
                if instance.user is not None:
                    logger.info(
                        f"creating ObjectPermission record for user "
                        f"{instance.user.id} for instance {instance.name}\n"
                    )
                    instance.permissions.create(user=instance.user, permission="full")
