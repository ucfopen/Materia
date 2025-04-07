import re

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import CanCreateWidgetInstances
from core.serializers import QsetGenerationRequestSerializer, PromptGenerationRequestSerializer
from util.generator_util import GenerationUtil
from util.message_util import MsgBuilder, Msg


class GenerateQsetView(APIView):
    http_method_names = ["post"]
    permission_classes = [IsAuthenticated & CanCreateWidgetInstances]

    def post(self, request):
        # Check if generation is available
        if not GenerationUtil.is_enabled():
            return MsgBuilder.failure(msg="AI generation is not enabled on this instance of Materia").as_drf_response()

        # Get request data
        request_serializer = QsetGenerationRequestSerializer(data=request.data)
        if not request_serializer.is_valid():
            return Response(request_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        widget_instance = request_serializer.validated_data.get("instance", None)
        widget = request_serializer.validated_data["widget"]
        num_questions = request_serializer.validated_data["num_questions"]
        build_off_existing = request_serializer.validated_data["build_off_existing"]
        topic = request_serializer.validated_data["topic"]

        # Verify widget instance is playable (only if a valid instance id is provided)
        if widget_instance and not widget_instance.playable_by_current_user(request.user):
            return MsgBuilder.no_login().as_drf_response()

        # Verify widget has generation enabled
        if not widget.is_generable:
            return MsgBuilder.invalid_input(msg="Widget engine does not support generation").as_drf_response()

        # Clean the topic of any special characters
        topic = re.sub(r"[^a-zA-Z0-9\s]", "", topic)

        # Limit number of questions
        if num_questions < 1:
            num_questions = 8
        if num_questions > 32:
            num_questions = 32

        # Generate qset
        result = GenerationUtil.generate_qset(
            widget=widget,
            instance=widget_instance,
            topic=topic,
            num_questions=num_questions,
            build_off_existing=build_off_existing,
        )

        # Catch error
        if type(result) is Msg:
            return result.as_drf_response()

        # Return generated qset
        return Response({
            **result,
            "title": topic,
        })


class GenerateFromPromptView(APIView):
    http_method_names = ["post"]
    permission_classes = [IsAuthenticated & CanCreateWidgetInstances]

    @staticmethod
    def post(self, request):
        # Check if generation is available
        if not GenerationUtil.is_enabled():
            return MsgBuilder.failure(msg="AI generation is not enabled on this instance of Materia").as_drf_response()

        # Get request data
        request_serializer = PromptGenerationRequestSerializer(data=request.data)
        if not request_serializer.is_valid():
            return Response(request_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        prompt = request_serializer.validated_data["prompt"]

        # Perform generation
        result = GenerationUtil.generate_from_prompt(prompt)
        if type(result) is Msg:
            return result.as_drf_response()
        else:
            return Response({
                "success": True,
                "response": result,
            })
