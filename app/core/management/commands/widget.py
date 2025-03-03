import logging
import os
from urllib import request

from django.conf import settings
from django.core.management import base
from util.widget.installer import WidgetInstaller

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

    def install_from_url(self, package_url, checksum_url, desired_id):
        local_package = self.download_package(package_url)
        local_checksum = self.download_package(checksum_url)

        # temporarily hard-code file paths until the process is finished
        valid = self.validate_checksum(local_package, local_checksum)

        self.replace_id = desired_id
        if valid:
            self.install(local_package)

    def download_package(self, file_url):
        file_name = os.path.basename(file_url)
        output_dir = WidgetInstaller.get_temp_dir()

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

        replace_id = int(self.replace_id)  # this could also possibly come from args
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
            WidgetInstaller.extract_package_and_install(file, skip_upgrade, replace_id)
