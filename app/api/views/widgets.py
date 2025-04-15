import logging

from core.models import Widget
from core.permissions import IsSuperuser
from core.serializers import WidgetSerializer
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

logger = logging.getLogger("django")


class WidgetViewSet(viewsets.ModelViewSet):
    serializer_class = WidgetSerializer

    queryset = Widget.objects.all()

    def get_queryset(self):
        # TODO add additional filtering based on type query_param
        widgets = Widget.objects.all().order_by("name")
        if self.request.query_params.get("ids", ""):
            return widgets.filter(
                id__in=self.request.query_params.get("ids", "").split(",")
            )
        else:
            return widgets

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [IsSuperuser()]

    @action(detail=True, methods=["get"])
    def publish_perms_verify(self, request, pk):
        widget = self.get_object()
        return Response({"publishPermsValid": widget.publishable_by(request.user)})
