from core.models import DateRange, LogPlay
from django.core.cache import cache
from django.utils import timezone


class SemesterService:
    @staticmethod
    def get_current_semester() -> DateRange:
        # Check cache
        cached_result = cache.get("current-semester")
        if cached_result is not None:
            return cached_result

        # Find current semester by current time
        now = timezone.now()
        cur_semester = DateRange.objects.filter(
            start_at__lt=now, end_at__gt=now
        ).first()
        if cur_semester is None:
            raise Exception(
                "No current semester found! Please ensure a semester exists for the current time."
            )

        # Cache it and return
        cache.set("current-semester", cur_semester, 86400)  # cache for 24hrs
        return cur_semester

    @staticmethod
    def get_semester_by_id(id) -> DateRange:

        cached_result = cache.get(f"semester-{id}")
        if cached_result is not None:
            return cached_result

        semester = DateRange.objects.filter(pk=id).first()

        if semester is not None:
            cache.set(f"semester-{id}", semester, 86400)

        return semester

    # performance-sensitive method to locate the nearest (chronologically) semester that contains play logs
    @staticmethod
    def find_nearest_semester_with_logs(
        instance, ordered_semesters
    ) -> DateRange | None:
        for candidate in ordered_semesters:
            if LogPlay.objects.filter(
                instance=instance, semester_id=candidate.id
            ).exists():
                return candidate

        return None

    # performance-sensitive method to identify all semesters that contain play logs for a give instance
    @staticmethod
    def get_semester_ids_with_logs(instance) -> list[int]:
        semester_ids = (
            LogPlay.objects.filter(instance=instance)
            .order_by()
            .values_list("semester_id", flat=True)
            .distinct()
        )

        return list(
            DateRange.objects.filter(id__in=list(semester_ids)).order_by("-start_at")
        )
