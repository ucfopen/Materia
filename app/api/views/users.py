import json
import logging

from core.models import ObjectPermission, UserSettings
from core.permissions import IsSelfOrElevatedAccess, IsSuperOrSupportUser
from core.serializers import (
    ObjectPermissionSerializer,
    UserMetadataSerializer,
    UserSerializer,
)
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import redirect
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
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
    pagination_class = UserPagination

    # we attach elevated_access to the serializer context to inform the serializer
    # which fields to include:
    # all users get full info about themselves (/me), only elevated users get full info
    # when requesting non-self user data
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["elevated_access"] = (
            self.request.user.is_superuser
            or self.request.user.groups.filter(name="support_user").exists()
            or self.action == "me"
        )
        return context

    def get_permissions(self):
        if self.action in [
            "put",
            "patch",
        ]:  # only superusers can modify user properties!
            return [permissions.IsAuthenticated(), IsSuperOrSupportUser()]
        elif (
            self.action == "list"
            and self.request.query_params.get("search") is not None
        ):  # only users with elevated access can search for users carte blanche
            return [permissions.IsAuthenticated(), IsSuperOrSupportUser()]
        elif (
            self.action == "list" and self.request.query_params.get("ids") is not None
        ):  # allow authenticated users to retrieve specific ids (required for collab)
            return [permissions.IsAuthenticated()]
        elif (
            self.action == "retrieve"
        ):  # allow authenticated users to retrieve specific user data
            return [permissions.IsAuthenticated()]
        else:  # do not allow remaining actions (create, delete) under any circumstance
            return []

    queryset = User.objects.none()

    def get_queryset(self):
        pk = self.kwargs.get("pk")
        user_ids = self.request.query_params.get("ids")

        if pk is None:
            if user_ids is not None:
                try:
                    user_ids = [int(s.strip()) for s in user_ids.split(",")]
                except Exception:
                    raise ValidationError(
                        detail={"ids": "Must be a comma separated list of integers"}
                    )
                    # an explicit list of user ids has been provided - only return these users
                    # TODO verify if this should be restricted to elevated access (does collab needs it?)
                return User.objects.filter(pk__in=user_ids)

            elif self.request.query_params.get("search"):
                search = self.request.query_params.get("search")
                return (
                    User.objects.filter(
                        Q(first_name__icontains=search)
                        | Q(last_name__icontains=search)
                        | Q(email__icontains=search)
                    )
                    .filter(~Q(id=self.request.user.id))
                    .filter(is_superuser=False)
                )
            # NOBODY should need a full list of all users - not even superusers
            else:
                return User.objects.none()
        return User.objects.filter(id=pk)

    # disable paginated response when we're requesting an array of ids
    def paginate_queryset(self, queryset):
        if self.request.query_params.get("ids") is not None:
            return None
        return super().paginate_queryset(queryset)

    @action(detail=False, methods=["get"])
    def me(self, request):
        serializer = self.get_serializer(request.user)
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

        type = request.query_params.get("type")
        if type:
            try:
                content_type = ContentType.objects.get(model=type)
                access_permissions = access_permissions.filter(
                    content_type=content_type
                )
            except ContentType.DoesNotExist:
                return MsgBuilder.invalid_input().as_drf_response()

        serialized = ObjectPermissionSerializer(access_permissions, many=True)
        return Response(serialized.data)


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
