import io
import logging
from types import FunctionType
from zipfile import ZipFile, ZIP_DEFLATED

from django.conf import settings
from django.core.cache import cache

from core.models import WidgetInstance, LogPlay, DateRange
from util.logging.session_logger import SessionLogger
from util.logging.session_play import SessionPlay
from util.message_util import MsgBuilder, Msg
from util.widget.validator import ValidatorUtil

logger = logging.getLogger("django")


class PlayDataExporter:
    @staticmethod
    def export(
            instance: WidgetInstance, export_type: str, semesters_string: str, is_student: bool
    ) -> tuple[str | bytes | Msg, str]:
        semesters = semesters_string.split(',')

        match export_type:
            case "High Scores":
                return PlayDataExporter._export_high_scores(instance, semesters, is_student)
            case "All Scores":
                return PlayDataExporter._export_all_scores(instance, semesters, is_student)
            case "Full Event Log":
                return PlayDataExporter._export_full_event_log(instance, semesters, is_student)
            case "Referrer URLs":
                return PlayDataExporter._export_referrer_urls(instance, semesters, is_student)
            case "Questions and Answers":
                return PlayDataExporter._export_questions_and_answers(instance, semesters)
            case _:
                # Check the widget for its custom playdata exporters
                methods = instance.widget.get_playdata_exporter_methods()
                if isinstance(methods, Msg):
                    return methods, ""
                exporter_method = methods.get(export_type, None)

                # A custom exporter was found, run it
                if exporter_method is not None and isinstance(exporter_method, FunctionType):
                    try:
                        result, file_ext = exporter_method(instance, semesters, is_student)
                        # Verify the exporter method returned correct data
                        if (not isinstance(result, str) and not isinstance(result, bytes)
                                and not isinstance(result, Msg)):
                            return MsgBuilder.failure(
                                msg=f"The playdata exporter returned an invalid data type '{type(result)}'", status=500
                            ), ""
                        if not isinstance(file_ext, str):
                            return MsgBuilder.failure(
                                msg=f"The playdata exporter returned an invalid file type '{type(file_ext)}'",
                                status=500
                            ), ""

                        # All is good, return results
                        return result, file_ext
                    except Exception as e:
                        logger.error(
                            f"Playdata exporter '{export_type}' for widget {instance.widget.clean_name} failed to run:"
                        )
                        logger.error(e)
                        return MsgBuilder.failure(msg="The playdata exporter failed to run", status=500), ""

                # Otherwise, this export type just doesn't exist
                else:
                    return MsgBuilder.invalid_input(msg="Invalid export type"), ""

    @staticmethod
    def _export_high_scores(instance: WidgetInstance, semesters: list[str], is_student: bool) -> tuple[str | Msg, str]:
        headers = ["Last Name", "First Name", "ID", "SIS User ID", "SIS Login ID", "Section", "Score"]
        results = {}

        # Get all play logs for each semester requested
        for semester in semesters:
            [year, term] = semester.split('-')
            logs = PlayDataExporter.get_all_plays_for_instance(instance, term, int(year), is_student)

            # Go through each play log, compare current user score and this play's score
            for play in logs:
                # Do not include if user is guest
                if not play.user:
                    continue

                user_id = play.user.id

                # Add user to results if not already present
                if user_id not in results:
                    results[user_id] = {
                        "score": 0,
                        "last_name": play.user.last_name,
                        "first_name": play.user.first_name,
                        "semester": semester,
                    }

                # Update user's highest score in results dict
                results[user_id]["score"] = max(results[user_id]["score"], play.percent)

        # Throw 404 if there are no play logs
        if len(results) == 0:
            return MsgBuilder.not_found(msg="No play logs found"), ""

        # Prepare fields for CSV
        data = []
        for user_id, r in results.items():
            score = f"{r["score"]}%"
            data.append([r["last_name"], r["first_name"], "", user_id, "", "", score])

        # Build CSV
        return PlayDataExporter.build_csv(headers, data), "csv"

    # Exports all guest scores. For use when the instance is in guest mode
    @staticmethod
    def _export_all_scores(instance: WidgetInstance, semesters: list[str], is_student: bool) -> tuple[str | Msg, str]:
        headers = ["User ID", "Last Name", "First Name", "Score", "Semester"]
        data = []
        count = 0

        # For each semester, get all play logs
        for semester in semesters:
            [year, term] = semester.split('-')
            logs = PlayDataExporter.get_all_plays_for_instance(instance, term, int(year), is_student)

            # For each play log, process its data and add to results
            for play in logs:
                # Ignore non-guest plays
                if play.user:
                    continue

                # Add to data list
                data.append([f"Guest {++count}", "", "", f"{play.percent}%", semester])

        # Throw 404 when there is no data found
        if len(data) == 0:
            return MsgBuilder.not_found(msg="No play logs found"), ""

        # Build as CSV
        return PlayDataExporter.build_csv(headers, data), "csv"

    # Prepare data log zip file
    @staticmethod
    def _export_full_event_log(
            instance: WidgetInstance, semesters: list[str], is_student: bool
    ) -> tuple[bytes | Msg, str]:
        headers = ["User ID", "Last Name", "First Name", "Play ID", "Semester", "Type", "Item ID", "Text", "Value",
                   "Game Time", "Created At"]
        play_log_data = []

        # For each semester, get all play logs
        for semester in semesters:
            [year, term] = semester.split('-')
            logs = PlayDataExporter.get_all_plays_for_instance(instance, term, int(year), is_student)

            # For each play log, process its data and add to results
            for play in logs:
                # If there is no username, it is a guest user
                username = play.user.id if play.user else "(Guest)"

                # Get and then process each log
                play_events = SessionLogger.get_logs(play.id)
                for play_event in play_events:
                    last, first = (play.user.last_name, play.user.first_name) if play.user else ("", "")
                    row = [username, last, first, play.id, semester, play_event.log_type,
                           play_event.item_id, play_event.text, play_event.value, play_event.game_time,
                           play_event.created_at]
                    play_log_data.append(row)

        # Throw 404 if no logs found
        if len(play_log_data) == 0:
            return MsgBuilder.not_found(msg="No play logs found"), ""

        # Build play logs csv
        play_logs_csv = PlayDataExporter.build_csv(headers, play_log_data)

        # TODO find questions and process them here once we know how we're doing questions. check PHP code

        zip_buffer = io.BytesIO()  # create in-memory byte buffer that can be used as a file
        with ZipFile(zip_buffer, "w", ZIP_DEFLATED) as zip_file:
            zip_file.writestr("logs.csv", play_logs_csv)

        return zip_buffer.getvalue(), "zip"

    # Outputs a .zip file of two CSV files for individual and collective referrers data
    @staticmethod
    def _export_referrer_urls(
            instance: WidgetInstance, semesters: list[str], is_student: bool
    ) -> tuple[bytes | Msg, str]:
        headers_individual = ["User", "URL", "Date"]
        data_individual = []
        referrer_count = {}

        for semester in semesters:
            # Get date object
            [year, term] = semester.split('-')
            date = DateRange.objects.filter(semester=term, year=year).first()
            if date is None:
                return MsgBuilder.not_found(msg="Semester not found"), ""

            # Form query, only including user info if requesting user isn't a student
            raw_data = PlayDataExporter.get_all_plays_for_instance(instance, term, int(year), is_student)
            if len(raw_data) == 0:
                return MsgBuilder.not_found(msg="No play logs found"), ""

            # Process data for each individual play and their referrer
            for datum in raw_data:
                url = datum.referrer_url if datum.referrer_url else instance.play_url
                user_id = datum.user.id if datum.user else "(Guest)"
                data_individual.append([user_id, url, datum.created_at])

            # Count collective number of times a URL appears
            for datum in raw_data:
                url = datum.referrer_url if datum.referrer_url else instance.play_url
                if url not in referrer_count:
                    referrer_count[url] = 0
                else:
                    referrer_count[url] += 1

        # Build all individual data into a CSV
        csv_individual = PlayDataExporter.build_csv(headers_individual, data_individual)

        # Turn collective data into CSV-friendly format, build CSV
        headers_collective = ["URL", "Count"]
        data_collective = []
        for url, count in referrer_count.items():
            data_collective.append([url, count])
        csv_collective = PlayDataExporter.build_csv(headers_collective, data_collective)

        # Throw CSVs into zip file
        zip_buffer = io.BytesIO()
        with ZipFile(zip_buffer, "w", ZIP_DEFLATED) as zip_file:
            zip_file.writestr("individual_referrers.csv", csv_individual)
            zip_file.writestr("collective_referrers.csv", csv_collective)

        return zip_buffer.getvalue(), "zip"

    @staticmethod
    def _export_questions_and_answers(instance: WidgetInstance, semesters: list[str]) -> tuple[str | Msg, str]:
        # TODO awaiting re-do/implementation of the question structure
        raise NotImplementedError()

    @staticmethod
    def build_csv(headers: list[str], data: list[list[str]]) -> str:
        csv = ",".join(headers) + "\r\n"
        # Add each row of data to the string
        for row in data:
            # Add quotes around every cell, and escape any quotes in the cell
            for i, cell in enumerate(row):
                cell_value = str(cell) if cell is not None else ""
                cell_value = cell_value.replace("\r", "").replace("\n", "")
                row[i] = f"\"{ValidatorUtil.add_slashes(cell_value)}\""
            # Combine all cells in the row with commas
            csv += ",".join(row) + "\r\n"
        return csv

    # Build on top of the SessionPlay function, except adds caching and allows filtering out user info
    @staticmethod
    def get_all_plays_for_instance(
            instance: WidgetInstance | str, semester: str = "all", year: int = "all", is_student: bool = False
    ) -> list[LogPlay]:
        # Get cached copy
        cache_key = f"play-logs.{instance.id if isinstance(instance, WidgetInstance) else instance}.{semester}-{year}"
        plays = cache.get(cache_key, None)

        # Cache miss, get play logs
        if plays is None:
            plays = SessionPlay.get_all_plays_for_instance(instance=instance, semester=semester, year=year)

        # Erase user from log if the requesting user is student
        if is_student:
            for play in plays:
                play.user_id = None
                play.user = None

        # Store result to cache, return
        result = list(plays)
        cache.set(cache_key, result, settings.PLAYDATA_EXPORTER_CACHE_TIMEOUT)
        return result
