import base64
import json

import phpserialize
from core.models import DateRange, LogStorage
from django.contrib.auth import get_user_model
from django.db.models import OuterRef, Subquery


class LogStorageService:

    @staticmethod
    def build_log_tables_from_queryset(queryset, anonymize: bool = False):
        """
        Builds grouped log tables from a pre-filtered queryset.
        This is the core table assembly logic used by both the API and data exporters.

        Args:
            queryset: Pre-filtered LogStorage queryset
            anonymize: Whether to anonymize user information

        Returns:
            dict: {
                "<table_name>": [
                    {
                        "play": {...},
                        "data": {...}
                    },
                    ...
                ]
            }
        """
        tables = {}
        students = {}
        anon_index = 0
        User = get_user_model()

        for q in queryset:
            table_name = q.name
            tables.setdefault(table_name, [])
            raw = base64.b64decode(q.data)
            # Backwards-compatible decode
            try:
                data = phpserialize.loads(raw, decode_strings=True)
            except ValueError:
                data = json.loads(raw)
            data = dict(sorted(data.items()))

            if q.user_id not in students:
                if anonymize:
                    students[q.user_id] = {
                        "username": f"user{anon_index}",
                        "first_name": "User",
                        "last_name": str(anon_index),
                    }
                    anon_index += 1
                else:
                    user = (
                        User.objects.filter(id=q.user_id)
                        .only("username", "first_name", "last_name")
                        .first()
                    )
                    students[q.user_id] = user
            student = students.get(q.user_id)

            if isinstance(student, dict):
                username = student["username"]
                first = student["first_name"]
                last = student["last_name"]
            elif student:
                username = student.username
                first = student.first_name
                last = student.last_name
            else:
                username = "Guest"
                first = ""
                last = ""

            play = {
                "user": username,
                "firstName": first,
                "lastName": last,
                "time": q.created_at,
                "cleanTime": q.created_at.strftime("%m/%d/%Y %H:%M:%S %Z"),
                "play_id": q.play_log.id,
            }
            tables[table_name].append(
                {
                    "play": play,
                    "data": data,
                }
            )
        return tables

    @staticmethod
    def build_log_tables(
        instance_id: str, semester: str | None = None, anonymize: bool = False
    ):
        """
        Builds grouped log tables keyed by table name.
        This method handles queryset building and delegates to build_log_tables_from_queryset.

        Args:
            instance_id: The instance ID to filter logs
            semester: Optional semester filter in format "semester - year" (e.g., "Fall - 2024")
            anonymize: Whether to anonymize user information

        Returns:
            dict: {
                "<table_name>": [
                    {
                        "play": {...},
                        "data": {...}
                    },
                    ...
                ]
            }
        """
        date_ranges = DateRange.objects.filter(
            start_at__lte=OuterRef("created_at"),
            end_at__gte=OuterRef("created_at"),
        )

        if semester:
            try:
                semester_part, year_part = semester.split(" - ")
                date_ranges = date_ranges.filter(
                    semester=semester_part.strip(), year=int(year_part.strip())
                )
            except (ValueError, AttributeError):
                pass

        qs = LogStorage.objects.filter(instance_id=instance_id).annotate(
            date_range_id=Subquery(date_ranges.values("id")[:1]),
            year=Subquery(date_ranges.values("year")[:1]),
            term=Subquery(date_ranges.values("semester")[:1]),
        )

        if semester:
            qs = qs.filter(date_range_id__isnull=False)

        return LogStorageService.build_log_tables_from_queryset(qs, anonymize)
