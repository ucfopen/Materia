from api.serializers import QuestionSetSerializer
from core.message_exception import MsgNoPerm
from core.models import LtiPlayState
from core.services.perm_service import PermService
from core.services.semester_service import SemesterService
from django.utils import timezone
from lti.ags.services.ags import AGSService
from lti.services.auth import LTIAuthService
from rest_framework import status
from scoring.module_factory import ScoreModuleFactory


def can_review_scores(user, instance, *, play=None, launch_data=None):
    if play is not None and (play.user_id is None or play.user_id == user.id):
        return True
    return (
        instance.permissions.filter(user=user).exists()
        or PermService.is_superuser_or_elevated(user)
        or bool(
            launch_data
            and (
                LTIAuthService.is_user_course_author(launch_data)
                or LTIAuthService.is_user_staff(launch_data)
            )
        )
    )


def can_resubmit_score(user, play):
    return (
        play.user_id == user.id
        or play.instance.guest_access
        or PermService.is_superuser_or_elevated(user)
        or play.instance.permissions.filter(user=user).exists()
    )


def score_report(play):
    module = ScoreModuleFactory.create_score_module(instance=play.instance, play=play)
    response = module.get_score_report()
    response["qset"] = (
        QuestionSetSerializer(play.qset).data
        if play.qset
        else {"version": None, "data": None}
    )
    response["lti"] = None
    if play.auth == "lti":
        play_state = getattr(play, "lti_play_state", None)
        if play_state is None:
            response["lti"] = {"is_legacy": True}
        else:
            response["lti"] = {
                "is_legacy": False,
                "status": play_state.submission_status,
                "submit_attempts": play_state.submission_attempts,
                "submission_available": (
                    timezone.now() - play.created_at
                ).total_seconds()
                <= 86400,
                "max_score": play_state.score_submitted,
            }
    return response


def score_history(plays, instance, user, context):
    semester = SemesterService.get_current_semester()
    return {
        "scores": [
            {
                "id": play.pk,
                "created_at": play.created_at.isoformat(),
                "percent": play.percent,
                "current_context": play.context_id == context
                and play.semester == semester,
                "lti": play.auth == "lti",
            }
            for play in plays.order_by("-created_at")
        ],
        "attemptsLeft": instance.attempts_left_for_user(user, context),
    }


def resubmit_score(user, play):
    if not can_resubmit_score(user, play):
        raise MsgNoPerm()
    if not hasattr(play, "lti_play_state"):
        return {
            "success": False,
            "message": "No LTI play state found.",
        }, status.HTTP_400_BAD_REQUEST
    play_state = play.lti_play_state
    if play_state.submission_status != LtiPlayState.SubmissionStatus.ERR_FAILURE:
        return {
            "success": False,
            "message": "Invalid play state for resubmission.",
        }, status.HTTP_400_BAD_REQUEST
    if (
        play_state.submission_attempts >= 4
        and not PermService.is_superuser_or_elevated(user)
    ):
        return {
            "success": False,
            "message": "No remaining retry attempts.",
        }, status.HTTP_400_BAD_REQUEST
    submit_status = AGSService.submit_score_for_play(play)
    if submit_status == LtiPlayState.SubmissionStatus.SUCCESS:
        return {"success": True}, status.HTTP_200_OK
    return {
        "success": False,
        "status": submit_status,
        "submitted_at": timezone.now(),
    }, status.HTTP_403_FORBIDDEN
