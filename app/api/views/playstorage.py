import base64
import json

from api.filters import LogStorageFilterBackend
from api.permissions import PlayStorageInstancePermissions
from api.serializers import (
    PlayStorageSaveSerializer,
    PlayStorageSerializer,
    PlayStorageTableSerializer,
)
from core.models import LogStorage
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.response import Response


class PlayStorageViewSet(viewsets.ModelViewSet):
    permission_classes = [PlayStorageInstancePermissions]
    filter_backends = [LogStorageFilterBackend, DjangoFilterBackend]
    http_method_names = ["post", "get"]

    queryset = LogStorage.objects.all()

    def get_serializer_class(self):
        if self.action == "list":
            return PlayStorageTableSerializer
        elif self.action == "create":
            return PlayStorageSaveSerializer
        else:
            return PlayStorageSerializer

    def list(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        anonymize = request.query_params.get("anonymize", False)
        serializer = PlayStorageTableSerializer(
            queryset, context={"anonymize": anonymize}
        )
        return Response(serializer.data)

    def create(self, request):
        serializer = PlayStorageSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        play = serializer.validated_data["play_id"]
        log_data = serializer.validated_data["logs"]

        user = request.user
        instance = play.instance
        logs = []
        if instance.guest_access or not request.user.is_authenticated:
            user = None

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
