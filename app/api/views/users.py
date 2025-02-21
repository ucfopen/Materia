from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from core.models import UserSettings
from util.perm_manager import PermManager
from django.contrib.auth import logout
from django.shortcuts import redirect

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
        #we only care about the profile, normally it returns a tuple
        user_profile, _= UserSettings.objects.get_or_create(user=user)

        user_data = {
            "id": user.id,
            "username": user.username,
            "first": user.first_name,
            "last": user.last_name,
            "email": user.email,
            "is_student": PermManager.user_is_student(user),
            "is_support_user": user.is_staff,
            "avatar": avatar_url,
            "profile_fields": user_profile.get_profile_fields()

        }
        return JsonResponse(user_data)


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


    def update_settings(request):
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not authenticated"}, status=403)

        try:
            data = json.loads(request.body)
            user_profile, _ = UserSettings.objects.get_or_create(user=request.user)
            profile_fields = user_profile.get_profile_fields()

            for key, value in data.items():
                profile_fields[key] = value

            user_profile.profile_fields = profile_fields
            user_profile.save()

            return JsonResponse({"success": True, "profile_fields": user_profile.profile_fields})


        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)


        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


    def logout(request):
        logout(request)
        return redirect('/')

