from django.http import JsonResponse
import datetime

class UsersApi:
    def get(request):
        #my user works here, should get it from db(not possible atm) or create it.
        user_data = {
            "profile_fields": {
                "useGravatar": True,
                "notify": True
            },
            "id": 153565,
            "username": "5299729",
            "first": "Christopher",
            "last": "Solanilla",
            "email": "ch862076@ucf.edu",
            "group": 1,
            "last_login": 1733146261,
            "created_at": 1717441736,
            "updated_at": 1717441736,
            "avatar": "https://secure.gravatar.com/avatar/36ad3cc772e5967214841b49ee6b57f8?s=256&d=retro",
            "is_student": False,
            "is_support_user": False
        }
        return JsonResponse(user_data)

    def activity(request):
        #some dummy data, should get it from db somehow.
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
