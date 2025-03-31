import logging

from core.models import Widget
from core.serializers import WidgetSerializer
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

logger = logging.getLogger("django")


class WidgetViewSet(viewsets.ModelViewSet):
    serializer_class = WidgetSerializer
    permission_classes = [permissions.AllowAny]

    queryset = Widget.objects.all()

    def get_queryset(self):
        widgets = Widget.objects.all().order_by("name")
        if self.request.query_params.get("ids", ""):
            return widgets.filter(
                id__in=self.request.query_params.get("ids", "").split(",")
            )
        else:
            return widgets

    @action(detail=True, methods=["get"])
    def publish_perms_verify(self, request, pk):
        widget = self.get_object()
        return Response({"publishPermsValid": widget.publishable_by(request.user)})
