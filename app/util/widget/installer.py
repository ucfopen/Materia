import logging
import os
import tempfile
from datetime import datetime

from core.models import (
    PermObjectToUser,
    Widget,
    WidgetInstance,
    WidgetMetadata,
    WidgetQset,
)
from django.conf import settings
from django.utils.timezone import make_aware

logger = logging.getLogger("django")


class WidgetInstaller:

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
    def extract_package_files(widget_file, widget_id):
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

    def extract_package_and_install(widget_file, skip_upgrade=False, replace_id=0):
        from core.models import LogActivity

        activity = LogActivity()
        # this will have to change - maybe by passing a user into this function as an arg
        # the intention is that whether this function is run from the console or as a result of
        #  the widget admin panel, the 'current user' will be findable in order to associate this
        #  action with them
        activity.user = None
        dir, manifest_data, clean_name = WidgetInstaller.unzip_and_read_manifest(
            widget_file
        )

        # check for existing widgets
        matching_widgets = Widget.objects.filter(clean_name=clean_name)
        num_existing = len(matching_widgets)

        if skip_upgrade and num_existing > 0:
            # TODO: see if it's possible to recreate this block
            # pretty much just produces special contextual output if this is running in a terminal
            # if (\Fuel::$is_cli)
            # {
            #     \Cli::write("Multiple Existing widgets found with name $clean_name", 'red');
            #     foreach ($matching_widgets as $i => $matching_widget)
            #     {
            #         \Cli::write("==> ID:{$matching_widget['id']} ({$matching_widget['name']})", 'green');
            #     }
            #     \Cli::write('Run install again with "--replace-id=ID" option', 'yellow');
            #     return false;
            # }
            # else

            # this would normally run in the 'else' of the block above
            raise Exception(
                f"Existing widgets found for {clean_name}, not upgrading due to --skip-upgrade option"
            )
        if num_existing > 0 and replace_id == 0:
            raise Exception(f"Multiple existing widgets share clean name {clean_name}")
        if num_existing == 1 and not skip_upgrade and replace_id == 0:
            replace_id = matching_widgets[0].id

        params = WidgetInstaller.generate_install_params(manifest_data, widget_file)
        existing_demo_inst_id = None

        id = None

        # NEW
        if not replace_id:
            logger.info("Installing brand new widget")
            id = WidgetInstaller.save_params(params)
            activity.type = LogActivity.TYPE_INSTALL_WIDGET
        # UPGRADE
        else:
            logger.info("Upgrading existing widget")
            try:
                existing_widget = Widget.objects.get(id=replace_id)
                existing_widget_metadata = existing_widget.metadata_clean()
                if "demo" in existing_widget_metadata:
                    existing_demo_inst_id = existing_widget_metadata["demo"]
                    logger.info(f"Existing demo found: {existing_demo_inst_id}")

            except Widget.DoesNotExist:
                pass

            id = WidgetInstaller.save_params(params)
            activity.type = LogActivity.TYPE_UPDATE_WIDGET

        # add the demo
        demo_id = WidgetInstaller.install_demo(id, dir, existing_demo_inst_id)
        manifest_data["meta_data"]["demo"] = demo_id

        logger.info("demo installed")

        WidgetInstaller.install_widget_files(id, clean_name, dir)

        # save metadata
        WidgetInstaller.save_metadata(id, manifest_data["meta_data"])

        logger.info(f"Widget installed: {dir}")
        success = True
        activity.item_id = id
        activity.value_1 = clean_name
        activity.save()

        if bool(dir):
            from shutil import rmtree

            rmtree(dir)

        return success

    # Unzip a .wigt file into a temp directory, validate it, and extract manifest data
    # return array
    def unzip_and_read_manifest(widget_file):
        from core.models import Widget

        target_dir = WidgetInstaller.unzip_to_tmp(widget_file)
        manifest_data = WidgetInstaller.validate_widget(target_dir)

        clean_name = Widget.make_clean_name(manifest_data["general"]["name"])

        # TODO: figure out how to parse all of the play data exporter function options
        #  and add their names to the existing metadata
        # in the PHP version, the Widget::load_script function would basically make the
        #  class/methods/etc. in the play data exporter PHP file available in this scope
        #  so that they could be parsed

        # load the play data exporter script to add its method names to the metadata
        # playdata_path = os.path.join(target_dir, Widget.PATHS_PLAYDATA)

        # loaded = Widget.load_script(playdata_path)
        # $playdata_exporter_names = array_keys(\Materia\Widget::reduce_array_to_functions($loaded));
        playdata_exporter_names = []
        manifest_data["meta_data"]["playdata_exporters"] = playdata_exporter_names

        return target_dir, manifest_data, clean_name

    def unzip_to_tmp(file):
        from zipfile import ZipFile

        extract_location = WidgetInstaller.get_temp_dir()
        if not extract_location:
            raise Exception("Unable to extract widget.")
        # assume it's a zip file, attempt to extract
        try:
            logger.info(f"Extracting {file} to {extract_location}")
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

    # checks to make sure the widget contains the required data.
    # throws with the reason if not.
    def validate_widget(dir):
        # 1. Do we have a manifest yaml file?
        manifest_data = WidgetInstaller.get_manifest_data(dir)

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
        WidgetInstaller.validate_keys_exist(general, general_keys)
        WidgetInstaller.validate_numeric_values(general, ["width", "height"])
        WidgetInstaller.validate_boolean_values(
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
        WidgetInstaller.validate_keys_exist(files, ["player"])
        WidgetInstaller.validate_numeric_values(files, ["flash_version"])

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
        WidgetInstaller.validate_keys_exist(score, ["is_scorable", "score_module"])
        WidgetInstaller.validate_boolean_values(score, ["is_scorable"])

        # 6. Make sure the 'meta_data' section is correct
        metadata = manifest_data["meta_data"]
        WidgetInstaller.validate_keys_exist(metadata, ["about", "excerpt"])

        # 7. Make sure the score module and the score module test files both exist
        if not os.path.isfile(os.path.join(dir, "_score-modules/score_module.php")):
            raise Exception("Missing score module file")
        if not os.path.isfile(
            os.path.join(dir, "_score-modules/test_score_module.php")
        ):
            raise Exception("Missing score module tests")

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
        from util.widget.validator import ValidatorUtil

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
        from datetime import datetime
        from hashlib import md5

        from django.utils.timezone import make_aware

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
            "created_at": make_aware(datetime.now()),
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
            "score_module": manifest_data["score"]["score_module"],
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
        }

    def save_params(params, widget_id=None):
        # check for existing
        widget_obj = None
        try:
            # update
            widget_obj = Widget.objects.get(id=widget_id)
            # do not overwrite the in_catalog flag for existing widgets
            del params["in_catalog"]
            try:
                widget_obj.update(**params)
                widget_obj.save()
            # TODO: narrow down which kind(s) of Exception we should expect here
            except Exception as e:
                logger.info("Exception when updating existing widget params")
                logger.info(e)
                raise Exception(f"Failure updating existing widget data: {widget_id}")
        except Widget.DoesNotExist:
            # new
            try:
                widget_obj = Widget(**params)
                widget_obj.save()
                widget_id = widget_obj.id
            # TODO: narrow down which kind(s) of Exception we should expect here
            except Exception as e:
                logger.info("Exception when saving widget params")
                logger.info(e)
                raise Exception(f"Failure creating new widget: {widget_id}")

        # delete any existing metadata - it'll be rewritten in a subsequent step
        WidgetMetadata.objects.filter(widget_id=widget_id).delete()

        return widget_id

    def install_demo(widget_id, package_dir, existing_inst_id=None):
        import json

        # add the demo
        json_file = os.path.join(package_dir, "demo.json")
        if os.path.isfile(json_file):
            demo_file = open(json_file, "rb")
            demo_data = json.load(demo_file)
            demo_text = json.dumps(demo_data)

            WidgetInstaller.validate_demo(demo_data)
            try:
                demo_text = WidgetInstaller.preprocess_json_and_upload_assets(
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
                except Exception as e:
                    logger.error("Error updating demo instance:")
                    logger.error(e)
            else:
                # new instance, nothing to upgrade
                widget = Widget.objects.filter(pk=widget_id).first()
                if widget is None:
                    raise Exception("Could not load widget engine")

                widget_instance = WidgetInstance(
                    user=None,
                    name=demo_data["name"],
                    is_draft=False,
                    created_at=make_aware(datetime.now()),
                    widget=widget,
                    is_student_made=False,
                    guest_access=True,
                    attempts=-1,
                )
                qset.instance = widget_instance

                try:
                    widget_instance.save()
                    qset.save()
                except Exception as e:
                    logger.error("Error saving new demo instance:")
                    logger.error(e)

                # make sure nobody owns the demo widget
                access = PermObjectToUser.objects.filter(
                    object_id=widget_instance.id,
                    object_type=PermObjectToUser.ObjectType.INSTANCE,
                )
                for a in access:
                    a.delete()

            # TODO: this was originally a static output - may have to change this, maybe not?
            logger.info(f"Demo installed: {widget_instance.id}")
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
                sideloaded_asset = WidgetInstaller.sideload_asset(actual_file_path)
                asset_ids[file] = sideloaded_asset.id
                files_uploaded.append(file)
            asset_id = asset_ids[file]
            json_text = json_text.replace(preprocess_tags[i], asset_id)

        return json_text

    # "uploads" an asset from a widget package
    def sideload_asset(file):
        from util.widget.asset.manager import AssetManager

        try:
            upload_info = os.stat(file)
            asset = AssetManager.new_asset_from_file(
                f"Demo asset {os.path.basename(file)}",
                upload_info,
                file,
            )
            return asset

        except Exception as e:
            logger.info(e)
            raise e

    def save_metadata(widget_id, metadata):
        for meta_key in metadata:
            meta_value = metadata[meta_key]
            # TODO: simplify this
            if isinstance(meta_value, list):
                for meta_child_item in meta_value:
                    meta_obj = WidgetMetadata()
                    meta_obj.widget = Widget.objects.get(id=widget_id)
                    meta_obj.name = meta_key
                    meta_obj.value = meta_child_item
                    meta_obj.save()
            else:
                meta_obj = WidgetMetadata()
                meta_obj.widget = Widget.objects.get(id=widget_id)
                meta_obj.name = meta_key
                meta_obj.value = meta_value
                meta_obj.save()

    def install_widget_files(id, clean_name, source_path):
        import shutil

        widget_dir = f"{id}-{clean_name}{os.sep}"
        target_dir = os.path.join(settings.DIRS["widgets"], widget_dir)
        if os.path.isdir(target_dir):
            shutil.rmtree(target_dir)
        shutil.copytree(source_path, target_dir)
        logger.info(f"Widget files deployed: {widget_dir}")
