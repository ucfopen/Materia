import base64
import json

from core.models import LogPlay, LogStorage
from core.message_exception import MsgNoLogin, MsgInvalidInput
from core.utils.validator_util import ValidatorUtil

from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from api.serializers import PlayStorageSaveSerializer

class PlayStorageSaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["post"]

    def post(self, request):
        serializer = PlayStorageSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        play_id = serializer.validated_data["play_id"]
        log_data = serializer.validated_data["logs"]

        try:
            play = LogPlay.objects.get(id=play_id)
        except LogPlay.DoesNotExist:
            return MsgInvalidInput(msg="No play found with the given Play ID")

        user = request.user
        instance = play.instance

        if not instance.playable_by_current_user(user):
            return MsgNoLogin(request=request)
        
        logs = []
        
        if ValidatorUtil.is_valid_hash(instance.id) and ValidatorUtil.is_valid_long_hash(play_id):
            for storage_packet in log_data:
                stringified_data = json.dumps(storage_packet.get("data"))

                byte_data = stringified_data.encode("utf-8")
                encoded = base64.b64encode(byte_data).decode("ascii")

                logs.append(
                    LogStorage(
                        instance=instance,
                        play_log=play,
                        user=user,
                        name=storage_packet.get("name"),
                        data=encoded,
                    )
                )

        LogStorage.objects.bulk_create(logs)

        return Response(True)

