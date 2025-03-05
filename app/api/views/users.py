from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
import hashlib
import json
import datetime

from core.permissions import IsSuperuserOrReadOnly

from rest_framework import permissions, viewsets
from core.serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperuserOrReadOnly]
    # NEVER allow user creation or deletion from the API
    # PATCH requires SU
    http_method_names = ['get', 'patch', 'head']

    queryset = User.objects.none()

    def get_queryset(self):
        user = self.request.user
        # TODO even superusers don't need a list of every user
        # if user.is_superuser:
        #     return User.objects.all()
        return User.objects.filter(pk=user.pk)

def get_gravatar(email):
    clean_email = email.strip().lower().encode('utf-8')
    hash_email = hashlib.md5(clean_email).hexdigest()
    return f"https://www.gravatar.com/avatar/{hash_email}?d=retro&s=256"

## API stuff below this line is not yet fully converted to DRF ##

class UsersApi:

    @staticmethod
    def activity(request):
        # some dummy data, should get it from db somehow.
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




