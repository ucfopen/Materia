import json
import logging
import re
import traceback

from core.management.commands.widget import Command as WidgetCommand
from core.message_exception import MsgException
from core.models import Widget
from core.services.widget_installer_service import WidgetInstallerService
from dateutil import parser, tz
from django.conf import settings
from django.contrib.auth.models import Group
from django.core.management import base

logger = logging.getLogger(__name__)


class Command(base.BaseCommand):
    help = "Initial installation and setup tasks"

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

    def populate_db(self):
        from django.core.management import call_command

        # 1. Run database migrations
        call_command("migrate")

        # 2. Populate default groups
        self.populate_default_groups()

        # 3. Populate date ranges from 2020 to 2032
        self.populate_dateranges("2020", "2032")

        logger.info("Database successfully populated with initial data")

    def populate_default_groups(self):
        support_group, created_support_group = Group.objects.get_or_create(
            name="support_user"
        )
        if created_support_group:
            logger.info("support_user group created")

        author_group, created_author_group = Group.objects.get_or_create(
            name="basic_author"
        )
        if created_author_group:
            logger.info("basic_author group created")

        # TODO add perms to both groups

    def populate_dateranges(self, start_year, end_year):

        if not re.match(r"^\d{4}$", start_year):
            raise ValueError("start_year must be a 4-digit year")
        if not re.match(r"^\d{4}$", end_year):
            raise ValueError("end_year must be a 4-digit year")

        start_year = int(start_year)
        end_year = int(end_year)

        semesters = settings.SEMESTERS[0]

        year_counter = start_year

        while end_year >= year_counter:

            seasons = list(semesters.keys())
            for i, season in enumerate(seasons):

                semester = semesters[season]

                if i + 1 < len(seasons):

                    next_season = seasons[i + 1]
                    next_semester = semesters[next_season]

                    start_str = f"{semester["month"]}/{semester["day"]}/{year_counter} at 00:00:01"
                    end_str = f"{next_semester["month"]}/{next_semester["day"]}/{year_counter} at 00:00:00"
                else:
                    start_str = f"{semester["month"]}/{semester["day"]}/{year_counter} at 00:00:01"
                    end_str = f"01/01/{year_counter + 1} at 00:00:00"

                start_at = parser.parse(start_str).replace(tzinfo=tz.UTC)
                end_at = parser.parse(end_str).replace(tzinfo=tz.UTC)

                from core.models import DateRange

                try:
                    range = DateRange()
                    range.semester = season
                    range.year = year_counter
                    range.start_at = start_at
                    range.end_at = end_at

                    range.save()
                except Exception as e:
                    print(e)

            year_counter = year_counter + 1

    def sync_widgets(self, sync_file=None):
        """
        Updates currently installed widgets that do not have update support enabled to the latest version.
        Latest versions will have the new python score modules, and update support enabled.

        By default, this command specifically targets UCF-created Materia widgets
        A separate .json file containing clean_name -> repo pairings can be passed in to use as well.
        The JSON should look something like:
        {
            "my-widget": "github/repo",  // automatically assumed to use 'github' update method
            "my-other-widget": {  // use a dict for non-github update methods
                "method": "method that is not github",
                "params": {
                    // parameters that will get inserted into the metadata
                    // for 'github', that would be 'repo'
                    "other-param": "value"
                }
            }
        }
        """

        # Determine target widgets
        if sync_file is not None:
            # Load in sync file and use that instead of the default list
            print(f"Using custom sync file: {sync_file}")
            with open(sync_file, "r") as f:
                try:
                    target_widgets = json.loads(f.read())
                except Exception as e:
                    print(
                        f"Error parsing custom sync file - it is likely not valid JSON: {e}"
                    )
                    traceback.print_exc()
                    return
        else:
            # Use default list
            print("Using default sync file")

            target_widgets = {
                "adventure": "ucfopen/adventure-materia-widget",
                "crossword": "ucfopen/crossword-materia-widget",
                "enigma": "ucfopen/enigma-materia-widget",
                "equation-sandbox": "ucfopen/equation-sandbox-materia-widget",
                "flash-cards": "ucfopen/flash-cards-materia-widget",
                "guess-the-phrase": "ucfopen/guess-the-phrase-materia-widget",
                "labeling": "ucfopen/labeling-materia-widget",
                "last-chance-cadet": "ucfopen/last-chance-cadet-materia-widget",
                "matching": "ucfopen/matching-materia-widget",
                "normal-distribution-calculator": "ucfopen/normal-distribution-calculator-materia-widget",
                "radar-grapher": "ucfopen/radar-grapher-materia-widget",
                "secret-spreadsheet": "ucfopen/secret-spreadsheet-materia-widget",
                "sequencer": "ucfopen/sequencer-materia-widget",
                "simple-survey": "ucfopen/survey-materia-widget",
                "slope-finder": "ucfopen/slope-finder-materia-widget",
                "sort-it-out": "ucfopen/sort-it-out-materia-widget",
                "syntax-sorter": "ucfopen/syntax-sorter-materia-widget",
                "this-or-that": "ucfopen/this-or-that-materia-widget",
                "word-search": "ucfopen/word-search-materia-widget",
                "be-finder": "ucfopen/be-finder-materia-widget",
                "word-guess": "ucfopen/word-guess-materia-widget",
            }

        # Start update process - go through each widget
        widgets = Widget.objects.all()

        no_matches = []
        synced = []
        failed_updates = []

        for widget in widgets:
            # See if widget is in our list of updatable widgets
            print()
            print(f"Syncing {widget.name} ({widget.id})...")
            if widget.clean_name not in target_widgets.keys():
                print(" -> Not an updatable widget, skipping")
                no_matches.append((widget.id, widget.name))
                continue

            print(" -> Is a syncable widget! Injecting update metadata...")
            update_metadata = target_widgets[widget.clean_name]
            if isinstance(update_metadata, str):
                # When update_metadata is just a string, it's assumed it is just a github repo
                widget.metadata["update_method"] = "github"
                widget.metadata["repo"] = update_metadata
            elif isinstance(update_metadata, dict):
                # Otherwise, when it's an object, allow for custom needs
                widget.metadata["update_method"] = update_metadata["method"]
                for key, value in update_metadata["params"].items():
                    widget.metadata[key] = value
            else:
                print(" -> Invalid update metadata, skipping")
                failed_updates.append((widget.id, widget.name))
                continue

            widget.save()

            print(" -> Getting latest version... ", end="")
            try:
                # Get latest version and links
                new_ver, wigt_link, checksum_link = (
                    WidgetInstallerService.get_latest_version_for(widget.id)
                )
                print(new_ver)

                # Install latest version
                print(" -> Updating...")
                widget_command = WidgetCommand()
                widget_command.install_from_url(wigt_link, checksum_link, widget.id)
                print(" -> Done!")
                synced.append((widget.id, widget.name))
            except MsgException as e:
                print("Failed to update:")
                print(f"     - {e.title}")
                print(f"     - {e.msg}")
                failed_updates.append((widget.id, widget.name))
            except Exception:
                failed_updates.append((widget.id, widget.name))
                print("Failed to update, traceback follows")
                traceback.print_exc()

        # Print summary
        print("\nFinished syncing widgets! Results:")

        print("\nThe following widgets were synced successfully:")
        for widget_id, widget_name in synced:
            print(f" - {widget_name} ({widget_id})")

        print("\nThe following widgets could be synced, but failed:")
        for widget_id, widget_name in failed_updates:
            print(f" - {widget_name} ({widget_id})")

        print("\nThe following widgets were not eligible for sync:")
        for widget_id, widget_name in no_matches:
            print(f" - {widget_name} ({widget_id})")
