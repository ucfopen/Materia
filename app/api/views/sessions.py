import json

from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden

from core.models import WidgetInstance
from util.session_play import SessionPlay


def author_verify(request):
    return JsonResponse({})

def play_create(request):
    # Verify request params
    instance_id = json.loads(request.body)["instanceId"]
    if instance_id is None:
        return HttpResponseBadRequest()

    # Get and verify widget
    instance = WidgetInstance.objects.get(pk=instance_id)
    if instance is None: return HttpResponseNotFound()
    if not instance.playable_by_current_user: return HttpResponseForbidden() # TODO: return no login message instead, refer to php code
    if instance.is_draft: return HttpResponseForbidden() # TODO: return message instead, see php code

    # Create and start play session
    session_play = SessionPlay()
    play_id = session_play.start(0,instance_id)
    print("PLAY ID " + play_id)
    return JsonResponse({ 'playId': play_id })


