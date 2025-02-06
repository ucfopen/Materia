from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
import hashlib
import json
import datetime

def get_gravatar(email):
    clean_email = email.strip().lower().encode('utf-8')
    hash_email = hashlib.md5(clean_email).hexdigest()
    return f"https://www.gravatar.com/avatar/{hash_email}?d=retro&s=256"


class UsersApi:
    @staticmethod
    def get(request):
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not authenticated"}, status=403)

        is_student = request.user.groups.filter(name="Student").exists()
        is_support_user = request.user.groups.filter(name="Support").exists()
        avatar_url = get_gravatar(request.user.email)
        user = request.user

        #TODO: figure out better way to handle profile_fields
        user_data = {
            "id": user.id,
            "username": user.username,
            "first": user.first_name,
            "last": user.last_name,
            "email": user.email,
            "is_student": False,
            "is_support_user": user.is_staff,
            "avatar": avatar_url,
            "profile_fields": {
                "useGravitar": True,
                "beardMode": True,
            }
        }
        return JsonResponse(user_data)


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




