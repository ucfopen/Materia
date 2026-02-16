import base64
import json
from datetime import datetime

from core.models import LogPlay, LogStorage, WidgetInstance, DateRange
from core.message_exception import MsgNoLogin, MsgInvalidInput
from core.utils.validator_util import ValidatorUtil
from core.services.log_storage_service import LogStorageService
from api.serializers import PlayStorageSaveSerializer

from django.db.models import OuterRef, Subquery
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

import phpserialize


class PlayStorageSaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["post", "get"]

    def get(self, request):
        inst_id = request.query_params.get("inst_id")

        if not ValidatorUtil.is_valid_hash(inst_id):
            return MsgInvalidInput(msg="Instance ID is not valid")

        try:
            instance = WidgetInstance.objects.get(id=inst_id)
        except WidgetInstance.DoesNotExist:
            return MsgInvalidInput(msg="No instance found with the given instance id")

        if not instance.playable_by_current_user(request.user):
            return MsgNoLogin()

        tables = LogStorageService().build_log_tables(inst_id)

        return Response(tables, status=status.HTTP_200_OK)

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

        if instance.guest_access:
            user = None
        
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
