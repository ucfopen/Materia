import json

from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden, HttpResponse

from core.models import WidgetInstance
from util.logging.session_logger import SessionLogger
from util.logging.session_play import SessionPlay
from util.widget.validator import ValidatorUtil


class SessionsApi:
    @staticmethod
    def session_author_verify(request):
        return JsonResponse({})

    @staticmethod
    def session_play_create(request):
        # Verify request params
        instance_id = json.loads(request.body)["instanceId"]
        if instance_id is None:
            return HttpResponseBadRequest()

        # Get and verify widget
        instance = WidgetInstance.objects.get(pk=instance_id)
        if instance is None:
            return HttpResponseNotFound()
        if not instance.playable_by_current_user:
            return HttpResponseForbidden()  # TODO: return no login message instead, refer to php code
        if instance.is_draft:
            return HttpResponseForbidden()  # TODO: return message instead, see php code

        # Create and start play session
        session_play = SessionPlay()
        play_id = session_play.start(instance, 0)
        return JsonResponse({"playId": play_id})

    @staticmethod
    # Gets called when a game ends with the play data. Scores the game, saves results, and submits score to LTI
    def play_logs_save(request):
        # Get all request params
        request_body = json.loads(request.body)
        play_id = request_body.get("playId")
        logs = request_body.get("logs")
        preview_instance_id = request_body.get("previewInstanceId")
        preview_play_id = request_body.get("previewPlayId")

        # Validate request params
        if not preview_instance_id and not ValidatorUtil.is_valid_long_hash(play_id):
            # TODO better error reporting, was originally Msg:invalid_input(playId)
            return HttpResponseBadRequest()

        if not logs or not isinstance(logs, list):
            # TODO: better error reporting, was originally Msg::invalid_input('missing log array')
            return HttpResponseBadRequest()

        # Save logs
        if ValidatorUtil.is_valid_hash(preview_instance_id):
            ##### PREVIEW MODE #####
            # Confirm preview_play_id is present
            if preview_play_id is None:
                return HttpResponseBadRequest()  # TODO better error reporting
            # Confirm user session for preview
            # TODO: if (\Service_User::verify_session() !== true) return Msg::no_login();
            SessionLogger.save_preview_logs(request.session, preview_instance_id, preview_play_id, logs)
            return JsonResponse({"success": True})
        else:
            ##### PLAYING FOR KEEPS #####
            # Grab session play
            session_play = SessionPlay.get_or_none(play_id)
            if not session_play:
                return HttpResponseNotFound()  # TODO: better error reporting

            # TODO: the double verification of user session then session play seems like it might be redundant, take a look at later again
            # Confirm user session for real play
            instance = session_play.data.instance
            if not instance.playable_by_current_user():
                return HttpResponseForbidden()  # TODO was Msg::no_login
            # if not instance.guest_access and TODO: self::session_play_verify($playId) !== true
            #     return Msg::no_login();

            # Validate session play
            is_valid = session_play.validate()
            if not is_valid:
                return HttpResponseNotFound()  # TODO: was Msg::invalid_input('invalid play session')

            # Store
            SessionLogger.store_log_array(session_play, logs)

            # Handle scoring
            # TODO: complicated scoring logic that we'll get to another time lol

            session_play.set_complete(150, 200, 75.0)

            return JsonResponse({  # TODO
                "success": True,
                "score": 150,
            })
