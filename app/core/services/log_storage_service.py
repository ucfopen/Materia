import base64
import json
import phpserialize

from django.contrib.auth import get_user_model
from django.db.models import OuterRef, Subquery

from core.models import LogStorage, DateRange

class LogStorageService():
    def build_log_tables(
        self,
        instance_id: str, 
        semester: str | None = None
    ):
        """
        Builds grouped log tables keyed by table name.
        Args:
            instance_id: The instance ID to filter logs
            semester: Optional semester filter in format "semester - year" (e.g., "Fall - 2024")
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
                    semester=semester_part.strip(),
                    year=int(year_part.strip())
                )
            except (ValueError, AttributeError):
                pass
        
        qs = (
            LogStorage.objects
            .filter(instance_id=instance_id)
            .annotate(
                date_range_id=Subquery(date_ranges.values("id")[:1]),
                year=Subquery(date_ranges.values("year")[:1]),
                term=Subquery(date_ranges.values("semester")[:1]),
            )
        )
        
        if semester:
            qs = qs.filter(date_range_id__isnull=False)
        
        tables = {}
        students = {}
        User = get_user_model()
        for q in qs:
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
                students[q.user_id] = (
                    User.objects
                    .filter(id=q.user_id)
                    .only("id", "username", "first_name", "last_name")
                    .first()
                )
            student = students.get(q.user_id)
            play = {
                "user": student.username if student else "Guest",
                "firstName": student.first_name if student else "",
                "lastName": student.last_name if student else "",
                "time": q.created_at,
                "cleanTime": q.created_at.strftime("%m/%d/%Y %H:%M:%S %Z"),
                "play_id": q.play_log.id,
            }
            tables[table_name].append({
                "play": play,
                "data": data,
            })
        return tables
