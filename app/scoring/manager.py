import json
import math
import importlib
from pathlib import Path
from django.db.models import Case, When, F, Count, Avg
from django.db.models.functions import Round
from core.models import WidgetInstance, DateRange, LogPlay, UserExtraAttempts


class ScoringUtil:
    @staticmethod
    def dynamic_import(full_path):
        #find where ever the widget path is
        module_name, class_name = full_path.rsplit('.', 1)
        mod = importlib.import_module(module_name)
        return getattr(mod, class_name)


    @staticmethod
    def get_instance_score_history(instance: WidgetInstance, context_id: str = None, semester: DateRange = None, user_id: int = None):
        scores = LogPlay.objects.filter(
            is_complete=True,
            instance=instance,
        ).only("-created_at").only("id", "created_at", "percent").order_by("-created_at")

        if user_id:
            scores = scores.filter(user=user_id)
        if context_id:
            scores = scores.filter(context_id=context_id)
        if semester:
            scores = scores.filter(semester=semester)

        return list(scores.values("id", "created_at", "percent"))


    @staticmethod
    def get_instance_extra_attempts(instance: WidgetInstance, context_id: str, semester: DateRange):
        # TODO select only extra_attempts - see php
        result = UserExtraAttempts.objects.filter(
            instance=instance,
            context_id=context_id,
            semester=semester.id,  # TODO: model calls for id and not foreign key
            # TODO: user_id =
        ).first()

        return result.extra_attempts if result else 0


    @staticmethod
    def get_guest_instance_score_history(instance: WidgetInstance, play_id: str):
        # TODO: I don't see the point of filtering by the other options? I think the PK should be just fine
        return LogPlay.objects.filter(
            pk=play_id,
            instance=instance,
            is_complete=True,
        ).order_by("-created_at")



    # Get score and play details for a SessionPlay
    @staticmethod
    def get_play_details(session_play):
        """Finds score module, runs it, and returns the details"""

        from util.logging.session_play import SessionPlay
        import os
        instance = session_play.data.instance
        play = session_play.data
        widget_folder = f"staticfiles/widget/{instance.widget.id}-{instance.widget.clean_name}/_score-modules"

        print("========================DEBUG=========================")
        print(f"Widget folder: {widget_folder}")
        print(f"clean_name: {instance.widget.clean_name}")
        print("========================DEBUG=========================")
        script_path = os.path.join(widget_folder, "score_module.py")
        # print("DEBUG: Attempting to load:", script_path)

        # read the file’s text
        code = Path(script_path).read_text()

        import types
        mod = types.ModuleType("temp_score_module")
        exec(code, mod.__dict__)

        # Now pick the class name from widget.score_module
        ScoreClass = getattr(mod, instance.widget.score_module, None)
        if not ScoreClass:
            raise Exception("No score module found")

        score_module = ScoreClass(
            play_id=play.id,
            instance=instance,
            play=play
        )
        # Load logs
        score_module.logs = session_play.get_logs()
        # Run validation
        score_module.validate_scores(play.created_at)

        # Build scoreboard
        # print("========================DEBUG=========================")
        details = score_module.get_score_report()
        # print("========================DEBUG=========================")
        # print(details)

        # Optionally attach Qset
        instance.get_qset(instance.id, play.created_at)
        # details["qset"] = instance.qset
        if hasattr(instance.qset, "as_json"):
            details["qset"] = instance.qset.as_json()
        else:
            details["qset"] = {"version": None, "data": None}

        import datetime

        def json_serial(obj):
            if isinstance(obj, datetime.datetime):
                return obj.isoformat()  # Converts datetime to "YYYY-MM-DDTHH:MM:SS"
            raise TypeError(f"Type {type(obj)} not serializable")

        import json

        # print("\n=== DEBUG: API Response (get_play_details) ===\n")
        # print(json.dumps(details, indent=4, default=json_serial))
        # print("\n============================================\n")


        # print("again========================DEBUG=========================")
        # print(details)
        # print("========================DEBUG=========================")


        return details


    # Selects the number of scores in each bracket (where bracket 0 is 0% - 9%, bracket 1 is, 10% - 19%, etc.)
    # for each semester, ordered by semester for the given widget instance. Note that 100% is lumped into bracket 9.
    # This query uses all scores, not just the highest score of a player.
    @staticmethod
    def get_widget_score_distribution(instance: WidgetInstance) -> dict[int, dict]:
        plays_per_bracket_and_semester = (LogPlay.objects
          .filter(instance=instance, is_complete=True)
          .annotate(bracket=Case(When(percent__gte=100, then=99.0), default=F("percent")) / 10)
          .annotate(term_id=F("semester__id"))
          .values("bracket", "term_id")  # Groups by bracket and term id
          .annotate(players=Count('*'), year=F("semester__year"),
                    term=F("semester__semester"))  # Add additional useful fields
          # .order_by(-F("semester__start_at")) TODO
          )

        print(plays_per_bracket_and_semester)

        # Process results
        semesters = {}
        for plays in plays_per_bracket_and_semester:
            # Remove any erroneous > 100% scores
            if plays["bracket"] > 9:
                continue

            semester_id = plays["term_id"]
            if semester_id not in semesters:
                semesters[semester_id] = {
                    "id": semester_id,
                    "year": plays["year"],
                    "term": plays["term"],
                    "distribution": [0] * 10
                }

            semesters[semester_id]["distribution"][math.floor(plays["bracket"])] = plays["players"]

        return semesters


    # grabs the average score and number of plays for a widget instance per semester.
    @staticmethod
    def get_widget_score_summary(instance: WidgetInstance) -> dict[int, dict]:
        results = (LogPlay.objects
           .filter(instance=instance, is_complete=True)
           .annotate(term_id=F("semester__id"))
           .values("term_id")# group by term_id
           .annotate(average=Round(Avg("percent")))
           .annotate(students=Count("user_id", distinct=True))
           .annotate(year=F("semester__year"), term=F("semester__semester"))
        )

        # Convert query set into a dict + fix some data
        summaries = {}
        for d in results:
            summaries[d["term_id"]] = d
            summaries[d["term_id"]]["id"] = d["term_id"]
            del summaries[d["term_id"]]["term_id"]

        return summaries

