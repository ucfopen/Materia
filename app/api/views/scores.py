import json
import logging
import traceback

from core.models import LogPlay, WidgetInstance
from django.http import HttpResponseNotFound, JsonResponse
from scoring.manager import ScoringUtil
from util.logging.session_play import SessionPlay
from util.message_util import MsgBuilder
from util.semester_util import SemesterUtil
from util.widget.validator import ValidatorUtil

logger = logging.getLogger(__name__)


class ScoresApi:

    # WAS widget_instance_scores_get
    # Returns all scores (SessionPlays) for the given widget instance recorded by the current user, and attempts
    # remaining in the current context. If no launch token is supplied, the current semester will
    # be used as the current context.

    @staticmethod
    def get_for_widget_instance(request):
        # Get body params
        json_body = json.loads(request.body)
        instance_id = json_body.get("instanceId")
        token = json_body.get("token")

        # Verify body params
        if not instance_id or not ValidatorUtil.is_valid_hash(instance_id):
            return MsgBuilder.invalid_input(msg=str(instance_id)).as_json_response()

        # Grab context ID
        context_id = None
        if token:
            result = ""  # TODO: \Event::trigger('before_score_display', $token)
            if len(result) > 0:
                context_id = result
        else:
            session_context_id = False  # TODO: \Session::get('context_id', false))
            if session_context_id:
                context_id = session_context_id

        semester = SemesterUtil.get_current_semester()

        # Get instance and validate user
        instance = WidgetInstance.objects.filter(pk=instance_id).first()
        if not instance:
            return HttpResponseNotFound()

        if not instance.playable_by_current_user(request.user):
            return MsgBuilder.no_permission().as_json_response()

        log_plays = LogPlay.objects.filter(instance=instance, user=request.user)

        if context_id:
            log_plays = log_plays.filter(context_id=context_id)
        if semester:
            log_plays = log_plays.filter(semester=semester)

        scores = []
        errors = []
        for play in log_plays.order_by("-created_at"):
            try:
                from util.logging.session_play import SessionPlay

                sp = SessionPlay()
                sp.data = play
                sp.is_preview = False

                play_data = ScoringUtil.get_play_details(sp)

                scores.append(
                    {
                        "id": str(play.id),
                        "created_at": int(play.created_at.timestamp()),
                        "percent": play_data.get("overview", {}).get("score", None),
                    }
                )

            except Exception as e:
                tbString = traceback.format_exc()
                logger.warning(
                    f"[get_for_widget_instance] Failed to process LogPlay ID {play.id}: {e}\n{tbString}"
                )
                errors.append(str(play.id))

        if errors:
            return MsgBuilder.partial_success(
                title="Some Sessions Failed",
                msg=f"{len(errors)} sessions could not be processed.",
                data={"processed": scores, "failed_ids": errors},
            ).as_drf_response(status=206)

        # compute and add attemptsLeft
        attempts_used = len(
            ScoringUtil.get_instance_score_history(
                instance, context_id, semester, user_id=request.user.id
            )
        )
        extra = (
            ScoringUtil.get_instance_extra_attempts(instance, context_id, semester)
            if context_id
            else 0
        )
        attempts_left = instance.attempts - attempts_used + extra

        # changing this to drf Response() makes it break ;( やばい！
        # TODO convert this to DRF and make it work
        return JsonResponse(
            {
                "scores": scores,
                "attemptsLeft": attempts_left,
            }
        )

    # WAS guest_widget_instance_scores_get
    @staticmethod
    def get_for_widget_instance_guest(request):
        # Get and validate body
        json_body = json.loads(request.body)
        instance_id = json_body.get("instanceId")
        play_id = json_body.get("playId")

        if not instance_id or not ValidatorUtil.is_valid_hash(instance_id):
            return MsgBuilder.invalid_input(msg=str(instance_id)).as_json_response()

        # Get widget instance and validate user
        instance = WidgetInstance.objects.filter(pk=instance_id).first()
        if not instance:
            return HttpResponseNotFound()
        if not instance.playable_by_current_user(request.user):
            return MsgBuilder.no_login(request=request).as_json_response()

        play_data = ScoringUtil.get_guest_play_details(
            request.session, instance, play_id, False
        )

        if not play_data:
            return MsgBuilder.expired().as_json_response()

        # semester = DateRange.objects.get(pk=5)  # TODO
        semester = SemesterUtil.get_current_semester()
        token = json_body.get("token")
        # Grab context ID
        context_id = None
        if token:
            result = ""  # TODO: \Event::trigger('before_score_display', $token)
            if len(result) > 0:
                context_id = result
        else:
            session_context_id = False  # TODO: \Session::get('context_id', false))
            if session_context_id:
                context_id = session_context_id

        from django.utils.timezone import localtime

        if play_data:
            scores = [
                {
                    "id": play_id,
                    "created_at": int(
                        localtime(play_data["overview"]["created_at"]).timestamp()
                    ),
                    "percent": play_data["overview"]["score"],
                }
            ]
        else:
            scores = []

        attempts_used = len(
            ScoringUtil.get_instance_score_history(instance, context_id, semester)
        )
        extra = (
            ScoringUtil.get_instance_extra_attempts(instance, context_id, semester)
            if context_id
            else 0
        )
        attempts_left = instance.attempts - attempts_used + extra

        return JsonResponse(
            {
                "scores": scores,
                "attemptsLeft": attempts_left,
            }
        )

    # WAS widget_instance_play_scores_get
    # Gets play details (from Log table, containing player's answers and actions) for a play_id
    @staticmethod
    def get_play_details(request):
        # Get body params
        json_body = json.loads(request.body)
        play_id = json_body.get("playId")
        preview_inst_id = json_body.get("previewInstId")
        preview_play_id = json_body.get("previewPlayId")

        # Grab play details
        if ValidatorUtil.is_valid_hash(preview_inst_id):
            # Get preview play details
            if preview_play_id is None:
                return MsgBuilder.invalid_input(
                    msg="Missing preview play ID"
                ).as_json_response()
            is_preview: bool = True
            # Check if preview is valid and user has access
            if not request.user.is_authenticated:
                return MsgBuilder.no_login(request=request).as_json_response()

            # Get widget instance and play details
            widget_instance = WidgetInstance.objects.filter(pk=preview_inst_id).first()
            if not widget_instance:
                return HttpResponseNotFound()

            play_details = ScoringUtil.get_guest_play_details(
                request.session, widget_instance, preview_play_id, is_preview
            )
            if not play_details:
                return MsgBuilder.expired().as_json_response()

            return JsonResponse(play_details)
        else:
            # Get real play details
            # Check if session play is valid and user has access
            session_play = SessionPlay.get_or_none(play_id)
            if not session_play:
                return HttpResponseNotFound()
            if not session_play.data.instance.playable_by_current_user(request.user):
                return MsgBuilder.no_login(request=request).as_json_response()

            return JsonResponse(ScoringUtil.get_play_details(session_play))

    # Gets score distributions (total and by semester) for a widget instance.
    @staticmethod
    def score_summary_get(request):
        # Get and validate body params
        json_body = json.loads(request.body)
        instance_id = json_body.get("instanceId")
        # include_storage_data = json_body.get("includeStorageData", False)
        if not ValidatorUtil.is_valid_hash(instance_id):
            return MsgBuilder.invalid_input(msg=str(instance_id)).as_json_response()

        # Get widget instance and verify playable by user
        instance = WidgetInstance.objects.filter(pk=instance_id).first()
        if not instance:
            return HttpResponseNotFound()
        if not instance.playable_by_current_user(request.user):
            return MsgBuilder.no_login(request=request).as_json_response()

        # Get the score distributions and summaries per semester
        # TODO: these 2 queries seem to be slow (up to 3sec in php!) - maybe they'll perform faster in
        #       python, but it seems like we can squash this into 1 (tho rather lengthy) query. these 2
        #       functions aren't being called anywhere else in PHP, only by this API endpoint.
        distribution = ScoringUtil.get_widget_score_distribution(instance)
        summaries = ScoringUtil.get_widget_score_summary(instance)

        # Combine both data
        for dist_id, data in distribution.items():
            if dist_id not in summaries:
                summaries[dist_id] = distribution
            else:
                summaries[dist_id]["distribution"] = data["distribution"]

        # TODO: include storage data

        # Transform into just a list of data, rather than a dict. Sort by semester ID.
        summaries = summaries.values()
        summaries = sorted(summaries, key=lambda k: k["id"])

        return JsonResponse({"summaries": summaries})
