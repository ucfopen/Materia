import logging

from core.models import LogPlay, LtiPlayState
from django.conf import settings
from django.db.models import Max
from django.utils import timezone
from lti.ags.client import AGSClient
from lti.ags.exceptions import AGSClaimNotDefined, AGSNoLineItem, AGSNoPlayState

logger = logging.getLogger(__name__)


class AGSService:

    @staticmethod
    def submit_score_for_play(play: LogPlay) -> str:
        """
        Handles AGS score submission for a given play.
        Returns the LtiPlayState.SubmissionStatus string based on the submission result.
        """
        play_state = LtiPlayState.objects.filter(play_id=play.id).first()
        if not play_state:
            raise AGSNoPlayState()

        if (
            not play_state.ags_scoring_enabled
            or not play_state.ags_line_item
            or not play_state.ags_user_id
        ):
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

            # AGS submission failures raise exceptions through raise_for_status()
            # If no exception is caught, indicates a 200
            play_state.submission_status = LtiPlayState.SubmissionStatus.SUCCESS
            play_state.last_submitted = timezone.now()

            logger.info(
                "LTI-AGS: successfully transmitted %s score for play %s",
                max_score,
                play.id,
            )

        except AGSClaimNotDefined:
            play_state.submission_status = (
                LtiPlayState.SubmissionStatus.AGS_NOT_INCLUDED
            )

            logger.info("LTI-AGS: AGS claim not defined for play %s", play.id)

        except AGSNoLineItem:
            play_state.submission_status = (
                LtiPlayState.SubmissionStatus.AGS_NOT_INCLUDED
            )

            logger.info(
                "LTI-AGS: no AGS operations performed; "
                "a line item was not provided for play %s",
                play.id,
            )

        # The remaining exceptions come from requests's raise_for_status() method
        except Exception as e:
            if e.response.status_code:
                # Canvas responds with a 422 when the attempt limit is reached OR
                # if the AGS payload is invalid
                # Because of that we have to inspect the message body as well
                if e.response.status_code == 422:
                    body = e.response.json()
                    if (
                        "errors" in body
                        and "message" in body["errors"]
                        and "maximum number of allowed attempts"
                        in body["errors"]["message"].lower()
                    ):
                        play_state.submission_status = (
                            LtiPlayState.SubmissionStatus.ERR_NO_ATTEMPTS
                        )

                # a non-422 is a general error (potentially a 500)
                # this is officially ERR_FAILURE
                else:
                    logger.error(
                        "LTI-AGS: failed to submit score for play %s",
                        play.id,
                        exc_info=True,
                    )

                    play_state.submission_status = (
                        LtiPlayState.SubmissionStatus.ERR_FAILURE
                    )
            else:
                logger.error(
                    "LTI-AGS: failed to submit score for play %s",
                    play.id,
                    exc_info=True,
                )
                play_state.submission_status = LtiPlayState.SubmissionStatus.ERR_FAILURE

        play_state.submission_attempts = play_state.submission_attempts + 1
        play_state.save()

        return play_state.submission_status
