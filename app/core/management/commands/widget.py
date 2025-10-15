import logging
import os
from shutil import rmtree
from urllib import request

from core.models import Question, Widget, WidgetInstance, WidgetQset
from django.conf import settings
from django.core.management import base
from core.message_exception import MsgException
from core.services.widget_installer_service import WidgetInstallerService

logger = logging.getLogger("django")


class Command(base.BaseCommand):
    help = "Commands for managing widgets and widget instances"

    # TODO: the old Fuel commands provided a pretty helpful syntax for easily running commands
    #  with any number of options or arguments, but that seems to require a bit of effort with
    #  Django
    # figure out how to enable the old behavior, or figure out some kind of alternative
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

    def install_from_config(self, *args):
        widgets = settings.WIDGETS
        install_all = len(args) < 1

        for w in widgets:
            if install_all or str(w["id"]) in list(args):
                self.install_from_url(w["package"], w["checksum"], w["id"])

    def install_from_url(self, package_url, checksum_url, desired_id=None):
        local_package = self.download_package(package_url)
        local_checksum = self.download_package(checksum_url)

        # temporarily hard-code file paths until the process is finished
        valid = self.validate_checksum(local_package, local_checksum)

        if desired_id is not None:
            self.replace_id = desired_id

        if valid:
            self.install(local_package)

        # clean up remaining temporary files
        rmtree(os.path.dirname(local_package))
        rmtree(os.path.dirname(local_checksum))

    def install_from_url_no_verify(self, package_url, desired_id):
        local_package = self.download_package(package_url)

        self.replace_id = desired_id
        self.install(local_package)

    def download_package(self, file_url):
        file_name = os.path.basename(file_url)
        output_dir = WidgetInstallerService.get_temp_dir()

        logger.info(f"Downloading .wigt package {file_url}")
        download_location = f"{output_dir}{file_name}"
        with request.urlopen(file_url) as download:
            open(download_location, "wb").write(download.read())

        logger.info(f"Package downloaded: {download_location}")
        return download_location

    def validate_checksum(self, widget_path, checksum_path):
        from yaml import YAMLError, safe_load

        checksums = None
        with open(checksum_path, "rb") as checksum_file:
            try:
                checksums = safe_load(checksum_file)
            except YAMLError:
                raise Exception("Error trying to parse YAML from checksum file!")

        from hashlib import md5, sha1, sha256

        sha1_hash = sha1()
        sha256_hash = sha256()
        md5_hash = md5()

        with open(widget_path, "rb") as widget_file:
            while True:
                data = widget_file.read(65536)  # read the file contents 64kb at a time
                if not data:
                    break
                sha1_hash.update(data)
                sha256_hash.update(data)
                md5_hash.update(data)

        sha1_hash = sha1_hash.hexdigest()
        sha256_hash = sha256_hash.hexdigest()
        md5_hash = md5_hash.hexdigest()
        if sha1_hash != checksums["sha1"]:
            raise Exception("Error: sha1 checksum mismatch!")
        if sha256_hash != checksums["sha256"]:
            raise Exception("Error: sha256 checksum mismatch!")
        if md5_hash != checksums["md5"]:
            raise Exception("Error: md5 checksum mismatch!")

        logger.info("Checksum valid")
        logger.info(f"Build date: {checksums['build_date']}")
        logger.info(f"Git Source: {checksums['git']}")
        logger.info(f"Git Commit: {checksums['git_version']}")

        return True

    # must be passed a .wigt file reference, can use glob syntax to match multiple widgets
    def install(self, package_path):
        # TODO: figure out how to make it possible to run this from the command line
        #  as well as from an adjacent function
        # if (\Cli::option('help') || \Cli::option('?'))
        # {
        #     \Cli::write('Installs valid .wigt packages to your Materia install.');
        #     \Cli::write('');
        #     \Cli::write('Usage: widget:install [options] \
        #     [git url, .widgt file url, .wigt file path, or an entire directory]', 'white');
        #     \Cli::write('');
        #     \Cli::write('Options:', 'white');
        #     \Cli::write('	--skip-upgrade: If there is a package with the same name, do not upgrade it.');
        #     \Cli::write('	--replace-id: Set a widget id youd like to replace.');
        #     \Cli::write('	--help (-h): Displays this message.');
        #     \Cli::write('');
        #     \Cli::write('Directory or .wigt file(s)', 'white');
        #     \Cli::write('');
        #     exit(0);
        # }

        # parse all the file paths passed to the task
        # used 'func_get_args()' in PHP
        # widget_files = self.get_files_from_args(however_we_get_args())
        widget_files = [package_path]

        replace_id = (
            int(self.replace_id) if hasattr(self, "replace_id") else 0
        )  # this could also possibly come from args
        # file_count = len(widget_files)
        # if not file_count:
        # raise Exception(f"No widgets found in {','.join(however_we_get_args())}")
        # if file_count > 1 and replace_id > 0:
        #     raise Exception("Multiple widgets can not be specified when using --replace_id option")

        # this seems like it's only happening to support downstream activity log creation
        # maybe just allow any activity logs for widget installation/updates done in the console
        #  to have a null user?
        for file in widget_files:
            skip_upgrade = False  # get this from the CLI options somehow?
            WidgetInstallerService.extract_package_and_install(
                file, skip_upgrade, replace_id
            )

    def update(self, widget_id):
        # Get current version
        widget = Widget.objects.filter(id=widget_id).first()
        if widget is None:
            logger.error(f"Widget with ID '{widget_id}' does not exist")
            logger.error("Unable to update.")
            return

        # Get latest version available
        logger.warning("Getting latest available version...")
        try:
            result = WidgetInstallerService.get_latest_version_for(widget_id)
        except MsgException as e:
            logger.error(e.msg)
            logger.error("Unable to update.")
            return
        new_ver, wigt_url, checksum_url = result

        logger.info(f"Currently installed version: {widget.version}")
        logger.info(f"Latest available version: {new_ver}")

        # Check if an update is even needed
        update_needed = WidgetInstallerService.needs_update(widget_id, new_ver)
        if not update_needed:
            logger.warning(
                "\nThis widget is already up to date. Do you want to continue the update anyway?"
            )
            result = input("y/n: ")
            while result.lower() != "y" and result.lower() != "n":
                logger.warning("Please enter either 'y' for yes, or 'n' for no.")
                result = input("y/n: ")
            if result.lower() == "n":
                logger.warning("Update aborted.")
                return

        logger.info("\nInstalling update...\n")
        self.install_from_url(wigt_url, checksum_url, widget_id)

        logger.info("\nUpdate complete!")

    def update_all(self):
        print("Checking for updates...")
        widgets = Widget.objects.values_list("id", "name").all()

        # Check which widgets have updates
        updates_pending = []
        for widget_id, widget_name in widgets:
            try:
                result = WidgetInstallerService.get_latest_version_for(widget_id)
            except MsgException as e:
                print(
                    f"{widget_name} ({widget_id}): Could not check for update ({e.msg})"
                )
                continue
            new_ver, wigt_url, checksum_url = result

            update_needed = WidgetInstallerService.needs_update(widget_id, new_ver)
            if update_needed:
                print(f"{widget_name} ({widget_id}): Update available ({new_ver})")
                updates_pending.append(
                    (widget_id, widget_name, new_ver, wigt_url, checksum_url)
                )
            else:
                print(f"{widget_name} ({widget_id}): Up to date")

        print()

        if not updates_pending:
            print("No updates are available!")
            return

        are = "are" if len(updates_pending) != 1 else "is"
        s = "s" if len(updates_pending) != 1 else ""
        print(
            f"There {are} {len(updates_pending)} update{s} available. Proceed? (y/n): ",
            end="",
        )
        result = input()
        while result.lower() != "y" and result.lower() != "n":
            print("Please enter either 'y' for yes, or 'n' for no:", end="")
            result = input()
        if result.lower() == "n":
            print("Updates aborted.")

        print("Updating all widgets...")
        for widget_id, widget_name, new_ver, wigt_url, checksum_url in updates_pending:
            self.install_from_url(wigt_url, checksum_url, widget_id)
            print(f"Updated {widget_name} ({widget_id}) to version {new_ver}")

        print("Updated all widgets!")

    # applies ids to all demos
    def apply_ids_to_demos(self):
        """
        This should no longer be required. Just reinstall the widget.
        """
        pass

    def remove(self, widget_id):
        """
        Completely deletes a widget - all database rows and installed files.
        If this widget engine has instances, this command will prompt to delete them all as well.
        As you can imagine, this is an extremely destructive operation. Ask the user for confirmation first.
        """
        print(
            "\nThis operation will remove a widget engine from the database as well as all installed files."
        )
        print(
            "\nAll widget instances created with this engine will be deleted as well."
        )
        print(
            "\nAre you SURE you want to do this? This may cause significant data loss and errors."
        )
        confirmation = input(
            "\nEnter 'Yes I am sure' EXACTLY to perform the delete operation:\n"
        )

        if confirmation != "Yes I am sure":
            print("\nConfirmation did not match. Operation aborted.")
            return False

        # Check if widget exists
        widget = Widget.objects.filter(pk=widget_id).first()
        if not widget:
            print(f"Widget with id '{widget_id}' does not exist. Deletion aborted.")
            return

        # Instance check - see if instances exist, ask if the user wants to continue with deleting them
        demo_id = widget.metadata.get("demo")
        num_instances = (
            WidgetInstance.objects.filter(widget=widget).exclude(pk=demo_id).count()
        )
        if num_instances > 0:
            print(
                f"This widget engine has {num_instances} instance{'s' if num_instances != 1 else ''} associated with "
                f"it (not including the demo). Delete all instances? (y/n):"
            )
            result = input()
            while result.lower() != "y" and result.lower() != "n":
                print("Enter 'y' or 'n': ")
                result = input()
            if result.lower() == "n":
                print("Deletion aborted.")
                return

        # Delete all instances
        print("Deleting instances...")
        instances = WidgetInstance.objects.filter(widget=widget)
        for instance in instances:  # delete permissions
            instance.permissions.all().delete()
        qsets = WidgetQset.objects.filter(instance__in=instances)
        Question.objects.filter(qset__in=qsets).delete()
        qsets.delete()
        instances.delete()

        # Delete widget from DB
        print("Deleting widget entry...")
        clean_name = widget.clean_name
        widget.delete()

        # Delete widget's installed files
        print("Deleting widget files...")
        WidgetInstallerService.uninstall_widget_files(widget_id, clean_name)

        print("Widget deleted!")

        # TODO: delete assets?
