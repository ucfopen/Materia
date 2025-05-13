import logging

from django.conf import settings
from django.core.management import base
from util.widget.asset.manager import AssetManager

logger = logging.getLogger("django")


class Command(base.BaseCommand):
    help = "Commands for managing asset storage"

    def add_arguments(self, parser):
        parser.add_argument(
            "subcommand", type=str, help="Which subcommand function to run"
        )
        parser.add_argument("arguments", nargs="*", type=str, default=[])

    def handle(self, *args, **kwargs):
        subcommand = kwargs["subcommand"]
        command_function = getattr(self, subcommand)
        try:
            command_function(*kwargs["arguments"])
        except Exception as e:
            logger.info(e)
            logger.exception("")

    def migrate_to_driver(self, *args):
        driver = args[0]
        cleanup_delete = False

        if len(args) > 1 and args[1] == "cleanup":
            cleanup_delete = True

        current_driver = AssetManager.get_asset_storage_driver()
        current_driver.migrate_to(driver, cleanup_delete)

    def migrate_from_driver_to_driver(self, *args):
        driver_from = args[0]
        # default to the current driver if a target driver is not specified
        driver_to = args[1] if len(args) > 1 else settings.MEDIA_DRIVER
        cleanup_delete = False

        if len(args) > 2 and args[2] == "cleanup":
            cleanup_delete = True

        origin_driver = AssetManager.get_asset_storage_driver(driver_from)
        origin_driver.migrate_to(driver_to, cleanup_delete)
