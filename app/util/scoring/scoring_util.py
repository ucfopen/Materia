import json
import math

from django.contrib.sessions.backends.base import SessionBase
from django.db.models import Case, When, F, Count, Avg
from django.db.models.functions import Round

from core.models import WidgetInstance, DateRange, LogPlay, UserExtraAttempts


# Util for getting and processing play sessions and generating scores
class ScoringUtil:
    @staticmethod
    def get_instance_score_history(
            instance: WidgetInstance, context_id: str | None = None,
            semester: DateRange | None = None
    ):
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
    def get_play_details(session_play: "util.logging.session_play.SessionPlay"):  # noqa: F821
        # TODO get user, see php
        instance = session_play.data.instance

        # TODO
        # if session_play.data.user != cur_user and not instance.guest_access:
        #     if ( ! Perm_Manager::user_has_any_perm_to($curr_user_id, $play->instId, Perm::INSTANCE, [Perm::VISIBLE, Perm::FULL]))  # noqa: E501
        # 					return new \Materia\Msg('permissionDenied','Permission Denied','You do not own the score data you are attempting to access.');  # noqa: E501

        # TODO
        # $class = $inst->widget->get_score_module_class();
        #
        # $score_module = new $class($play->id, $inst, $play);
        #
        # $score_module->logs = Session_Logger::get_logs($play->id);
        # $score_module->validate_scores($play->created_at);

        # // format results for the scorescreen
        # $details = $score_module->get_score_report();
        result = {
            # TODO: temporary score stuffs for Crossword while the stuff above is out of service
            "overview": json.loads(
                '{"complete":"1","score":18.181818181818183,"table":[{"message":"Points Lost","value":-81.81818181818181},{"message":"Final Score","value":18.181818181818183}],"referrer_url":"","created_at":1737138496,"auth":""}'),  # noqa: E501
            "details": json.loads(
                '[{"title":"Responses:","header":["Question Score","The Question","Your Response","Correct Answer"],"table":[{"data":["The tallest mountain in the world, and the ultimate challenge for mountain climbers everywhere.","everest","Everest"],"data_style":["question","response","answer"],"score":100,"feedback":null,"type":"SCORE_QUESTION_ANSWERED","style":"full-value","tag":"div","symbol":"%","graphic":"score","display_score":true},{"data":["A white marble mausoleum commissioned in 1632 by an emperor to house the tomb of his favorite wife of three.","___ ___-_____","The Taj-Mahal"],"data_style":["question","response","answer"],"score":0,"feedback":null,"type":"SCORE_QUESTION_ANSWERED","style":"no-value","tag":"div","symbol":"%","graphic":"score","display_score":true},{"data":["Home for the president of the United States of America.","___ _____ _____","The White House"],"data_style":["question","response","answer"],"score":0,"feedback":null,"type":"SCORE_QUESTION_ANSWERED","style":"no-value","tag":"div","symbol":"%","graphic":"score","display_score":true},{"data":["Mysterious landmark of several large standing stones arranged in a circle.","__________","Stonehenge"],"data_style":["question","response","answer"],"score":0,"feedback":null,"type":"SCORE_QUESTION_ANSWERED","style":"no-value","tag":"div","symbol":"%","graphic":"score","display_score":true},{"data":["This is one of the world\u0027s oldest statues - A lion with a human head that stands in the Giza Plateau.","______","Sphinx"],"data_style":["question","response","answer"],"score":0,"feedback":null,"type":"SCORE_QUESTION_ANSWERED","style":"no-value","tag":"div","symbol":"%","graphic":"score","display_score":true},{"data":["A monument built for the 1889 World\u0027s Fair, this metal structure can be found on the Champ de Mars in Paris.","____e_ _____","Eiffel Tower"],"data_style":["question","response","answer"],"score":9.090909090909092,"feedback":null,"type":"SCORE_QUESTION_ANSWERED","style":"partial-value","tag":"div","symbol":"%","graphic":"score","display_score":true}]}]'),  # noqa: E501
            "qset": instance.qset.as_dict()
        }

        # TODO dunno if we need to do this as a list; the og function in php is never called with more than one play_id
        return result

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
                    term=F("semester__semester")))  # Add additional useful fields
        # .order_by(-F("semester__start_at")) TODO

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

    # Grabs the average score and number of plays for a widget instance per semester.
    @staticmethod
    def get_widget_score_summary(instance: WidgetInstance) -> dict[int, dict]:
        results = (LogPlay.objects
           .filter(instance=instance, is_complete=True)
           .annotate(term_id=F("semester__id"))
           .values("term_id")  # Group by term_id
           .annotate(average=Round(Avg("percent")))  # Append aggregate info about that group
           .annotate(students=Count("user_id", distinct=True))
           .annotate(year=F("semester__year"), term=F("semester__semester"))  # Add other data fields
        )

        # Convert query set into a dict + fix some data
        summaries = {}
        for d in results:
            summaries[d["term_id"]] = d
            summaries[d["term_id"]]["id"] = d["term_id"]
            del summaries[d["term_id"]]["term_id"]

        return summaries

    # WAS: get_preview_logs()
    @staticmethod
    def get_preview_play_details(session: SessionBase, widget_instance: WidgetInstance, preview_id: str) -> dict | None:
        # TODO scoring stuff todo
        # Get and clear the preview log session
        session_key = f"preview_play_logs_{widget_instance.id}_{preview_id}"
        play_logs = session.get(session_key, None)
        # TODO NOTE play_logs is a list of dicts, not Log objects. this allows it to be serialized for use with
        #  sessions. just a note for whenever we end up using it for scoring logic here
        if play_logs is None:
            return None
        else:
            del session[session_key]

        # // run the data through the score module
        # 		$class = $inst->widget->get_score_module_class();
        # 		$score_module = new $class(-1, $inst);
        # 		$score_module->logs = $play_logs;
        # 		$score_module->validate_scores();

        result = {
            # TODO: temporary score stuffs for Crossword while the stuff above is out of service
            "overview": json.loads(
                '{"complete":"1","score":18.181818181818183,"table":[{"message":"Points Lost","value":-81.81818181818181},{"message":"Final Score","value":18.181818181818183}],"referrer_url":"","created_at":1737138496,"auth":""}'),  # noqa: E501
            "details": json.loads(
                '[{"title":"Responses:","header":["Question Score","The Question","Your Response","Correct Answer"],"table":[{"data":["The tallest mountain in the world, and the ultimate challenge for mountain climbers everywhere.","everest","Everest"],"data_style":["question","response","answer"],"score":100,"feedback":null,"type":"SCORE_QUESTION_ANSWERED","style":"full-value","tag":"div","symbol":"%","graphic":"score","display_score":true},{"data":["A white marble mausoleum commissioned in 1632 by an emperor to house the tomb of his favorite wife of three.","___ ___-_____","The Taj-Mahal"],"data_style":["question","response","answer"],"score":0,"feedback":null,"type":"SCORE_QUESTION_ANSWERED","style":"no-value","tag":"div","symbol":"%","graphic":"score","display_score":true},{"data":["Home for the president of the United States of America.","___ _____ _____","The White House"],"data_style":["question","response","answer"],"score":0,"feedback":null,"type":"SCORE_QUESTION_ANSWERED","style":"no-value","tag":"div","symbol":"%","graphic":"score","display_score":true},{"data":["Mysterious landmark of several large standing stones arranged in a circle.","__________","Stonehenge"],"data_style":["question","response","answer"],"score":0,"feedback":null,"type":"SCORE_QUESTION_ANSWERED","style":"no-value","tag":"div","symbol":"%","graphic":"score","display_score":true},{"data":["This is one of the world\u0027s oldest statues - A lion with a human head that stands in the Giza Plateau.","______","Sphinx"],"data_style":["question","response","answer"],"score":0,"feedback":null,"type":"SCORE_QUESTION_ANSWERED","style":"no-value","tag":"div","symbol":"%","graphic":"score","display_score":true},{"data":["A monument built for the 1889 World\u0027s Fair, this metal structure can be found on the Champ de Mars in Paris.","____e_ _____","Eiffel Tower"],"data_style":["question","response","answer"],"score":9.090909090909092,"feedback":null,"type":"SCORE_QUESTION_ANSWERED","style":"partial-value","tag":"div","symbol":"%","graphic":"score","display_score":true}]}]'),  # noqa: E501
            "qset": widget_instance.qset.as_dict()
        }

        return result
