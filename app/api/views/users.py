import hashlib
import json
import logging

from django.db.models import Q
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from core.models import ObjectPermission, UserSettings
from core.permissions import IsSelfOrElevatedAccess, IsSuperuserOrReadOnly
from core.serializers import (
    ObjectPermissionSerializer,
    UserMetadataSerializer,
    UserSerializer,
)
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import redirect
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from util.custom_paginations import PageNumberWithTotalPagination
from util.message_util import MsgBuilder

logger = logging.getLogger("django")


class UserPagination(PageNumberWithTotalPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 50


class UserViewSet(viewsets.ModelViewSet):

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperuserOrReadOnly]
    # NEVER allow user creation or deletion from the API
    # PATCH requires SU
    http_method_names = ["get", "patch", "head", "put"]

    queryset = User.objects.none()

    def get_queryset(self):
        pk = self.kwargs.get("pk")
        user_ids = self.request.query_params.get("ids")

        # Grab a list of users defined in the ids param
        if pk is None and user_ids is not None:
            try:  # Process param list
                user_ids = [int(s.strip()) for s in user_ids.split(",")]
            except Exception:
                raise ValidationError(detail={"ids": "Must be a comma separated list of integers"})
            return User.objects.filter(pk__in=user_ids)

        # NOBODY should need a full list of *all* users - not even superusers
        elif pk is None:
            return User.objects.none()

        return User.objects.filter(id=pk)

    @action(detail=False, methods=["get"])
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=["put"], permission_classes=[IsSelfOrElevatedAccess])
    def profile_fields(self, request, pk=None):
        user = self.get_object()
        serializer = UserMetadataSerializer(data=request.data)

        if serializer.is_valid():
            validated = serializer.validated_data

            user_profile, _ = UserSettings.objects.get_or_create(user=user)
            profile_fields = user_profile.get_profile_fields()
            for key, value in validated.items():
                profile_fields[key] = value

                # if key == "darkMode":
                #     cache_key = f'user_dark_mode_{request.user.id}'
                #     logger.error(f"located darkMode key for user {request.user.id} and deleting cache !!!")
                #     cache.delete(cache_key)

            user_profile.profile_fields = profile_fields
            user_profile.save()

            # TODO try/catch required? at this point we've already validated input
            return Response(
                {"success": True, "profile_fields": user_profile.profile_fields}
            )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Get list of objects the user has access to. Requires elevated access for non-self.
    @action(detail=True, methods=["get"], permission_classes=[IsSelfOrElevatedAccess])
    def perms(self, request, pk):

        user = self.get_object()
        if not user:
            return MsgBuilder.invalid_input().as_drf_response()

        access_permissions = ObjectPermission.objects.filter(user=user)
        serialized = ObjectPermissionSerializer(access_permissions, many=True)
        return Response(serialized.data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def search(self, request):
        # Get search query
        query: str = request.query_params.get("query")
        if query is None or query.strip() == "":
            raise ValidationError(detail=["Missing non-empty 'query' parameter"])

        users = (User.objects
                 .filter(
                     Q(username__icontains=query)
                     | Q(first_name__icontains=query)
                     | Q(last_name__icontains=query)
                     | Q(email__icontains=query)
                 )
                 .filter(~Q(id=request.user.id))  # dont include self
                 .order_by("first_name"))  # TODO dont include superusers? php doesnt, but questions why we aren't

        paginator = UserPagination()
        paginated_queryset = paginator.paginate_queryset(users, request)
        serializer = self.get_serializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)


def get_gravatar(email):
    clean_email = email.strip().lower().encode("utf-8")
    hash_email = hashlib.md5(clean_email).hexdigest()
    return f"https://www.gravatar.com/avatar/{hash_email}?d=retro&s=256"


# API stuff below this line is not yet converted to DRF #


class UsersApi:
    def service_user_login(request):
        if request.method == "POST":
            try:
                data = json.loads(request.body)
                username = data.get("username")
                password = data.get("password")

                user = authenticate(username=username, password=password)
                if user is not None:
                    login(request, user)
                    return JsonResponse({"isAuthenticated": True}, status=200)
                else:
                    return JsonResponse({"isAuthenticated": False}, status=401)

            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON"}, status=400)

            return JsonResponse({"error": "Invalid request method"}, status=405)

    def logout(request):
        logout(request)
        return redirect("/")
