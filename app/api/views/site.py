from api.permissions import IsSuperuser
from api.serializers import SiteImageSerializer
from core.models import SiteImage
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


class SiteImageViewSet(viewsets.ModelViewSet):

    queryset = SiteImage.objects.all()
    serializer_class = SiteImageSerializer
    http_method_names = ["get", "post", "delete"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsSuperuser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = SiteImage.objects.all()
        image_type = self.request.query_params.get("type", None)

        if image_type:
            queryset = queryset.filter(image_type=image_type)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )
