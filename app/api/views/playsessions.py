# import json
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden, HttpResponse

from rest_framework import permissions, viewsets, status
from rest_framework.response import Response
from core.serializers import PlaySessionSerializer
from core.permissions import HasWidgetInstanceEditAccess
from core.models import WidgetInstance, LogPlay

from util.logging.session_play import SessionPlay
from util.widget.validator import ValidatorUtil

# from rest_framework.views import APIView

class PlaySessionViewSet(viewsets.ModelViewSet):

    # TODO permissions checks:
    #   must have instance edit perms to access all logs associated with an instance
    #   must have instance play perms to CREATE, PUT play log
    permission_classes = [permissions.IsAuthenticated, HasWidgetInstanceEditAccess]
    serializer_class = PlaySessionSerializer

    queryset = LogPlay.objects.none()

    def get_queryset(self):
        if "pk" in self.kwargs:
            return LogPlay.objects.filter(pk=self.kwargs["pk"])
        else:
            return LogPlay.objects.none()

    def create(self, request, *args, **kwargs):
        if "instanceId" in self.kwargs:
            instance = WidgetInstance.objects.get(pk=self.kwargs["instanceId"])
            if instance is None:
                return HttpResponseNotFound()
            if not instance.playable_by_current_user:
                return Response({
                    "detail": "not playable by current user",
                    "status": status.HTTP_403_FORBIDDEN
                })
            
            session_play = SessionPlay()
            play_id = session_play.start(instance, 0)
            return JsonResponse({ "playId": play_id })

        else:
            return Response({
                "detail": "instance id required.",
                "status": status.HTTP_403_FORBIDDEN
            })
        
    def update(self, request, *args, **kwargs):
        # if "playId" in self.kwargs:
        play_id = self.kwargs.get("playId", None)
        logs = self.kwargs.get("logs", None)
        preview_id = self.kwargs.get("previewInstanceId", None)

        if not play_id or (not preview_id and not ValidatorUtil.is_valid_long_hash(play_id)):
            return HttpResponseBadRequest()
        
        if not logs or not isinstance(logs, list):
            return HttpResponseBadRequest()
        
        if preview_id:
            if ValidatorUtil.is_valid_hash(preview_id):
                # TODO: Score_Manager::save_preview_logs($preview_inst_id, $logs);
                pass
        
        else:
            # PLAY FOR KEEPS
            session_play = SessionPlay.get_or_none(play_id)
            if not session_play:
                return HttpResponseNotFound()
            
        ## TODO finish this (based on api/views/sessions play_save method)

    def destroy(self, request, *args, **kwargs):
        return Response({
            "detail":"This operation is not allowed.",
            "status": status.HTTP_403_FORBIDDEN
        })
