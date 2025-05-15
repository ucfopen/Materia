from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import Notification
from core.permissions import HasFullPermsOrElevated
from core.serializers import NotificationsSerializer
from rest_framework import viewsets, status


class NotificationsViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationsSerializer
    permission_classes = [HasFullPermsOrElevated]
    queryset = Notification.objects.none()

    def get_queryset(self):
        return Notification.objects.filter(to_id=self.request.user)

    # TODO revisit this and maybe turn this into just 'DELETE /notifications/' ?
    @action(detail=False, methods=['delete'])
    def delete_all(self, request, *args, **kwargs):
        self.get_queryset().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
