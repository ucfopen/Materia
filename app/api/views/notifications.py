from api.permissions import HasFullPerms, IsSuperOrSupportUser
from api.serializers import NotificationsSerializer
from core.models import Notification
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response


class NotificationsViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationsSerializer
    permission_classes = [HasFullPerms | IsSuperOrSupportUser]
    queryset = Notification.objects.none()

    def get_queryset(self):
        return Notification.objects.filter(to_id=self.request.user)

    @action(detail=False, methods=["delete"])
    def delete_all(self, request, *args, **kwargs):
        self.get_queryset().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
