from api.permissions import IsSuperuser
from api.serializers import SiteImageSerializer, SiteMessageSerializer
from core.models import SiteImage, SiteMessage
from django.db.models import Q
from django.utils import timezone
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


class SiteMessageViewSet(viewsets.ModelViewSet):

    queryset = SiteMessage.objects.all()
    serializer_class = SiteMessageSerializer
    http_method_names = ["get", "post", "delete"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsSuperuser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = SiteMessage.objects.all()
        msg_type = self.request.query_params.get("type", None)
        msg_types = self.request.query_params.get("types", None)
        include_expired = self.request.query_params.get("include_expired", "false")

        if msg_types:
            queryset = queryset.filter(message_type__in=msg_types.split(","))

        if msg_type:
            queryset = queryset.filter(message_type=msg_type)

        include_expired = str(include_expired).lower() in ["1", "true"]
        if not include_expired:
            now = timezone.now()
            queryset = queryset.filter(
                (Q(start_at__isnull=True) | Q(start_at__lte=now))
                & (Q(end_at__isnull=True) | Q(end_at__gte=now))
            )

        return queryset
