import logging
import os
import traceback

from core.management.commands import widget
from core.models import Widget
from api.permissions import IsSuperuser
from api.serializers import WidgetSerializer
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from core.message_exception import MsgFailure, MsgException
from core.services.widget_installer_service import WidgetInstallerService

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
                temp_dir = WidgetInstallerService.get_temp_dir()
                temp_file_path = os.path.join(temp_dir, file.name)
                with open(temp_file_path, "wb+") as file_out:
                    for chunk in file.chunks():
                        file_out.write(chunk)

                result = WidgetInstallerService.extract_package_and_install(
                    temp_file_path, False, 0
                )
                results.append(result)

                os.remove(temp_file_path)

            return Response(results, status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Checks if there is an update available for the widget
    @action(detail=True, methods=["get"])
    def check_update(self, request, pk):
        # Grab latest available version
        result = WidgetInstallerService.get_latest_version_for(pk)
        new_ver, _, _ = result

        # Check if the latest available version is newer than what's currently installed
        update_available = WidgetInstallerService.needs_update(pk, new_ver)

        # Return
        if update_available:
            return Response({"update_available": True, "new_version": new_ver})
        else:
            return Response({"update_available": False})

    # Installs the latest version of the widget available
    @action(detail=True, methods=["get"])
    def update_to_latest_version(self, request, pk):
        # Get latest version
        result = WidgetInstallerService.get_latest_version_for(pk)
        new_ver, wigt_link, checksum_link = result

        # Check if update is even needed
        update_available = WidgetInstallerService.needs_update(pk, new_ver)
        if not update_available:
            raise MsgFailure(msg="Widget already up to date")

        # We are good to update - start the process
        widget_command = widget.Command()
        try:
            widget_command.install_from_url(wigt_link, checksum_link, pk)
        except Exception as e:
            print(traceback.format_exc())
            raise MsgFailure(msg=str(e))

        return Response({"success": True})

    # Checks all widgets for possible updates
    @action(detail=False, methods=["get"])
    def check_updates(self, request):
        updates = {"updates_available": [], "could_not_check": []}
        for widget_id in Widget.objects.values_list("id", flat=True).all():
            # Grab latest available version
            try:
                result = WidgetInstallerService.get_latest_version_for(widget_id)
            except MsgException as e:
                updates["could_not_check"].append(
                    {"widget_id": widget_id, "msg": e.as_json()}
                )
                continue
            new_ver, _, _ = result

            # Check if the latest available version is newer than what's currently installed
            update_available = WidgetInstallerService.needs_update(widget_id, new_ver)

            if update_available:
                updates["updates_available"].append(
                    {
                        "widget_id": widget_id,
                        "new_version": new_ver,
                    }
                )

        return Response(updates)
