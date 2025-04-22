from core.models import DateRange


class SemesterUtil:
    @staticmethod
    def get_current_semester() -> DateRange:
        # TODO
        return DateRange.objects.all().first()
