import io
from zipfile import ZipFile, ZIP_DEFLATED

from django.db.models import QuerySet, F

from core.models import WidgetInstance, LogPlay, DateRange
from util.logging.session_logger import SessionLogger
from util.message_util import MsgBuilder, Msg
from util.widget.validator import ValidatorUtil


class PlayDataExporter:
    @staticmethod
    def export(instance: WidgetInstance, export_type: str, semesters_string: str) -> tuple[str | bytes | Msg, str]:
        semesters = semesters_string.split(',')

        match export_type:
            case "High Scores":
                return PlayDataExporter._export_high_scores(instance, semesters)
            case "All Scores":
                return PlayDataExporter._export_all_scores(instance, semesters)
            case "Full Event Log":
                return PlayDataExporter._export_full_event_log(instance, semesters)
            case "Referrer URLs":
                return PlayDataExporter._export_referrer_urls(instance, semesters)
            case "Questions and Answers":
                return PlayDataExporter._export_questions_and_answers(instance, semesters)
            case _:
                return MsgBuilder.invalid_input(msg="Invalid export type"), ""

    @staticmethod
    def _export_high_scores(instance: WidgetInstance, semesters: list[str]) -> tuple[str | Msg, str]:
        headers = ["Last Name", "First Name", "ID", "SIS User ID", "SIS Login ID", "Section", "Score"]
        results = {}

        # Get all play logs for each semester requested
        for semester in semesters:
            [year, term] = semester.split('-')
            logs = PlayDataExporter._get_all_for_instance(instance, term, int(year))

            # Go through each play log, compare current user score and this play's score
            for play in logs:
                # Do not include if user is guest
                if not play["user_id"]:
                    continue

                user_id = play["user_id"]

                # Add user to results if not already present
                if user_id not in results:
                    results[user_id] = {
                        "score": 0,
                        "last_name": play["last"],
                        "first_name": play["first"],
                        "semester": semester,
                    }

                # Update user's highest score in results dict
                results[user_id]["score"] = max(results[user_id]["score"], play["percent"])

        # Throw 404 if there are no play logs
        if len(results) == 0:
            return MsgBuilder.not_found(msg="No play logs found"), ""

        # Prepare fields for CSV
        data = []
        for user_id, r in results.items():
            score = f"{r["score"]}%"
            data.append([r["last_name"], r["first_name"], "", user_id, "", "", score])

        # Build CSV
        return PlayDataExporter._build_csv(headers, data), "csv"

    # Exports all guest scores. For use when the instance is in guest mode
    @staticmethod
    def _export_all_scores(instance: WidgetInstance, semesters: list[str]) -> tuple[str | Msg, str]:
        headers = ["User ID", "Last Name", "First Name", "Score", "Semester"]
        data = []
        count = 0

        # For each semester, get all play logs
        for semester in semesters:
            [year, term] = semester.split('-')
            logs = PlayDataExporter._get_all_for_instance(instance, term, int(year))

            # For each play log, process its data and add to results
            for play in logs:
                # Ignore non-guest plays
                if play["user_id"]:
                    continue

                # Add to data list
                data.append([f"Guest {++count}", play["last"], play["first"], f"{play["percent"]}%", semester])

        # Throw 404 when there is no data found
        if len(data) == 0:
            return MsgBuilder.not_found(msg="No play logs found"), ""

        # Build as CSV
        return PlayDataExporter._build_csv(headers, data), "csv"

    # Prepare data log zip file
    @staticmethod
    def _export_full_event_log(instance: WidgetInstance, semesters: list[str]) -> tuple[bytes | Msg, str]:
        headers = ["User ID", "Last Name", "First Name", "Play ID", "Semester", "Type", "Item ID", "Text", "Value",
                   "Game TIme", "Created At"]
        play_log_data = []

        # For each semester, get all play logs
        for semester in semesters:
            [year, term] = semester.split('-')
            logs = PlayDataExporter._get_all_for_instance(instance, term, int(year))

            # For each play log, process its data and add to results
            for play in logs:
                # If there is no username, it is a guest user
                username = play["user_id"] if "user_id" in play.keys() else "(Guest)"

                # Get and then process each log
                play_events = SessionLogger.get_logs(play["id"])
                for play_event in play_events:
                    row = [username, play["last"], play["first"], play["id"], semester, play_event.log_type,
                           play_event.item_id, play_event.text, play_event.value, play_event.game_time,
                           play_event.created_at]
                    play_log_data.append(row)

        # Throw 404 if no logs found
        if len(play_log_data) == 0:
            return MsgBuilder.not_found(msg="No play logs found"), ""

        # Build play logs csv
        play_logs_csv = PlayDataExporter._build_csv(headers, play_log_data)

        # TODO find questions and process them here once we know how we're doing questions. check PHP code

        zip_buffer = io.BytesIO()  # create in-memory byte buffer that can be used as a file
        with ZipFile(zip_buffer, "w", ZIP_DEFLATED) as zip_file:
            zip_file.writestr("logs.csv", play_logs_csv)

        return zip_buffer.getvalue(), "zip"

    # Outputs a .zip file of two CSV files for individual and collective referrers data
    @staticmethod
    def _export_referrer_urls(instance: WidgetInstance, semesters: list[str]) -> tuple[bytes | Msg, str]:
        raw_data = LogPlay.objects.filter(instance=instance).values("user_id", "referrer_url", "created_at")
        if len(raw_data) == 0:
            return MsgBuilder.not_found(msg="No play logs found"), ""

        # Process data for each individual play and their referrer, create CSV
        headers_individual = ["User", "URL", "Date"]
        data_individual = []
        for datum in raw_data:
            url = datum["referrer_url"] if datum["referrer_url"] else instance.play_url
            data_individual.append([datum["user_id"], url, datum["created_at"]])
        csv_individual = PlayDataExporter._build_csv(headers_individual, data_individual)

        # Count collective number of times a URL appears
        referrer_count = {}
        for datum in raw_data:
            url = datum["referrer_url"] if datum["referrer_url"] else instance.play_url
            if url not in referrer_count:
                referrer_count[url] = 0
            else:
                referrer_count[url] += 1

        # Turn collective data into CSV-friendly format, create CSV
        headers_collective = ["URL", "Count"]
        data_collective = []
        for url, count in referrer_count.items():
            data_collective.append([url, count])
        csv_collective = PlayDataExporter._build_csv(headers_collective, data_collective)

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
    def _build_csv(headers: list[str], data: list[list[str]]) -> str:
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

    @staticmethod
    def _get_all_for_instance(
            instance: WidgetInstance, semester: str = "all", year: int = "all", is_student: bool = False
    ) -> QuerySet[LogPlay, dict]:
        # TODO store results in cache

        # Get DateRange object, if specified
        date = None
        if semester != "all" and year != "all":
            date = DateRange.objects.get(semester=semester, year=year)

        # Form main query. If user is student, do not include user info
        query = LogPlay.objects.filter(instance=instance)

        if is_student:
            query = query.values("id", "created_at", "is_complete", "percent", "elapsed", "qset_id")
        else:
            query = (query
                .values("id", "created_at", "is_complete", "percent", "elapsed", "qset_id", "user_id")
                .annotate(first=F("user__first_name"), last=F("user__last_name"))
            )

        # Filter by date
        if date is not None:
            query = query.filter(created_at__gt=date.start_at, created_at__lt=date.end_at)

        return query
