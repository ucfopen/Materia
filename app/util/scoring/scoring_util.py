from core.models import WidgetInstance, DateRange, LogPlay


class ScoringUtil:
    @staticmethod
    def get_instance_score_history(instance: WidgetInstance, context_id: str | None = None, semester: DateRange | None = None):
        # TODO select only id, created_at, percent - see php
        scores = LogPlay.objects.filter(
            is_complete=True,
            instance=instance,
            # TODO: user_id =
        ).order_by("-created_at")

        if context_id:
            scores = scores.filter(context_id=context_id)
        if semester:
            scores = scores.filter(semester=semester)

        return scores