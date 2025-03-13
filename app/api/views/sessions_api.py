import json

from django.http import JsonResponse, HttpResponseNotFound, HttpResponseBadRequest

from core.models import WidgetInstance
from util.logging.session_logger import SessionLogger
from util.logging.session_play import SessionPlay
from util.message_util import MsgBuilder
from util.widget.validator import ValidatorUtil

from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
# from core.serializers import


class SessionView(APIView):
    def get(self, request):
        perm = ""
        if request.user.is_superuser:
            perm = "super_user"
        elif request.user.groups.filter(name='support_user').exists():
            perm = "support_user"
        elif request.user.groups.filter(name='basic_author').exists():
            perm = "author"
        elif request.user.is_authenticated:
            perm = "student"
        else:
            perm = "anonymous"

        return Response({
            "isAuthenticated": request.user.is_authenticated,
            "permLevel": perm
        })


## API stuff below this line is not yet converted to DRF ##
class SessionsApi:
    # TODO this is moving to playsessions

    # WAS session_play_create
    @staticmethod
    def play_start(request):
        # Verify request params
        instance_id = json.loads(request.body)["instanceId"]
        if instance_id is None:
            return MsgBuilder.invalid_input(msg="Missing instance ID").as_json_response()

        # Get and verify widget
        instance = WidgetInstance.objects.get(pk=instance_id)
        if instance is None:
            return HttpResponseNotFound()
        if not instance.playable_by_current_user:
            return MsgBuilder.no_login().as_json_response()
        if instance.is_draft:
            return MsgBuilder.failure("Drafts Not Playable", "Must use Preview mode to play a draft").as_json_response()

        # Create and start play session
        session_play = SessionPlay()
        play_id = session_play.start(instance, 0)
        return JsonResponse({"playId": play_id})

    # WAS play_logs_save
    @staticmethod
    # Gets called when a game ends with the play data. Scores the game, saves results, and submits score to LTI
    def play_save(request):
        # Get all request params
        request_body = json.loads(request.body)
        play_id = request_body.get("playId")
        logs = request_body.get("logs")
        preview_instance_id = request_body.get("previewInstanceId")
        preview_play_id = request_body.get("previewPlayId")

        # Validate request params
        if not preview_instance_id and not ValidatorUtil.is_valid_long_hash(play_id):
            return MsgBuilder.invalid_input(msg="Invalid play ID").as_json_response()

        if not logs or not isinstance(logs, list):
            return MsgBuilder.invalid_input(msg="Missing log array").as_json_response()

        # Save logs
        if ValidatorUtil.is_valid_hash(preview_instance_id):
            ##### PREVIEW MODE #####
            # Confirm preview_play_id is present
            if preview_play_id is None:
                return MsgBuilder.invalid_input(msg="Missing preview play ID").as_json_response()
            # Confirm user session for preview
            # TODO: if (\Service_User::verify_session() !== true) return Msg::no_login();
            SessionLogger.save_preview_logs(request.session, preview_instance_id, preview_play_id, logs)
            return JsonResponse({"success": True})
        else:
            ##### PLAYING FOR KEEPS #####
            # Grab session play
            session_play = SessionPlay.get_or_none(play_id)
            if not session_play:
                return HttpResponseNotFound()

            # TODO: the double verification of user session then session play seems like it might be redundant, take a look at later again
            # Confirm user session for real play
            instance = session_play.data.instance
            if not instance.playable_by_current_user():
                return MsgBuilder.no_login().as_json_response()
            # if not instance.guest_access and TODO: self::session_play_verify($play_id) !== true
            #     return MsgUtil.create_no_login_msg()

            # Validate session play
            is_valid = session_play.validate()
            if not is_valid:
                return MsgBuilder.invalid_input(msg="Invalid play session").as_json_response()

            # Store
            SessionLogger.store_log_array(session_play, logs)

            # Handle scoring
            # TODO: complicated scoring logic that we'll get to another time lol

            # TODO: if score_mod.finished:
            session_play.set_complete(150, 200, 75.0)

            return JsonResponse({  # TODO
                "success": True,
                "score": 150,
            })
