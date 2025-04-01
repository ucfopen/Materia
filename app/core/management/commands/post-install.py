import logging
import re

from dateutil import parser, tz
from django.conf import settings
from django.contrib.auth.models import Group
from django.core.management import base

logger = logging.getLogger("django")


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
        except Exception as e:
            logger.info(e)
            logger.exception("")

    def populate_default_groups(self):
        support_group, created_support_group = Group.objects.get_or_create(name='support_user')
        if created_support_group:
            logger.info("support_user group created")

        author_group, created_author_group = Group.objects.get_or_create(name='basic_author')
        if created_author_group:
            logger.info("basic_author group created")

        # TODO add perms to both groups

    def populate_dateranges(self, start_year, end_year):

        if not re.match(r'^\d{4}$', start_year):
            raise ValueError('start_year must be a 4-digit year')
        if not re.match(r'^\d{4}$', end_year):
            raise ValueError('end_year must be a 4-digit year')

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
