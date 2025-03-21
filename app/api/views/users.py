import hashlib
import json
import logging

from core.models import UserSettings
from core.permissions import IsSuperuserOrReadOnly
from core.serializers import UserMetadataSerializer, UserSerializer
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import redirect
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

logger = logging.getLogger("django")


class UserViewSet(viewsets.ModelViewSet):

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperuserOrReadOnly]
    # NEVER allow user creation or deletion from the API
    # PATCH requires SU
    http_method_names = ["get", "patch", "head", "put"]

    queryset = User.objects.none()

    def get_queryset(self):
        user = self.request.user
        # TODO even superusers don't need a list of every user
        # if user.is_superuser:
        #     return User.objects.all()
        return User.objects.filter(pk=user.pk)

    @action(detail=True, methods=["put"])
    def profile_fields(self, request, pk=None):
        serializer = UserMetadataSerializer(data=request.data)

        if serializer.is_valid():
            validated = serializer.validated_data

            user_profile, _ = UserSettings.objects.get_or_create(user=request.user)
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
