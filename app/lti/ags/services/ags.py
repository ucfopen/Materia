import logging

from core.models import LogPlay, LtiPlayState
from django.conf import settings
from django.db.models import Max
from django.utils import timezone
from lti.ags.client import AGSClient
from lti.ags.exceptions.ags_claim_not_defined import AGSClaimNotDefined
from lti.ags.exceptions.ags_no_line_item import AGSNoLineItem
from lti.ags.exceptions.ags_no_play_state import AGSNoPlayState

logger = logging.getLogger(__name__)


class AGSService:

    @staticmethod
    def submit_score_for_play(play: LogPlay) -> str:

        play_state = LtiPlayState.objects.get(play_id=play.id)
        if not play_state:
            raise AGSNoPlayState()

        if not play_state.ags_scoring_enabled:
            play_state.submission_status = LtiPlayState.SubmissionStatus.NOT_GRADED
            play_state.save()

            return LtiPlayState.SubmissionStatus.NOT_GRADED

        context_history = LogPlay.objects.filter(
            instance=play.instance,
            user=play.user,
            context_id=play.context_id,
        )

        # Find the highest score for the current context
        max_score = context_history.aggregate(Max("percent", default=play.percent)).get(
            "percent__max", 0
        )
        max_score = round(max_score, 2)

        completed_time = int(play.created_at.timestamp() + play.elapsed)

        score_url = (
            f"{settings.URLS["BASE_URL"]}scores/single/{play.instance.id}/{play.id}"
        )

        try:
            ags = AGSClient(play_state)
            (
                ags.score_builder()
                .score_given(max_score)
                .score_maximum(100)
                .activity_progress("Completed")
                .grading_progress("FullyGraded")
                .timestamp(completed_time)
                .submission_url(score_url)
                .submit()
            )

            play_state.submission_status = LtiPlayState.SubmissionStatus.SUCCESS
            play_state.last_submitted = timezone.now()
            play_state.submission_attempts = play_state.submission_attempts + 1
            play_state.save()

            logger.error(
                f"LTI-AGS: successfully transmitted " f"completion for play {play.id}"
            )

        except AGSClaimNotDefined:
            play_state.submission_status = (
                LtiPlayState.SubmissionStatus.AGS_NOT_INCLUDED
            )
            play_state.save()

            logger.error(f"LTI-AGS: AGS claim not defined for play {play.id}")

        except AGSNoLineItem:
            play_state.submission_status = (
                LtiPlayState.SubmissionStatus.AGS_NOT_INCLUDED
            )
            play_state.save()

            logger.error(
                f"LTI-AGS: no AGS operations performed; "
                f"a line item was not provided for play {play.id}"
            )

        except Exception as e:
            # Try to extract response details if available
            response_code = getattr(e, "response", None)
            if response_code and hasattr(response_code, "status_code"):
                status = response_code.status_code
                message = response_code.text
                logger.error(
                    f"LTI-AGS: failed to submit score for play {play.id}. "
                    f"Status: {status}, Message: {message}"
                )
            else:
                logger.error(
                    f"LTI-AGS: failed to submit score for play {play.id}. "
                    f"Error: {str(e)}"
                )
            # @TODO based on exception content, update submission status to NO_ATTEMPTS
            # or filter by additional clauses

            play_state.submission_status = LtiPlayState.SubmissionStatus.ERR_FAILURE
            play_state.save()

        return play_state.submission_status
