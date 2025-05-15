from django.core.cache import cache
from django.utils import timezone

from core.models import DateRange


class SemesterUtil:
    @staticmethod
    def get_current_semester() -> DateRange:
        # Check cache
        cached_result = cache.get("current-semester")
        if cached_result is not None:
            return cached_result

        # Find current semester by current time
        now = timezone.now()
        cur_semester = DateRange.objects.filter(start_at__lt=now, end_at__gt=now).first()
        if cur_semester is None:
            raise Exception("No current semester found! Please ensure a semester exists for the current time.")

        # Cache it and return
        cache.set("current-semester", cur_semester, 86400)  # cache for 24hrs
        return cur_semester
