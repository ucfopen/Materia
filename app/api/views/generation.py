import logging
import re

from api.permissions import CanCreateWidgetInstances
from api.serializers import (
    PromptGenerationRequestSerializer,
    QsetGenerationRequestSerializer,
)
from core.message_exception import MsgFailure, MsgInvalidInput, MsgNoLogin
from generation.core import GenerationCore
from generation.factory import GenerationDriverFactory
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class GenerateQsetView(APIView):
    http_method_names = ["post"]
    permission_classes = [CanCreateWidgetInstances]

    def post(self, request):
        # Check if generation is available
        if not GenerationCore.is_enabled():
            raise MsgFailure(
                msg="AI generation is not enabled on this instance of Materia"
            )

        # Get request data
        request_serializer = QsetGenerationRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        widget_instance = request_serializer.validated_data.get("instance", None)
        widget = request_serializer.validated_data["widget"]
        num_questions = request_serializer.validated_data["num_questions"]
        build_off_existing = request_serializer.validated_data["build_off_existing"]
        topic = request_serializer.validated_data["topic"]

        # Verify widget instance is playable (only if a valid instance id is provided)
        if widget_instance and not widget_instance.playable_by_current_user(
            request.user
        ):
            raise MsgNoLogin(request=request)

        # Verify widget has generation enabled
        if not widget.is_generable:
            raise MsgInvalidInput(msg="Widget engine does not support generation")

        # Clean the topic of any special characters
        topic = re.sub(r"[^a-zA-Z0-9\s]", "", topic)

        # Limit number of questions
        if num_questions < 1:
            num_questions = 8
        if num_questions > 32:
            num_questions = 32

        # Get the appropriate driver and generate qset
        driver = GenerationDriverFactory.get_driver()
        result = driver.generate_qset(
            widget=widget,
            topic=topic,
            num_questions=num_questions,
            build_off_existing=build_off_existing,
            instance=widget_instance,
        )

        # Return generated qset
        return Response(
            {
                "qset": result,
                "title": topic,
            }
        )


class GenerateFromPromptView(APIView):
    http_method_names = ["post"]
    permission_classes = [CanCreateWidgetInstances]

    def post(self, request):
        # Check if generation is available
        if not GenerationCore.is_enabled():
            raise MsgFailure(
                msg="AI generation is not enabled on this instance of Materia"
            )

        # Get request data
        request_serializer = PromptGenerationRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        prompt = request_serializer.validated_data["prompt"]

        # Get the appropriate driver and perform generation
        driver = GenerationDriverFactory.get_driver()
        result = driver.query(prompt)

        return Response(
            {
                "success": True,
                "response": result,
            }
        )
