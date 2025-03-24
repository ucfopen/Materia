from rest_framework.response import Response
from rest_framework.views import APIView


class SessionView(APIView):
    def get(self, request):
        perm = ""
        if request.user.is_superuser:
            perm = "super_user"
        elif request.user.groups.filter(name="support_user").exists():
            perm = "support_user"
        elif request.user.groups.filter(name="basic_author").exists():
            perm = "author"
        elif request.user.is_authenticated:
            perm = "student"
        else:
            perm = "anonymous"

        return Response(
            {"isAuthenticated": request.user.is_authenticated, "permLevel": perm}
        )
