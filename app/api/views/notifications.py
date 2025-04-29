from core.models import Notification
from core.serializers import NotificationsSerializer
from rest_framework import permissions, viewsets


class NotificationsViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationsSerializer
    permission_classes = [permissions.IsAuthenticated]

    http_method_names = ["get", "head"]

    queryset = Notification.objects.none()

    def get_queryset(self):
        return Notification.objects.filter(to_id=self.request.user)

    # TODO notification deletion
