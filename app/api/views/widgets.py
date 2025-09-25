import logging
import os

from core.models import Widget
from core.permissions import IsSuperuser
from core.serializers import WidgetSerializer
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from util.widget.installer import WidgetInstaller

logger = logging.getLogger("django")


class WidgetViewSet(viewsets.ModelViewSet):
    serializer_class = WidgetSerializer

    queryset = Widget.objects.all()

    def get_queryset(self):
        widget_ids_raw = self.request.query_params.get("ids", "")
        widget_type = self.request.query_params.get("type", "catalog")

        widgets = Widget.objects.all().order_by("name")

        # Request only wants the specified IDs
        if widget_ids_raw:
            return widgets.filter(id__in=widget_ids_raw.split(","))
        # Request wants to filter by widget type
        else:
            # Apply widget type filter
            match widget_type:
                case "admin":
                    return widgets
                case "all" | "playable":
                    return widgets.filter(is_playable=True)
                case "featured":
                    return widgets.filter(
                        is_playable=True, in_catalog=True, featured=True
                    )
                case "catalog" | "default" | _:
                    return widgets.filter(is_playable=True, in_catalog=True)

    def get_permissions(self):
        if self.action in ["list", "retrieve", "publish_perms_verify"]:
            return [permissions.AllowAny()]
        return [IsSuperuser()]

    @action(detail=True, methods=["get"])
    def publish_perms_verify(self, request, pk):
        widget = self.get_object()
        return Response({"publishPermsValid": widget.publishable_by(request.user)})

    @action(detail=False, methods=["POST"])
    def upload(self, request):
        files = request.FILES.getlist("files[]")

        if not files:
            raise ValidationError("No files provided.")

        try:
            results = []

            for file in files:
                temp_dir = WidgetInstaller.get_temp_dir()
                temp_file_path = os.path.join(temp_dir, file.name)
                with open(temp_file_path, "wb+") as file_out:
                    for chunk in file.chunks():
                        file_out.write(chunk)

                result = WidgetInstaller.extract_package_and_install(
                    temp_file_path, False, 0
                )
                results.append(result)

                os.remove(temp_file_path)

            return Response(results, status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
