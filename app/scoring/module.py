import base64
import json
from abc import ABC, abstractmethod

from core.models import LogPlay, WidgetInstance, WidgetQset
from django.utils.timezone import now
from util.logging.session_logger import SessionLogger
from util.logging.session_play import SessionPlay
from util.semester_util import SemesterUtil


class ScoreModule(ABC):

    def __init__(self, play_id: str, instance: WidgetInstance, play=None):
        self.logs = []
        self.play_id = play_id
        self.instance = instance
        self.play = play
        self.verified_score = 0
        self.calculated_percent = 0  # full precision percent!! not rounded!
        self.total_questions = 0
        self.finished = False
        self.log_problems = False
        self.global_modifiers = []
        self.custom_methods = None
        self.questions = []
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
        """
        session = SessionPlay.get_or_none(str(self.play_id))
        if not session:
            return False
        logs = session.get_logs()
        last_time = 0
        from datetime import datetime

        for log in logs:
            # if we are in preview, use dict, in play use model
            game_time = log.game_time if hasattr(log, "game_time") else log["game_time"]
            if game_time < last_time and game_time != -1:
                if self.log_problems:
                    # record a time validation failure log
                    SessionLogger.add_log(
                        log_type=1509,  # error_time_validation
                        item_id=(
                            log.item_id if hasattr(log, "item_id") else log["item_id"]
                        ),
                        text=str(log.id) if hasattr(log, "id") else "preview_log",
                        value=str(last_time),
                        game_time=game_time,
                        created_at=datetime.datetime.now(),
                        play_id=session,
                    )
            last_time = game_time

        return True

    def validate_scores(self, timestamp=False) -> bool:
        """calculates score for this session. updates `verified_score` and
        `calculated_percent`, which are eventually written to the database
        by the api. validates the individual question scores are valid.
        """
        session = SessionPlay.get_or_none(str(self.play_id))
        if not session:
            print("no session")
            # continues to get from DB i think

        if not timestamp:
            if not self.play:
                self.play = LogPlay.objects.get(id=self.play_id)

            # except for previews, check that attempts are not exceeded.
            if self.play_id != -1:
                semester = SemesterUtil.get_current_semester()
                attempts_used = LogPlay.objects.filter(
                    instance=self.instance,
                    context_id=self.play.context_id,
                    semester=semester,
                ).count()

                if (
                    self.instance.attempts != -1
                    and attempts_used >= self.instance.attempts
                ):
                    from django.core.exceptions import ValidationError

                    raise ValidationError("attempt limit met...")

        self.load_questions(timestamp)

        if not self.logs:
            self.logs = session.get_logs()

        self.process_score_logs()
        self.calculate_score()

        return True

    def process_score_logs(self):
        """Processes logs to determine score"""

        if len(self.logs) == 0:
            print("No logs found! No questions were answered.")
            from util.message_builder import MsgBuilder

            raise MsgBuilder.invalid_input(
                title="No Answers Found",
                msg="No logs were found. Please answer at least one question before submitting.",
            ).as_drf_response()

        for log in self.logs:
            log_type = (
                log.log_type if hasattr(log, "log_type") else log["type"]
            ).lower()

            if log_type in ["widget_end", "WIDGET_END"]:
                self.finished = True
            elif log_type in ["final_score_from_client", "FINAL_SCORE_FROM_CLIENT"]:
                self.handle_log_client_final_score(log)
            elif log_type in [
                "question_answered",
                "SCORE_QUESTION_ANSWERED",
                "score_question_answered",
            ]:
                self.handle_log_question_answered(
                    log
                )  # THIS should lead to check_answer()
            elif log_type in [
                "widget_interaction",
                "SCORE_WIDGET_INTERACTION",
                "score_widget_interaction",
            ]:
                self.handle_log_widget_interaction(log)
            elif log_type in ["score_participation", "SCORE_PARTICIPATION"]:
                self.verified_score = (
                    log.value if hasattr(log, "value") else log["value"]
                )

    def handle_log_widget_interaction(self, log):
        """abstract method for handling widget interactions"""
        print("this should be overridden")
        pass

    def handle_log_client_final_score(self, log) -> None:
        """handles the log when a final score is received from the client"""
        self.verified_score = 0
        self.total_questions = 0
        val = log.value if hasattr(log, "value") else log["value"]
        self.global_modifiers.append(int(val) - 100)

    def handle_log_question_answered(self, log):
        self.total_questions += 1
        score = self.check_answer(log)
        self.verified_score += score

    @abstractmethod
    def check_answer(self, log):
        """abstract method to check answers. implement this in child classes."""
        print("this should be overridden")
        pass

    def calculate_score(self):
        """calculate final score percentage"""
        global_mod = sum(self.global_modifiers)

        # sum up all the scores
        self.verified_score = sum(self.scores.values())

        if self.total_questions > 0:
            points = self.verified_score + global_mod * self.total_questions
            self.calculated_percent = points / self.total_questions
        else:
            points = self.verified_score + global_mod
            self.calculated_percent = points

        # Clamp between 0 and 100
        self.calculated_percent = max(0, min(self.calculated_percent, 100))

    def get_score_report(self) -> object:
        """returns a report of the calculated score"""
        self.score_display["overview"] = self.get_score_overview()
        self.score_display["details"] = self.get_score_details()
        return self.score_display

    def get_score_overview(self):
        complete = False
        # TODO: mark it complete for previews, i guess they should have play_id's of negative one.
        if self.play_id:
            complete = True
        else:
            print(f"self.play: {self.play} and self.play.data: {self.play.data}")
            complete = bool(self.play.data.is_complete) if self.play else False

        return {
            "complete": complete,
            "score": self.calculated_percent,
            "table": self.get_overview_items(),
            "referrer_url": (
                self.play.data.referrer_url
                if self.play.data and self.play.data.referrer_url
                else ""
            ),
            "created_at": (
                self.play.data.created_at
                if self.play.data and self.play.data.created_at
                else ""
            ),
            "auth": (
                self.play.data.auth if self.play.data and self.play.data.auth else ""
            ),
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

    def load_questions(self, timestamp=False):
        self.questions = {}

        widget_qset = self.instance.get_latest_qset()
        if not widget_qset:
            print("[load_questions] No widget_qset found!")
            return

        try:
            decoded_data = WidgetQset.decode_data(widget_qset.data)
            raw_items = decoded_data.get("items", [])

            def normalize_and_store(item):
                qid = item.get("id")
                if qid:
                    item["materiaType"] = item.get("materiaType", "question")
                    self.questions[qid] = item

            def walk_items(items):
                for item in items:
                    if isinstance(item, dict):
                        # if this is a question(normal)
                        if "questions" in item and "answers" in item:
                            normalize_and_store(item)
                        # if it's a category or container(enigma)
                        elif "items" in item and isinstance(item["items"], list):
                            walk_items(item["items"])

            walk_items(raw_items)

            print(
                f"[load_questions] Loaded {len(self.questions)} question(s): {list(self.questions.keys())}"
            )

        except Exception as e:
            print(f"[load_questions] Failed to decode or parse questions: {e}")

    def get_score_details(self):
        table = []
        for log in self.logs:
            log_type = (
                log.log_type if hasattr(log, "log_type") else log["type"]
            ).lower()
            if log_type in [
                "question_answered",
                "score_question_answered",
                "SCORE_QUESTION_ANSWERED",
            ]:

                item_id = log.item_id if hasattr(log, "item_id") else log["item_id"]
                if item_id in self.questions:
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
        """builds an item in the table array like in php"""
        item_id = log.item_id if hasattr(log, "item_id") else log["item_id"]
        question = self.questions[item_id]
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
            "type": log.log_type if hasattr(log, "log_type") else log["type"],
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
                feedback = answer.get("options", {}).get("feedback", "")
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
        return log.text if hasattr(log, "text") else log["text"]

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
        if self.log_problems:
            from util.logging.session_logger import SessionLogger

            SessionLogger.add_log(
                log_type=error_code,
                item_id=item_id,
                text=description,
                value=value,
                game_time=-1,
                created_at=now(),
                play_id=self.play_id,
            )
