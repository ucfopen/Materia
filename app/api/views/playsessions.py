# import json
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden, HttpResponse

from rest_framework import permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from core.serializers import PlaySessionSerializer, PlayLogUpdateSerializer, PlaySessionWithExtrasSerializer, PlayLogUpdateSerializer
from core.permissions import HasWidgetInstanceEditAccess
from core.models import WidgetInstance, Log, LogPlay
from util.message_util import MsgUtil

from util.logging.session_play import SessionPlay
from util.widget.validator import ValidatorUtil

# debug logging
import logging
from pprint import pformat
logger = logging.getLogger("django")

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
        
    def update(self, request, pk=None):
        if not pk:
            return MsgUtil.create_invalid_input_msg()
        
        # play = LogPlay.objects.get(pk=self.kwargs["pk"])
        # logs = request.data.get("logs", None)
        is_preview = bool(request.query_params.get("is_preview", False))
        update_serializer = PlayLogUpdateSerializer(data=request.data, context={"request": request, "play_id": pk}, many=True)

        if update_serializer.is_valid():

            try:
                session = SessionPlay(pk)
                logs = update_serializer.validated_data

                logger.error(f"raw logs from serializer:\n{pformat(logs)}")

                # using many=True in serializer returns a double-nested list. Manually flatten if required.
                if isinstance(logs, list) and logs[0] and isinstance(logs[0], list):
                     logs = logs[0]

                for log in logs:
                    logModel = Log(
                        play_id=pk,
                        log_type=log["type"],
                        item_id=log["item_id"],
                        text=log["text"],
                        value=log["value"],
                        game_time=log["game_time"],
                    )

                    if not is_preview:
                        logModel.save()
                    # TODO put preview logs in session

                session.update_elapsed()
                return Response({"status": status.HTTP_200_OK, "success": True})

            except Exception as e:
                return MsgUtil.create_failure_msg("Failed to Save", "Your play logs could not be saved.")

        else:
            return Response(update_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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