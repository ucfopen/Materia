import logging
from datetime import datetime

from api.filters import AssetFilterBackend
from core.models import Asset
from core.permissions import HasPermsOrElevatedAccess
from core.serializers import AssetSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from util.message_util import MsgBuilder

logger = logging.getLogger("django")


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [HasPermsOrElevatedAccess]

    filter_backends = [AssetFilterBackend, DjangoFilterBackend]

    def destroy(self, request, pk=None):
        asset = self.get_object()
        try:

            asset.is_deleted = True
            asset.deleted_at = datetime.now()
            asset.save()

            return Response({"detail": "Asset deleted.", "status": status.HTTP_200_OK})

        except Exception:
            return MsgBuilder.failure().as_drf_response()

    @action(detail=True, methods=["POST"])
    def restore(self, request, pk=None):
        asset = self.get_object()
        try:
            asset.is_deleted = False
            asset.deleted_at = None
            asset.save()

            return Response({"detail": "Asset restored.", "status": status.HTTP_200_OK})

        except Exception:
            return MsgBuilder.failure().as_drf_response()
