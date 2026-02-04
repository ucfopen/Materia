import logging

from django.core.management import base

logger = logging.getLogger(__name__)


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
        except Exception:
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

    def populate_notification_owner_perms(self):
        from core.models import Notification

        notifications = Notification.objects.all()

        for notification in notifications:
            if not notification.permissions.exists():
                if notification.to_id is not None:
                    logger.info(
                        f"creating ObjectPermission record for user "
                        f"{notification.to_id.id} for notification {notification.id}\n"
                    )
                    notification.permissions.create(
                        user=notification.to_id, permission="full"
                    )
