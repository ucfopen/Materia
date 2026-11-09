import logging

from api.filters import AssetFilterBackend
from api.permissions import HasAnyPerms, IsSuperOrSupportUser
from api.serializers import AssetSerializer
from core.message_exception import MsgFailure
from core.models import Asset
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

logger = logging.getLogger(__name__)


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [
        permissions.IsAuthenticated & (HasAnyPerms | IsSuperOrSupportUser)
    ]

    filter_backends = [AssetFilterBackend, DjangoFilterBackend]

    def destroy(self, request, pk=None):
        asset = self.get_object()
        try:

            asset.is_deleted = True
            asset.deleted_at = timezone.now()
            asset.save()

            return Response({"detail": "Asset deleted.", "status": status.HTTP_200_OK})

        except Exception:
            raise MsgFailure()

    @action(detail=True, methods=["POST"])
    def restore(self, request, pk=None):
        asset = self.get_object()
        try:
            asset.is_deleted = False
            asset.deleted_at = None
            asset.save()

            return Response({"detail": "Asset restored.", "status": status.HTTP_200_OK})

        except Exception:
            raise MsgFailure()
