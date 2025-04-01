from core.models import DateRange
from django.utils.timezone import now


class Semester:
    @staticmethod
    def get_current_semester():
        """Returns the current semester based on today's date."""
        return DateRange.objects.filter(start_at__lte=now(), end_at__gte=now()).first()
