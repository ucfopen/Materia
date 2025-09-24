from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from api.filters import UserExtraAttemptsFilter
from core.models import UserExtraAttempts
from core.permissions import IsSuperOrSupportUser
from core.serializers import UserExtraAttemptsSerializer


class UserExtraAttemptsViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperOrSupportUser]
    queryset = UserExtraAttempts.objects.all()
    serializer_class = UserExtraAttemptsSerializer

    filter_backends = [DjangoFilterBackend]

    @property
    def filterset_class(self):
        if self.action == "list":
            return UserExtraAttemptsFilter
        return None
