from django.http import JsonResponse
import datetime

class UsersApi:
    def get(request):
        return JsonResponse({})

    def activity(request):
        # Return dummy activity data
        activity_data = {
            "activity": [
                {
                    "play_id": "dummy-play-id-1",
                    "created_at": int(datetime.datetime.now().timestamp()),
                    "score": "200.00",
                    "percent": 100,
                    "is_complete": "1",
                    "inst_id": "dummyInst1",
                    "widget_name": "Dummy Widget 1",
                    "inst_name": "Dummy Instance 1",
                },
            ],
            "more": False,
        }
        return JsonResponse(activity_data)
