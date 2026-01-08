# import base64
# import json
import logging
from abc import ABC, abstractmethod

from core.message_exception import MsgInvalidInput
from core.models import Log, LogPlay

logger = logging.getLogger(__name__)


class ScoreModule(ABC):

    def __init__(self, play: LogPlay):
        self.logs = []
        self.play_id = play.id
        self.instance = play.instance
        self.play = play
        self.verified_score = 0
        self.calculated_percent = 0  # full precision percent!! not rounded!
        self.total_questions = 0
        self.finished = False
        self.log_problems = False
        self.global_modifiers = []
        self.custom_methods = None
        self.qset = play.qset.get_data()
        self.questions = play.qset.get_questions()
        self.score_display = {}
        self.scores = {}
        self._ss_table_title = "responses:"
        self._ss_table_headers = [
            "question score",
            "the question",
            "your response",
            "correct answer",
        ]

    def validate(self) -> bool:
        """perform all validation"""
        return self.validate_times() and self.validate_scores()

    def validate_times(self) -> bool:
        """validate that the logs we received make sense in time,
        both in our server time and in the player time.
        adds a validation fail log for every log that is found to be out of order (time-wise).

        TODO: Aside from submitting a time validation log this has no actual effect on validation
              Ideally time validation is revisited in the future in a way that doesn't brick prior plays
        """
        logs = self.play.get_logs()
        last_time = 0
        from django.utils import timezone

        for log in logs:
            game_time = log.game_time
            if game_time < last_time and game_time != -1:
                if self.log_problems:
                    # record a time validation failure log
                    error_log = Log(
                        log_type=Log.LogType.ERROR_TIME_VALIDATION,
                        item_id=log.item_id,
                        text=str(log.id) if hasattr(log, "id") else "preview_log",
                        value=str(last_time),
                        game_time=game_time,
                        created_at=timezone.now(),
                        play_id=self.play.id,
                    )
                    error_log.save()

            last_time = game_time

        return True

    def validate_scores(self, in_process=False) -> bool:
        """calculates score for this session. updates `verified_score` and
        `calculated_percent`, which are eventually written to the database
        by the api. validates the individual question scores are valid.
        """

        # If we're validating scores mid-flight (a play session is in progress),
        # attempt limit validation should ensure we do not allow scores to be created
        # that exceed the attempt limit.
        # In other contexts (visiting the score screen), we bypass this check.
        # Additionally, previews do not have attempt limits checked.
        if in_process and self.play_id != -1:
            if not self.instance.user_has_attempts(
                self.play.user, self.play.context_id
            ):
                from django.core.exceptions import ValidationError

                raise ValidationError("Attempt limit met for this context")

        self.questions = self.play.qset.get_questions()

        if not self.logs:
            self.logs = self.play.get_logs()

        self.process_score_logs()
        self.calculate_score()

        return True

    def process_score_logs(self):
        """Processes logs to determine score"""
        self.verified_score = 0
        self.total_questions = 0
        for log in self.logs:
            if log.log_type == Log.LogType.WIDGET_END:
                self.finished = True
            elif log.log_type == Log.LogType.SCORE_FINAL_FROM_CLIENT:
                self.handle_log_client_final_score(log)
            elif log.log_type == Log.LogType.SCORE_QUESTION_ANSWERED:
                self.handle_log_question_answered(log)
            elif log.log_type == Log.LogType.SCORE_WIDGET_INTERACTION:
                self.handle_log_widget_interaction(log)
            elif log.log_type == Log.LogType.SCORE_PARTICIPATION:
                try:
                    self.verified_score = int(log.value)
                except ValueError:
                    raise MsgInvalidInput(
                        msg="Invalid participation log value - must be a number."
                    )

    def handle_log_widget_interaction(self, log):
        """abstract method for handling widget interactions"""
        pass

    def handle_log_client_final_score(self, log) -> None:
        """handles the log when a final score is received from the client"""
        self.verified_score = 0
        self.total_questions = 0
        self.global_modifiers.append(int(log.value) - 100)

    def handle_log_question_answered(self, log):
        self.total_questions += 1
        score = self.check_answer(log)
        self.verified_score += score

    @abstractmethod
    def check_answer(self, log):
        """abstract method to check answers. implement this in child classes."""
        pass

    def calculate_score(self):
        """calculate final score percentage"""
        global_mod = sum(self.global_modifiers)

        if self.total_questions > 0:
            points = self.verified_score + global_mod * self.total_questions
            self.calculated_percent = points / self.total_questions
        else:
            points = self.verified_score + global_mod
            self.calculated_percent = points

        # Clamp between 0 and 100
        self.calculated_percent = max(0, min(self.calculated_percent, 100))

    def get_score_report(self) -> object:
        if not self.logs:
            self.logs = self.play.get_logs()

        self.validate_scores()

        """returns a report of the calculated score"""
        self.score_display["overview"] = self.get_score_overview()
        self.score_display["details"] = self.get_score_details()
        return self.score_display

    def get_score_overview(self):
        return {
            "complete": self.play.is_complete,
            "score": self.calculated_percent,
            "table": self.get_overview_items(),
            "referrer_url": self.play.referrer_url,
            "created_at": self.play.created_at,
            "auth": self.play.auth,
        }

    def get_overview_items(self):
        overview_items = []
        overview_items.append(
            {"message": "points lost", "value": self.calculated_percent - 100}
        )
        overview_items.append(
            {"message": "final score", "value": self.calculated_percent}
        )
        return overview_items

    def get_question_by_item_id(self, item_id):
        """
        helper function to allow widget score modules to retrieve a question via item id
        returns the json data of the question, not a question model instance
        """
        question = next((q for q in self.questions if q.item_id == item_id), None)
        return question.data

    def get_score_details(self):
        table = []
        for log in self.logs:
            if log.log_type == Log.LogType.SCORE_QUESTION_ANSWERED:
                question = self.get_question_by_item_id(log.item_id)

                if question is not None:
                    row = self.details_for_question_answered(log)
                    table.append(row)

        return [
            {
                "title": self._ss_table_title,
                "headers": self._ss_table_headers,
                "table": table,
            }
        ]

    def details_for_question_answered(self, log) -> dict:
        question = self.get_question_by_item_id(log.item_id)
        score = self.check_answer(log)

        return {
            "data": [
                # score,
                self.get_ss_question(log, question),
                self.get_ss_answer(log, question),
                self.get_ss_expected_answers(log, question),
            ],
            "data_style": ["score", "question", "response", "answer"],
            "score": score,
            "feedback": self.get_feedback(log, question["answers"]),
            "type": log.log_type,
            "style": self.get_detail_style(score),
            "tag": "div",
            "symbol": "%",
            "graphic": "score",
            "display_score": True,
        }

    def get_feedback(self, log, answers: list) -> str | None:
        """ "if log text matches an answer return it"""
        text = log.text if hasattr(log, "text") else log["text"]
        for answer in answers:
            if text == answer["text"]:
                options = answer.get("options", {})
                if isinstance(options, dict):
                    feedback = options.get("feedback", "")
                    if feedback:
                        return feedback
        return None

    def get_detail_style(self, score) -> str:
        """determines how to style row based on score"""
        if score in (-1, "-1"):
            return "ignored-value"
        if score in (100, "100"):
            return "full-value"
        if score in (0, "0"):
            return "no-value"
        return "partial-value"

    def get_ss_question(self, log, question) -> str:
        if "questions" in question and len(question["questions"]) > 0:
            return question["questions"][0].get("text", "")
        return "[no question text]"

    def get_ss_answer(self, log, question) -> str:
        return log.text

    def get_ss_expected_answers(self, log, question) -> str:
        if question["type"] == "mc":
            max_value = 0
            max_answers = []
            for ans in question["answers"]:
                val = int(ans["value"])
                if val > max_value:
                    max_value = val
                    max_answers = [ans["text"]]
                elif val == max_value:
                    max_answers.append(ans["text"])
            return " or ".join(max_answers)
        else:
            return question["answers"][0]["text"]

    def log_problem(
        self, item_id: str, value: str, error_code: int, description: str
    ) -> None:
        """
        This method is deprecated. Retaining the reference to prevent
        widget score modules from using it.
        """
        pass


class EmptyScoreModule(ScoreModule):
    def check_answer(self, log):
        pass
