import json
import logging
import math
import os
import sys
import tempfile
import types
from json import JSONDecodeError
from pathlib import Path

import urllib3
from django.utils import timezone

from core.models import Widget, WidgetInstance, WidgetQset
from django.conf import settings
from django.core.management import color_style
from urllib3.exceptions import MaxRetryError
from core.message_exception import MsgNotFound, MsgFailure

logger = logging.getLogger(__name__)


class WidgetInstallerService:

    @staticmethod
    def get_temp_dir():
        temporary_file = tempfile.NamedTemporaryFile(dir=tempfile.gettempdir())

        if os.path.isfile(temporary_file.name):
            temporary_file.close()
        os.mkdir(temporary_file.name)
        if os.path.isdir(temporary_file.name):
            if temporary_file.name[-1] != "/":
                return f"{temporary_file.name}/"
            return temporary_file.name
        return None

    # Extracts a .wigt file to its proper target destination without using a database connection
    # Useful for Heru build process, pre-packaging servers, or similar activities
    # return bool True or False depending on installation success
    def extract_package_files(
        widget_file,
        widget_id,
    ):
        pass
        # try
        # {
        # 	[$dir, $manifest_data, $clean_name] = static::unzip_and_read_manifest($widget_file);
        # 	static::install_widget_files($widget_id, $clean_name, $dir);
        # 	$success = true;
        # }
        # catch (\Exception $e)
        # {
        # 	trace($e);
        # 	$success = false;
        # }

        # if (isset($dir)) static::cleanup($dir);
        # return $success;

    @staticmethod
    def extract_package_and_install(widget_file, skip_upgrade=False, replace_id=0):
        from core.models import LogActivity

        activity = LogActivity()
        # this will have to change - maybe by passing a user into this function as an arg
        # the intention is that whether this function is run from the console or as a result of
        #  the widget admin panel, the 'current user' will be findable in order to associate this
        #  action with them
        activity.user = None
        dir, manifest_data, clean_name = WidgetInstallerService.unzip_and_read_manifest(
            widget_file
        )

        # check for existing widgets
        matching_widgets = Widget.objects.filter(clean_name=clean_name)
        num_existing = len(matching_widgets)

        if skip_upgrade and num_existing > 0:
            arg = sys.argv[0]
            if arg is not None and arg.endswith(
                "manage.py"
            ):  # Running from manage.py, print out extra info
                print(
                    color_style().ERROR(
                        f"Multiple existing widgets found with the name '{clean_name}':"
                    )
                )
                for matching_widget in matching_widgets:
                    print(
                        color_style().ERROR(
                            f" ==> ID:{matching_widget.id} ({matching_widget.name})"
                        )
                    )
                print(
                    color_style().WARNING(
                        "Run install again with --replace-id=ID option"
                    )
                )
                return False
            else:
                raise Exception(
                    f"Existing widgets found for {clean_name}, not upgrading due to --skip-upgrade option"
                )

        if num_existing == 1 and not skip_upgrade and replace_id == 0:
            replace_id = matching_widgets[0].id
        if num_existing > 1 and replace_id == 0:
            raise Exception(f"Multiple existing widgets share clean name {clean_name}")

        params = WidgetInstallerService.generate_install_params(
            manifest_data, widget_file
        )
        existing_demo_inst_id = None

        id = None

        # NEW
        if not replace_id:
            logger.info("Installing brand new widget")
            id = WidgetInstallerService.save_params(params)
            activity.type = LogActivity.TYPE_INSTALL_WIDGET
        # UPGRADE
        else:
            logger.info("Upgrading existing widget")
            try:
                existing_widget = Widget.objects.get(id=replace_id)
                if "demo" in existing_widget.metadata:
                    existing_demo_inst_id = existing_widget.metadata["demo"]
                    logger.info("Existing demo found: %s", existing_demo_inst_id)

            except Widget.DoesNotExist:
                pass

            id = WidgetInstallerService.save_params(params, replace_id)
            activity.type = LogActivity.TYPE_UPDATE_WIDGET

        # add the demo
        demo_id = WidgetInstallerService.install_demo(id, dir, existing_demo_inst_id)
        widget = Widget.objects.get(pk=id)
        widget.metadata["demo"] = demo_id
        widget.save()

        logger.info("demo installed")

        WidgetInstallerService.install_widget_files(id, clean_name, dir)

        # save metadata
        widget = Widget.objects.get(id=id)

        logger.info("Widget installed: %s", dir)
        success = True
        activity.item_id = id
        activity.value_1 = clean_name
        activity.save()

        if bool(dir):
            from shutil import rmtree

            rmtree(dir)

        return success

    # Unzip a .wigt file into a temp directory, validate it, and extract manifest data and version
    # return array
    @staticmethod
    def unzip_and_read_manifest(widget_file) -> tuple[str, dict, str]:
        from core.models import Widget

        target_dir = WidgetInstallerService.unzip_to_tmp(widget_file)
        manifest_data = WidgetInstallerService.validate_widget(target_dir)
        version_info = WidgetInstallerService.get_version_info(target_dir)

        clean_name = Widget.make_clean_name(manifest_data["general"]["name"])

        # Grab and load the playdata exporter script
        script_path = Path(os.path.join(target_dir, Widget.PATHS_PLAYDATA))
        if script_path.exists():
            script_text = script_path.read_text()

            # Execute the script to load the class
            script_globals = types.ModuleType(
                "temp_exporter_module"
            )  # Empty module to act as the script's globals
            exec(
                script_text, script_globals.__dict__
            )  # Script will load the class, which we can find in the globals

            # Find the mappings field in the globals, which should map a human-readable name to each function
            exporter_mappings = getattr(script_globals, "mappings", None)
            if exporter_mappings is None or not isinstance(exporter_mappings, dict):
                raise Exception(
                    "Play data exporter script missing top level 'mappings' dict"
                )

            manifest_data["meta_data"]["playdata_exporters"] = exporter_mappings.keys()
        else:
            manifest_data["meta_data"][
                "playdata_exporters"
            ] = []  # no custom playdata exporter methods

        # Chuck version manifest metadata
        manifest_data["meta_data"]["version"] = version_info.get("version")

        return target_dir, manifest_data, clean_name

    @staticmethod
    def unzip_to_tmp(file):
        from zipfile import ZipFile

        extract_location = WidgetInstallerService.get_temp_dir()
        if not extract_location:
            raise Exception("Unable to extract widget.")
        # assume it's a zip file, attempt to extract
        try:
            logger.info("Extracting %s to %s", file, extract_location)
            # TODO: zip extraction stuff
            with ZipFile(file) as archive:
                archive.extractall(extract_location)
                archive.close()
        except Exception as e:
            # clean up after ourselves by removing the extracted directory
            from shutil import rmtree

            rmtree(extract_location)
            raise e

        return extract_location

    @staticmethod
    def get_version_info(widget_dir: str) -> dict:
        """
        Checks version.json for version info. If file is not found, return a default version of 1.0.0.
        Enforces that a 'version' field is present in the JSON object.
        """
        version_file = os.path.join(widget_dir, "version.json")
        if not os.path.isfile(version_file):
            return {"version": "v1.0.0"}

        with open(version_file, "r") as f:
            version_data = json.load(f)
            if not isinstance(version_data, dict):
                raise ValueError("Version file is expected to be a JSON object.")
            if "version" not in version_data:
                raise ValueError("Version file is missing required 'version' field.")
            return version_data

    # checks to make sure the widget contains the required data.
    # throws with the reason if not.
    @staticmethod
    def validate_widget(dir):
        # 1. Do we have a manifest yaml file?
        manifest_data = WidgetInstallerService.get_manifest_data(dir)

        # 2. Our manifest should have 'general', 'files', 'score' and 'metadata' sections at least
        missing_sections = set(["general", "files", "score", "meta_data"]) - set(
            manifest_data.keys()
        )
        if len(missing_sections) > 0:
            raise Exception(
                f"Manifest missing one or more required sections: {', '.join(missing_sections)}"
            )

        # 3. Make sure the 'general' section is correct
        general = manifest_data["general"]
        general_keys = [
            "name",
            "height",
            "width",
            "is_storage_enabled",
            "in_catalog",
            "is_editable",
            "is_playable",
            "is_qset_encrypted",
            "is_answer_encrypted",
            "api_version",
        ]
        WidgetInstallerService.validate_keys_exist(general, general_keys)
        WidgetInstallerService.validate_numeric_values(general, ["width", "height"])
        WidgetInstallerService.validate_boolean_values(
            general,
            [
                "in_catalog",
                "is_editable",
                "is_playable",
                "is_qset_encrypted",
                "is_answer_encrypted",
                "is_storage_enabled",
            ],
        )

        # 4. Make sure the 'files' section is correct
        files = manifest_data["files"]
        WidgetInstallerService.validate_keys_exist(files, ["player"])
        WidgetInstallerService.validate_numeric_values(files, ["flash_version"])

        player_file = os.path.join(dir, files["player"])
        if not os.path.isfile(player_file):
            raise Exception(f"Player file missing: {player_file}")

        if "creator" not in files or files["creator"] == "":
            raise Exception("Creator does not exist")
        else:
            if files["creator"] != "default":
                creator_file = os.path.join(dir, files["creator"])
                if not os.path.isfile(creator_file):
                    raise Exception(f"Creator file missing: {creator_file}")

        # 5. Make sure the 'score' section is correct
        score = manifest_data["score"]
        WidgetInstallerService.validate_keys_exist(score, ["is_scorable"])
        WidgetInstallerService.validate_boolean_values(score, ["is_scorable"])

        # 6. Make sure the 'meta_data' section is correct
        metadata = manifest_data["meta_data"]
        WidgetInstallerService.validate_keys_exist(metadata, ["about", "excerpt"])

        # 7. Make sure the score_module.py/php ((test file?)and the score module test files both exist)
        if score["is_scorable"]:
            WidgetInstallerService.validate_keys_exist(score, ["score_module"])

            if not os.path.isfile(
                os.path.join(dir, "_score-modules/score_module.php")
            ) and not os.path.isfile(
                os.path.join(dir, "_score-modules/score_module.py")
            ):
                raise Exception("Missing score module file")

            if not os.path.isfile(
                os.path.join(dir, "_score-modules/test_score_module.php")
            ):
                # raise Exception("Missing score module tests")
                print("missing tests...continuing")

        return manifest_data

    def get_manifest_data(dir):
        manifest_data = False
        manifest_file_path = os.path.join(dir, "install.yaml")
        if not os.path.isfile(manifest_file_path):
            raise Exception("Missing manifest yaml file")

        from yaml import YAMLError, safe_load

        with open(manifest_file_path, "rb") as manifest_file:
            try:
                manifest_data = safe_load(manifest_file)
            except YAMLError:
                raise Exception("Error trying to parse YAML from manifest file!")

        return manifest_data

    def validate_keys_exist(section, required):
        missing_sections = set(required) - set(section.keys())
        if len(missing_sections) > 0:
            raise Exception(
                f"Missing required attributs: {', '.join(missing_sections)}"
            )

    def validate_numeric_values(section_data, attributes):
        from core.utils.validator_util import ValidatorUtil

        values = {}
        for attribute in attributes:
            val = section_data.get(attribute)
            if val:
                values[attribute] = val
        wrong_values = list(
            filter(lambda value: not ValidatorUtil.is_numeric(values[value]), values)
        )
        if len(wrong_values):
            raise Exception(
                f"Attributes expected to be numeric: {', '.join(wrong_values)}"
            )

    def validate_boolean_values(section_data, attributes):
        values = {}
        for attribute in attributes:
            val = section_data.get(attribute)
            if val:
                values[attribute] = val
        wrong_values = list(
            filter(lambda value: type(values[value]) is not bool, values)
        )
        if len(wrong_values):
            raise Exception(
                f"Attributes expected to be boolean: {', '.join(wrong_values)}"
            )

    def generate_install_params(manifest_data, package_file):
        from hashlib import md5

        clean_name = Widget.make_clean_name(manifest_data["general"]["name"])
        package_hash = md5()
        with open(package_file, "rb") as open_file:
            while True:
                data = open_file.read(65536)  # read the file contents 64kb at a time
                if not data:
                    break
                package_hash.update(data)
        package_hash = package_hash.hexdigest()

        return {
            "name": manifest_data["general"]["name"],
            "created_at": timezone.now(),
            "flash_version": manifest_data["files"]["flash_version"],
            "height": manifest_data["general"]["height"],
            "width": manifest_data["general"]["width"],
            "restrict_publish": (
                bool(manifest_data["general"]["restrict_publish"])
                if "restrict_publish" in manifest_data["general"]
                else False
            ),
            "is_qset_encrypted": bool(manifest_data["general"]["is_qset_encrypted"]),
            "is_answer_encrypted": bool(
                manifest_data["general"]["is_answer_encrypted"]
            ),
            "is_storage_enabled": bool(manifest_data["general"]["is_storage_enabled"]),
            "is_playable": bool(manifest_data["general"]["is_playable"]),
            "is_editable": bool(manifest_data["general"]["is_editable"]),
            "is_scorable": bool(manifest_data["score"]["is_scorable"]),
            "in_catalog": bool(manifest_data["general"]["in_catalog"]),
            "clean_name": clean_name,
            "api_version": int(manifest_data["general"]["api_version"]),
            "package_hash": package_hash,
            "score_module": (
                manifest_data["score"]["score_module"]
                if manifest_data["score"]["is_scorable"]
                else ""
            ),
            "is_generable": (
                bool(manifest_data["general"]["is_generable"])
                if "is_generable" in manifest_data["general"]
                else False
            ),
            "uses_prompt_generation": (
                bool(manifest_data["general"]["uses_prompt_generation"])
                if "uses_prompt_generation" in manifest_data["general"]
                else False
            ),
            "creator": (
                manifest_data["files"]["creator"]
                if "creator" in manifest_data["files"]
                else ""
            ),
            "player": (
                manifest_data["files"]["player"]
                if "player" in manifest_data["files"]
                else ""
            ),
            "score_screen": (
                manifest_data["score"]["score_screen"]
                if "score_screen" in manifest_data["score"]
                else ""
            ),
            "creator_guide": (
                manifest_data["files"]["creator_guide"]
                if "creator_guide" in manifest_data["files"]
                else ""
            ),
            "player_guide": (
                manifest_data["files"]["player_guide"]
                if "player_guide" in manifest_data["files"]
                else ""
            ),
            "metadata": manifest_data["meta_data"],
        }

    @staticmethod
    def save_params(params, widget_id=None):
        # check for existing
        widget_obj = None
        try:
            # update
            widget_obj = Widget.objects.get(id=widget_id)
            # do not overwrite the in_catalog or featured flag for existing widgets
            params.pop("in_catalog", True)
            params.pop("featured", False)
            try:
                for key, value in params.items():
                    setattr(widget_obj, key, value)
                widget_obj.save()
            # TODO: narrow down which kind(s) of Exception we should expect here
            except Exception:
                # TODO: consider changing this to logger.error
                logger.info(
                    "Exception when updating existing widget params", exc_info=True
                )
                raise Exception(f"Failure updating existing widget data: {widget_id}")
        except Widget.DoesNotExist:
            # new
            try:
                widget_obj = Widget(**params)
                widget_obj.save()
                widget_id = widget_obj.id
            # TODO: narrow down which kind(s) of Exception we should expect here
            except Exception:
                # TODO: consider changing this to logger.error
                logger.info("Exception when saving widget params", exc_info=True)
                raise Exception(f"Failure creating new widget: {widget_id}")

        return widget_id

    def install_demo(widget_id, package_dir, existing_inst_id=None):
        # add the demo
        json_file = os.path.join(package_dir, "demo.json")
        if os.path.isfile(json_file):
            demo_file = open(json_file, "rb")
            demo_data = json.load(demo_file)
            demo_text = json.dumps(demo_data)

            WidgetInstallerService.validate_demo(demo_data)
            try:
                demo_text = WidgetInstallerService.preprocess_json_and_upload_assets(
                    package_dir, demo_text
                )
            except Exception as e:
                logger.info(e)
                raise Exception("Error processing demo JSON and embedding assets")

            demo_data = json.loads(demo_text)

            qset = WidgetQset()
            qset.version = demo_data["qset"]["version"]
            qset.set_data(demo_data["qset"]["data"])

            if existing_inst_id:
                # update the existing instance by adding a new qset
                widget_instance = WidgetInstance.objects.filter(
                    pk=existing_inst_id
                ).first()
                if widget_instance is None:
                    raise Exception("Could not load existing widget instance")

                widget_instance.name = demo_data["name"]
                widget_instance.is_draft = False
                widget_instance.guest_access = True
                qset.instance = widget_instance

                try:
                    widget_instance.save()
                    qset.save()
                except Exception:
                    logger.error("Error updating demo instance", exc_info=True)
            else:
                # new instance, nothing to upgrade
                widget = Widget.objects.filter(pk=widget_id).first()
                if widget is None:
                    raise Exception("Could not load widget engine")

                widget_instance = WidgetInstance(
                    user=None,
                    name=demo_data["name"],
                    is_draft=False,
                    created_at=timezone.now(),
                    widget=widget,
                    is_student_made=False,
                    guest_access=True,
                    attempts=-1,
                )
                qset.instance = widget_instance

                try:
                    widget_instance.save()
                    qset.save()
                except Exception:
                    logger.error("Error saving new demo instance", exc_info=True)

            # TODO: this was originally a static output - may have to change this, maybe not?
            logger.info("Demo installed: %s", widget_instance.id)
            return widget_instance.id

    def validate_demo(demo_data):
        if "name" not in demo_data:
            raise Exception("Missing name in demo")
        if "qset" not in demo_data:
            raise Exception("Missing qset in demo")
        if "data" not in demo_data["qset"]:
            raise Exception("Missing qset data in demo")
        if "version" not in demo_data["qset"]:
            raise Exception("Missing qset version in demo")
        return True

    def preprocess_json_and_upload_assets(base_dir, json_text):
        import re

        pattern = re.compile(r"<%\s*MEDIA\s*=\s*('|\")([^'\"]*?)\1\s*%>")

        preprocess_tags = []
        files_to_upload = []
        files_uploaded = []
        asset_ids = {}
        for m in pattern.finditer(json_text):
            preprocess_tags.append(m.group(0))
            files_to_upload.append(m.group(2))

        for i in range(len(files_to_upload)):
            file = files_to_upload[i]
            if file not in files_uploaded:
                actual_file_path = os.path.join(
                    "/", base_dir.strip("/"), file.lstrip("/")
                )
                sideloaded_asset = WidgetInstallerService.sideload_asset(
                    actual_file_path
                )
                asset_ids[file] = sideloaded_asset.id
                files_uploaded.append(file)
            asset_id = asset_ids[file]
            json_text = json_text.replace(preprocess_tags[i], asset_id)

        return json_text

    # "uploads" an asset from a widget package
    def sideload_asset(file):
        from core.services.asset_service import AssetService

        try:
            upload_info = os.stat(file)
            asset = AssetService.new_asset_from_file(
                f"Demo asset {os.path.basename(file)}",
                upload_info,
                file,
            )
            return asset

        except Exception as e:
            logger.info(e)
            raise e

    def install_widget_files(id, clean_name, source_path):
        import shutil

        widget_dir = f"{id}-{clean_name}{os.sep}"
        target_dir = os.path.join(settings.DIRS["widgets"], widget_dir)
        if os.path.isdir(target_dir):
            shutil.rmtree(target_dir)
        shutil.copytree(source_path, target_dir)
        logger.info("Widget files deployed %s", widget_dir)

    @staticmethod
    def uninstall_widget_files(id, clean_name):
        import shutil

        widget_dir = f"{id}-{clean_name}{os.sep}"
        target_dir = os.path.join(settings.DIRS["widgets"], widget_dir)
        shutil.rmtree(target_dir)

    @staticmethod
    def get_latest_version_for(widget_id: int) -> tuple[str, str, str]:
        # Grab widget
        widget = Widget.objects.filter(id=widget_id).first()
        if widget is None:
            raise MsgNotFound(msg=f"Widget with ID {widget_id} not found")

        # Check metadata
        update_method = widget.metadata.get("update_method")
        if update_method is None:
            raise MsgFailure(
                msg=f"Widget {widget_id} '{widget.name}' does not have a update method set"
            )

        if update_method not in (x[0] for x in Widget.UPDATE_METHODS):
            raise MsgFailure(
                msg=f"Widget {widget_id} '{widget.name}' requests a update method of "
                f"'{widget.metadata["update_method"]}', which is not supported"
            )

        match update_method:
            case "github":
                result = WidgetInstallerService._get_latest_release_github(
                    widget.metadata
                )
            case _:
                raise MsgFailure(msg="Unsupported update method")

        new_ver, wigt_url, checksum_url = result

        if new_ver is None or wigt_url is None or checksum_url is None:
            raise MsgFailure(msg="Unknown Error")

        return new_ver, wigt_url, checksum_url

    @staticmethod
    def needs_update(widget_id: int, latest_available_version: str) -> bool:
        update_available = True
        widget = Widget.objects.filter(id=widget_id).first()
        installed_version = widget.metadata["version"]

        # Clean version vars
        if latest_available_version.lower().startswith("v"):
            latest_available_version = latest_available_version[1:]
        if installed_version.lower().startswith("v"):
            installed_version = installed_version[1:]

        # Check
        if latest_available_version <= installed_version:
            update_available = False

        return update_available

    @staticmethod
    def _get_latest_release_github(widget_metadata) -> tuple[str, str, str]:
        """
        Returns the latest release for a widget from GitHub
        """
        # Grab repo from metadata
        repo = widget_metadata.get("repo")
        if repo is None:
            raise MsgFailure(msg="Widget does not have a repo set")

        # Check if repo field is a full github URL. If so, take out the author and repo name.
        if "github.com" in repo:
            repo = repo.strip("/")
            parts = repo.split("/")
            author, repo_name = parts[-2:]
            repo = f"{author}/{repo_name}"

        # Ping server for latest releases
        releases_json = WidgetInstallerService._get_json(
            f"https://api.github.com/repos/{repo}/releases"
        )
        if len(releases_json) == 0:
            raise MsgFailure(msg="Github returned no releases for this widget")

        latest = releases_json[0]
        version = latest["tag_name"]
        wigt_url = None
        checksum_url = None

        # Find our .wigt and checksum assets
        for asset in latest["assets"]:
            if asset["name"].endswith("build-info.yml"):
                checksum_url = asset["browser_download_url"]
            elif asset["name"].endswith(".wigt"):
                wigt_url = asset["browser_download_url"]

        if wigt_url is None or checksum_url is None:
            raise MsgFailure(
                msg=f"A release was found ({version}), but the required assets were not found"
            )

        return version, wigt_url, checksum_url

    @staticmethod
    def _get_json(url: str) -> dict:
        """
        Fetches a URL and processes it as JSON, with error checking baked in.
        """
        try:
            resp = urllib3.request("GET", url, timeout=10)
            if math.floor(resp.status) != 200:  # Check status
                raise MsgFailure(
                    msg=f"Update server returned with status {resp.status}"
                )
            json_resp = resp.json()  # Decode JSON
            return json_resp
        except MaxRetryError:
            raise MsgFailure(msg="Connection to the update server has timed out")
        except JSONDecodeError:
            raise MsgFailure(
                msg="Unable to decode JSON response returned from update server"
            )
        except Exception:
            raise MsgFailure(
                msg="Unable to update due to an error connecting to the update server"
            )
