import logging
from datetime import datetime

from core.models import Asset, PermObjectToUser
from core.serializers import AssetSerializer
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from util.widget.asset.manager import AssetManager

logger = logging.getLogger("django")


class AssetViewSet(viewsets.ViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer

    def get_queryset(self):
        return AssetManager.get_assets_by_user(
            self.request.user.id, PermObjectToUser.Perm.FULL.value
        )

    @action(detail=False, methods=["GET"])
    def all(self, request):
        assets = self.get_queryset()
        serialized = self.serializer_class(assets, many=True)
        return Response(serialized.data)

    @action(detail=True, methods=["DELETE"])
    def delete(self, request, pk=None):
        try:
            try:
                PermObjectToUser.objects.get(
                    user=request.user, object_id=pk, perm=PermObjectToUser.Perm.FULL
                )
            except PermObjectToUser.DoesNotExist:
                return Response(
                    {
                        "detail": "User does not own asset.",
                        "status": status.HTTP_403_FORBIDDEN,
                    }
                )

            try:
                asset_obj = Asset.objects.get(id=pk)
                asset_obj.is_deleted = True
                asset_obj.deleted_at = datetime.now()
                asset_obj.save()

                return Response(
                    {"detail": "Asset deleted.", "status": status.HTTP_200_OK}
                )

            except Asset.DoesNotExist:
                return Response(
                    {"detail": "Asset does not exist.", "status": status.HTTP_410_GONE}
                )
        except Exception:
            return Response(
                {
                    "detail": "Asset not deleted.",
                    "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
                }
            )

    @action(detail=True, methods=["PATCH"])
    def restore(self, request, pk=None):
        try:
            try:
                PermObjectToUser.objects.get(
                    user=request.user, object_id=pk, perm=PermObjectToUser.Perm.FULL
                )
            except PermObjectToUser.DoesNotExist:
                return Response(
                    {
                        "detail": "User does not own asset.",
                        "status": status.HTTP_403_FORBIDDEN,
                    }
                )

            try:
                asset_obj = Asset.objects.get(id=pk)
                asset_obj.is_deleted = False
                asset_obj.deleted_at = None
                asset_obj.save()

                return Response(
                    {"detail": "Asset restored.", "status": status.HTTP_200_OK}
                )

            except Asset.DoesNotExist:
                return Response(
                    {"detail": "Asset does not exist.", "status": status.HTTP_410_GONE}
                )
        except Exception:
            return Response(
                {
                    "detail": "Asset not restored.",
                    "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
                }
            )
