from django.http import JsonResponse


class NotificationsApi:
    @staticmethod
    def get(request):
        return JsonResponse({})
