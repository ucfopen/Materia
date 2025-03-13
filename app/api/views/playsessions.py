# import json
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden, HttpResponse

from rest_framework import permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from core.serializers import PlaySessionSerializer, PlaySessionWithExtrasSerializer
from core.permissions import HasWidgetInstanceEditAccess
from core.models import WidgetInstance, LogPlay
from util.message_util import MsgBuilder

from util.logging.session_play import SessionPlay
from util.widget.validator import ValidatorUtil


class PlaySessionPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 100


class PlaySessionViewSet(viewsets.ModelViewSet):

    # TODO permissions checks:
    #   must have instance edit perms to access all logs associated with an instance
    #   must have instance play perms to CREATE, PUT play log
    permission_classes = [permissions.IsAuthenticated, HasWidgetInstanceEditAccess]
    pagination_class = PlaySessionPagination

    # we only need extras (widget name, inst name) when on the profile page
    def get_serializer_class(self):
        if self.request.query_params.get("include_activity"):
            return PlaySessionWithExtrasSerializer
        else:
            return PlaySessionSerializer

    queryset = LogPlay.objects.none()

    # default queryset returns all plays for the current user
    # inst and widget names are only included via ?include_activity=true
    def get_queryset(self):
        if "pk" in self.kwargs:
            return LogPlay.objects.filter(pk=self.kwargs["pk"])
        else:
            if self.request.query_params.get("include_activity"):
                return LogPlay.objects.select_related("instance", "instance__widget").filter(user=self.request.user)
            else:
                return LogPlay.objects.filter(user=self.request.user)

    def create(self, request):
        inst_id = request.data.get("instanceId")
        if inst_id:
            instance = WidgetInstance.objects.get(pk=inst_id)
            if instance is None:
                return MsgBuilder.not_found().as_json_response()
            if not instance.playable_by_current_user:
                return MsgBuilder.failure("Not Allowed", "Instance not playable by current user.").as_json_response()
            if instance.is_draft:
                return (MsgBuilder.failure("Drafts not Playable", "Must use Preview mode to play a draft")
                        .as_json_response())
            
            session_play = SessionPlay()
            # TODO context id?
            play_id = session_play.start(instance, self.request.user.id)
            return JsonResponse({"playId": play_id})

        else:
            return MsgBuilder.invalid_input("Invalid input", "Instance ID required.").as_json_response()
        
    def update(self, request):
        play_id = request.data.get("playId", None)
        logs = request.data.get("logs", None)
        preview_id = request.data.get("previewInstanceId", None)

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
    
    @action(detail=True, methods=["get"])
    def verify(self, request, pk=None):
        session = LogPlay.objects.get(id=pk)

        if session.is_valid:
            return Response({"status": status.HTTP_200_OK, "valid": True})
        else:
            return Response({"status": status.HTTP_401_UNAUTHORIZED, "valid": False})