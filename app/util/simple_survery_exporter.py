# TODO needs more testing w real data, esp with a variety of qsets
# TODO this also needs to be integrated directly into simple survey. it's here for now for safe keeping
import io
from zipfile import ZipFile, ZIP_DEFLATED

from core.models import WidgetInstance, WidgetQset
from util.logging.play_data_exporter import PlayDataExporter
from util.logging.session_logger import SessionLogger
from util.message_util import Msg, MsgBuilder
from util.widget.validator import ValidatorUtil


def export_survey_formatting(
        instance: WidgetInstance, semesters: list[str], is_student: bool
) -> tuple[bytes | Msg, str]:
    headers = ["User ID", "Last Name", "First Name", "Semester", "Game Time (seconds)"]
    csvs = {}  # Contains processed data and rows for the CSV for each qset

    for semester in semesters:
        [year, term] = semester.split("-")
        play_sessions = PlayDataExporter.get_all_plays_for_instance(instance, term, int(year), is_student)

        # Go through each play, and gather all events for that play
        results = {}
        for play in play_sessions:
            results[play.id] = []
            last, first = (play.user.last_name, play.user.first_name) if play.user else ("", "")

            # Go through each log for this play
            play_logs = SessionLogger.get_logs(play.id)
            for play_log in play_logs:
                event = {
                    "last_name": last,
                    "first_name": first,
                    "user_id": play.user.id if play.user else "(Guest)",
                    "qset_id": play.qset.id,
                    "semester": semester,
                    "type": play_log.log_type,
                    "item_id": play_log.item_id,
                    "text": play_log.text,
                    "value": play_log.value,
                    "game_time": play_log.game_time,
                    "created_at": play_log.created_at
                }
                results[play.id].append(event)

        # Return if we didn't find any results
        if len(results) == 0:
            return MsgBuilder.not_found(msg="No plays found"), ""

        # Go through each play and process it
        for play_id, play_logs in results.items():
            if len(play_logs) == 0:  # Skip if no play logs for this play
                continue

            qset_id = play_logs[0]["qset_id"]

            # Grab existing processed data for qset, or make a new entry.
            if qset_id not in csvs:
                cur_csv = {"questions": [], "rows": [], "timestamp": play_logs[0]["created_at"]}
                csvs[qset_id] = cur_csv

                qset = WidgetQset.objects.filter(id=qset_id).first()
                if qset is None:
                    continue

                # data = qset.get_data()
                # TODO get questions. come back to when figured out
                questions = [  # TODO placeholders
                    {"id": "q1", "questions": [{"text": "Question 1"}]},
                    {"id": "q2", "questions": [{"text": "Question 2"}]},
                    {"id": "q3", "questions": [{"text": "Question 3"}]},
                ]
                cur_csv["question_texts"] = []
                for question in questions:
                    clean_str = ValidatorUtil.add_slashes(question["questions"][0]["text"])
                    if len(clean_str) > 80:
                        clean_str = clean_str[:80] + "..."

                    cur_csv["question_texts"].append(clean_str)
                    cur_csv["questions"].append(question["id"])

                cur_csv["num_questions"] = len(questions)
            else:
                cur_csv = csvs[qset_id]

            # How many spots there are - 5 for the original header names, and the rest for how many questions there are
            num_slots = 5 + cur_csv["num_questions"]

            # Grab last recorded game time
            game_time = "N/A"
            if play_logs[-1]["game_time"] is not None:
                game_time = play_logs[-1]["game_time"]

            # Prepare data as row
            row = [""] * num_slots
            row[0] = play_logs[0]["user_id"]
            row[1] = play_logs[0]["last_name"]
            row[2] = play_logs[0]["first_name"]
            row[3] = play_logs[0]["semester"]
            row[4] = game_time

            # Add in each question to row. If a response is logged for the same question twice, use the last response
            for event in play_logs:
                if event["type"] != "SCORE_QUESTION_ANSWERED":
                    continue
                # Check to see if this question id is one that exists on the qset
                if event["item_id"] not in cur_csv["questions"]:
                    continue
                # Insert or replace
                array_index = cur_csv["questions"].index(event["item_id"])
                row[5 + array_index] = ValidatorUtil.add_slashes(event["text"])

            # Add rows
            cur_csv["rows"].append(row)

    # Build and throw CSVs into a zip file
    zip_buffer = io.BytesIO()
    with ZipFile(zip_buffer, "w", ZIP_DEFLATED) as zip_file:
        for key, csv in csvs.items():
            if csv["timestamp"]:
                date_string = csv["timestamp"].strftime("%m-%d-%y %I_%M%p")
            else:
                date_string = "N/A"
            file_name = f"{instance.name} (created {date_string}).csv"
            built_csv = PlayDataExporter.build_csv([*headers, *csv["question_texts"]], csv["rows"])
            zip_file.writestr(file_name, built_csv)

    return zip_buffer.getvalue(), "zip"


mappings = {
    "Survey Formatting": export_survey_formatting
}
