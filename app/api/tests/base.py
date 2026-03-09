"""Base test case with common setup for all tests."""

from core.models import DateRange
from dateutil import parser, tz
from django.conf import settings
from django.contrib.auth.models import Group
from django.test import TestCase


class MateriaTestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        # database provisioning with default values
        cls._populate_dateranges()
        cls.author_group, _ = Group.objects.get_or_create(name="basic_author")
        cls.support_group, _ = Group.objects.get_or_create(name="support_user")
        cls.no_author_group, _ = Group.objects.get_or_create(name="no_author")

    @classmethod
    def _populate_dateranges(cls, start_year=2020, end_year=2032):
        semesters = settings.SEMESTERS[0]
        year_counter = start_year

        while end_year >= year_counter:
            seasons = list(semesters.keys())
            for i, season in enumerate(seasons):
                semester = semesters[season]

                if i + 1 < len(seasons):
                    next_season = seasons[i + 1]
                    next_semester = semesters[next_season]

                    start_str = f"{semester['month']}/{semester['day']}/{year_counter} at 00:00:01"
                    end_str = f"{next_semester['month']}/{next_semester['day']}/{year_counter} at 00:00:00"
                else:
                    start_str = f"{semester['month']}/{semester['day']}/{year_counter} at 00:00:01"
                    end_str = f"01/01/{year_counter + 1} at 00:00:00"

                start_at = parser.parse(start_str).replace(tzinfo=tz.UTC)
                end_at = parser.parse(end_str).replace(tzinfo=tz.UTC)

                DateRange.objects.get_or_create(
                    semester=season,
                    year=year_counter,
                    defaults={
                        "start_at": start_at,
                        "end_at": end_at,
                    },
                )

            year_counter += 1
