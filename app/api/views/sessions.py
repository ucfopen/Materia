import json
import logging

from django.conf import settings
from django.contrib.auth.decorators import login_required, permission_required
from django.core import serializers
from django.http import HttpResponseServerError, JsonResponse

logger = logging.getLogger("django")


class SessionsApi:
    def author_verify(request):
        return JsonResponse({})
