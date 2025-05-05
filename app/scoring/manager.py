import datetime
import importlib
import json
import math
from pathlib import Path

from core.models import DateRange, LogPlay, UserExtraAttempts, WidgetInstance
from django.db.models import Avg, Case, Count, F, When
from django.db.models.functions import Round


class ScoringUtil:
    @staticmethod
    def dynamic_import(full_path):
        # find where ever the widget path is
        module_name, class_name = full_path.rsplit(".", 1)
        mod = importlib.import_module(module_name)
        return getattr(mod, class_name)

    @staticmethod
    def get_instance_score_history(
        instance: WidgetInstance,
        context_id: str = None,
        semester: DateRange = None,
        user_id: int = None,
    ):
        scores = (
            LogPlay.objects.filter(
                is_complete=True,
                instance=instance,
            )
            .only("-created_at")
            .only("id", "created_at", "percent")
            .order_by("-created_at")
        )

        if user_id:
            scores = scores.filter(user=user_id)
        if context_id:
            scores = scores.filter(context_id=context_id)
        if semester:
            scores = scores.filter(semester=semester)

        return list(scores.values("id", "created_at", "percent"))

    @staticmethod
    def get_instance_extra_attempts(
        instance: WidgetInstance, context_id: str, semester: DateRange
    ):
        # TODO select only extra_attempts - see php
        result = UserExtraAttempts.objects.filter(
            instance=instance,
            context_id=context_id,
            semester=semester.id,  # TODO: model calls for id and not foreign key
            # TODO: user_id =
        ).first()

        return result.extra_attempts if result else 0

    @staticmethod
    def get_widget_score_distribution(instance: WidgetInstance) -> dict[int, dict]:
        """selects the number of scres in each bracket, for each esmeter ordered by semester for the given widget sintance.
        0%-9% would be in bracket 0, 10-19% is in bracket 1, etc. 100% is in bracket 9
        """
        plays_per_bracket_and_semester = (
            LogPlay.objects.filter(instance=instance, is_complete=True)
            .annotate(
                bracket=Case(When(percent__gte=100, then=99.0), default=F("percent"))
                / 10
            )
            .annotate(term_id=F("semester__id"))
            .values("bracket", "term_id")  # Groups by bracket and term id
            .annotate(
                players=Count("*"),
                year=F("semester__year"),
                term=F("semester__semester"),
            )
            # .order_by(-F("semester__start_at")) TODO
        )

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
                    "distribution": [0] * 10,
                }

            semesters[semester_id]["distribution"][math.floor(plays["bracket"])] = (
                plays["players"]
            )

        return semesters

    @staticmethod
    def get_widget_score_summary(instance: WidgetInstance) -> dict[int, dict]:
        """grabs the average score and number of plays for a widget instance for each semester"""
        results = (
            LogPlay.objects.filter(instance=instance, is_complete=True)
            .annotate(term_id=F("semester__id"))
            .values("term_id")  # group by term_id
            .annotate(average=Round(Avg("percent")))
            .annotate(students=Count("user_id", distinct=True))
            .annotate(year=F("semester__year"), term=F("semester__semester"))
        )

        # convert query set into a dict + fix some data
        summaries = {}
        for d in results:
            summaries[d["term_id"]] = d
            summaries[d["term_id"]]["id"] = d["term_id"]
            del summaries[d["term_id"]]["term_id"]

        return summaries

    @staticmethod
    def load_score_class(script_path: str, instance: WidgetInstance):
        code = Path(script_path).read_text()
        import types

        mod = types.ModuleType("temp_score_module")
        exec(code, mod.__dict__)
        return getattr(mod, instance.widget.score_module, None)

    @staticmethod
    def run_score_module(
        session_play, instance: WidgetInstance, ScoreClass, created_at
    ):
        play = session_play.data
        score_module = ScoreClass(play_id=play.id, instance=instance, play=session_play)
        score_module.logs = session_play.get_logs()
        score_module.validate_scores(timestamp=created_at)
        return score_module.get_score_report()

    # Get score and play details for a SessionPlay
    @staticmethod
    def get_play_details(session_play):
        """Finds score module, runs it, and returns the details"""

        import os

        from util.logging.session_play import SessionPlay

        instance = session_play.data.instance
        widget_folder = f"staticfiles/widget/{instance.widget.id}-{instance.widget.clean_name}/_score-modules"
        script_path = os.path.join(widget_folder, "score_module.py")

        ScoreClass = ScoringUtil.load_score_class(script_path, instance)
        if not ScoreClass:
            raise Exception("No score module found")

        # gets the score report
        details = ScoringUtil.run_score_module(
            session_play, instance, ScoreClass, session_play.data.created_at
        )

        qset = instance.get_qset_for_play(session_play.data.id)
        from core.serializers import QuestionSetSerializer

        details["qset"] = (
            QuestionSetSerializer(qset).data
            if qset
            else {"version": None, "data": None}
        )

        import datetime

        # def json_serial(obj):
        #     if isinstance(obj, datetime.datetime):
        #         return obj.isoformat()  # Converts datetime to "YYYY-MM-DDTHH:MM:SS"
        #     raise TypeError(f"Type {type(obj)} not serializable")
        import json

        if isinstance(details["qset"], dict):
            details["qset"].pop("questions_list", None)

        # print("\n=== DEBUG: API Response (get_play_details) ===\n")
        # print(json.dumps(details, indent=4, default=json_serial))

        return details

    @staticmethod
    def get_preview_play_details(session, widget_instance, preview_play_id):
        """Same as get_play_details but for previews where they are not stored in database and only are available in session."""

        import os
        import types

        from util.logging.session_play import SessionPlay

        widget_folder = f"staticfiles/widget/{widget_instance.widget.id}-{widget_instance.widget.clean_name}/_score-modules"
        script_path = os.path.join(widget_folder, "score_module.py")

        ScoreClass = ScoringUtil.load_score_class(script_path, widget_instance)
        if not ScoreClass:
            raise Exception("No score module found")

        session_play = SessionPlay.get_preview_play(session, preview_play_id)
        if not session_play:
            raise Exception("Invalid preview play session")

        details = ScoringUtil.run_score_module(
            session_play,
            widget_instance,
            ScoreClass,
            session_play.data.created_at,
        )

        widget_instance.get_qset(widget_instance.id, session_play.data.created_at)
        details["qset"] = (
            widget_instance.qset.as_json()
            if hasattr(widget_instance.qset, "as_json")
            else {"version": None, "data": None}
        )

        return details

    @staticmethod
    def get_guest_play_details(
        session, instance: WidgetInstance, play_id: str, is_preview: bool
    ):
        """Attempts to reconstruct guest score from session. Falls back to LogPlay if session is missing."""
        import os
        import types

        from util.logging.session_play import SessionPlay

        print(f"Getting guest play details for play_id={play_id}")

        session_play = SessionPlay.get_preview_play(session, play_id)

        if not session_play:
            print("Preview play not found in session. Trying DB LogPlay...")
            session_play = LogPlay.objects.filter(pk=play_id, instance=instance).first()

        if not session_play:
            print("Still not found. Giving up.")
            return None

        if not isinstance(session_play, SessionPlay):
            sp = SessionPlay()
            sp.data = session_play  # session_play is a LogPlay
            sp.is_preview = False
            session_play = sp

        widget_folder = f"staticfiles/widget/{instance.widget.id}-{instance.widget.clean_name}/_score-modules"
        script_path = os.path.join(widget_folder, "score_module.py")
        print(f"Script path: {script_path}")

        ScoreClass = ScoringUtil.load_score_class(script_path, instance)
        print(f"ScoreClass: {ScoreClass}")
        if not ScoreClass:
            raise Exception("No score module found")

        logs = session_play.get_logs()
        created_at = getattr(session_play.data, "created_at", datetime.datetime.now())
        if not created_at:
            print("DEBUG: No created_at found in session_play.data")
        details = ScoringUtil.run_score_module(
            session_play, instance, ScoreClass, created_at
        )

        # do i still need this?
        if session_play.is_preview:
            qset = instance.get_qset_for_play(play_id, True)
        else:
            qset = instance.get_qset_for_play(play_id)

        from core.serializers import QuestionSetSerializer

        details["qset"] = (
            QuestionSetSerializer(qset).data
            if qset
            else {"version": None, "data": None}
        )
        if isinstance(details["qset"], dict):
            details["qset"].pop("questions_list", None)
        print("details: ", details)

        return details
