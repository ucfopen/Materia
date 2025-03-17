# import json
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden, HttpResponse

from rest_framework import permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from core.serializers import PlaySessionSerializer, PlaySessionWithExtrasSerializer
from core.permissions import HasWidgetInstanceEditAccess
from core.models import WidgetInstance, LogPlay
from util.message_util import MsgUtil

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
            return LogPlay.objects.get(pk=self.kwargs["pk"])
        else:
            if self.request.query_params.get("include_activity"):
                return LogPlay.objects.select_related("instance","instance__widget").filter(user=self.request.user)
            else:
                return LogPlay.objects.filter(user=self.request.user)

    def create(self, request):
        inst_id = request.data.get("instanceId")
        if inst_id:
            instance = WidgetInstance.objects.get(pk=inst_id)
            if instance is None:
                return MsgUtil.create_not_found()
            if not instance.playable_by_current_user:
                return MsgUtil.create_failure_msg("Not Allowed","Instance not playable by current user.")
            if instance.is_draft:
                return MsgUtil.create_failure_msg("Drafts not Playable","Must use Preview mode to play a draft")
            
            session_play = SessionPlay()
            # TODO context id?
            play_id = session_play.start(instance, self.request.user.id)
            return JsonResponse({ "playId": play_id })

        else:
            return MsgUtil.create_invalid_input_msg("Invalid input","Instance ID required.")
        
    def update(self, request):
        if not "pk" in self.kwargs:
            return MsgUtil.create_invalid_input_msg()
        
        play = LogPlay.objects.get(pk=self.kwargs["pk"])
        logs = request.data.get("logs", None)
        is_preview = request.query_params("is_preview", None)
            
        # play_id = request.data.get("playId", None)
        # logs = request.data.get("logs", None)
        # preview_inst_id = request.data.get("previewInstanceId", None)
        # preview_play_id = request.data.get("previewPlayId", None)

        # if not play_id or (not preview_inst_id and not ValidatorUtil.is_valid_long_hash(play_id)):
        #     return HttpResponseBadRequest()
        
        # if not logs or not isinstance(logs, list):
        #     return HttpResponseBadRequest()
        
        # if preview_inst_id:
        #     if ValidatorUtil.is_valid_hash(preview_inst_id):
        #         # TODO: Score_Manager::save_preview_logs($preview_inst_id, $logs);
        #         pass
        
        # else:
        #     # PLAY FOR KEEPS
        #     session_play = SessionPlay.get_or_none(play_id)
        #     if not session_play:
        #         return HttpResponseNotFound()
            
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