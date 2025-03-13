from django.core.cache import cache
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from core.models import UserSettings, Question, WidgetQset, WidgetInstance
from util.message_util import MsgBuilder
from util.perm_manager import PermManager
from django.contrib.auth import logout
from django.shortcuts import redirect

import hashlib
import json
import datetime
import logging

from core.permissions import IsSuperuserOrReadOnly

from rest_framework import permissions, viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from core.serializers import UserSerializer, UserMetadataSerializer, QuestionSetSerializer, WidgetInstanceSerializer

from util.qset.QuestionUtil import QuestionUtil
from util.serialization import SerializationUtil


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

    @action(detail=True, methods=['put'])
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
            return Response({"success": True, "profile_fields": user_profile.profile_fields})
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def get_gravatar(email):
    clean_email = email.strip().lower().encode('utf-8')
    hash_email = hashlib.md5(clean_email).hexdigest()
    return f"https://www.gravatar.com/avatar/{hash_email}?d=retro&s=256"

## API stuff below this line is not yet converted to DRF ##

class UsersApi:

    # TODO should this be under playsessions?
    @staticmethod
    def activity(request):
        #TODO: get actual activity data instead of dummy data
        activity_data = {
            "activity": [
                {
                    "play_id": 12345,
                    "created_at": int(datetime.datetime.now().timestamp()),
                    "score": "100.0",
                    "percent": 100,
                    "is_complete": "1",
                    "inst_id": 6789,
                    "widget_name": "Associations",
                    "inst_name": "Associations is the best widget",
                },
            ],
            "more": False,
        }
        return JsonResponse(activity_data)


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
        return redirect('/')

    @staticmethod
    def get_questions(request):
        data = json.loads(request.body)
        ids = data.get("ids", [])
        q_types = data.get("types", "")

        # Data validation
        if ids is None:
            ids = []
        if type(ids) is not list:
            return MsgBuilder.invalid_input(msg="Expected 'ids' to be list").as_json_response()

        # TODO if (\Service_User::verify_session() !== true) return Msg::no_login();

        # If IDs are specified, get those IDs
        if len(ids) > 0:
            questions = Question.objects.filter(pk__in=ids)
            questions_as_dicts = SerializationUtil.serialize_set(questions)
            questions_data_only = [question["data"] for question in questions_as_dicts]
            return JsonResponse({"questions": questions_data_only})

        # Else, just get all of this user's questions
        else:
            # TODO use real user's id. i'm using this one rn bc they have a lot of questions to their name in QA lol
            questions = QuestionUtil.get_users_question(50757, q_types)
            return JsonResponse({"questions": questions})



