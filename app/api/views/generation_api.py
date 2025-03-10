import json
import re

from django.http import JsonResponse

from core.models import WidgetInstance, Widget
from util.generator_util import GenerationUtil
from util.message_util import MsgBuilder, Msg
from util.widget.validator import ValidatorUtil


class GenerationApi:
    @staticmethod
    def generate_qset(request):
        json_body = json.loads(request.body)
        instance_id = json_body.get("instId")
        widget_id = json_body.get("widgetId")
        topic = json_body.get("topic")
        num_questions = int(json_body.get("numQuestions"))
        build_off_existing = json_body.get("buildOffExisting")

        # Check if generation is available
        if not GenerationUtil.is_enabled():
            return MsgBuilder.failure(msg="AI generation is not enabled on this instance of Materia").as_json_response()

        # Verify eligibility
        # TODO if (! \Service_User::verify_session(['basic_author', 'super_user'])) return Msg::no_perm();

        # Load and verify widget instance (only if a valid instance id is provided)
        widget_instance = None
        if ValidatorUtil.is_valid_hash(instance_id):
            widget_instance = WidgetInstance.objects.filter(id=instance_id).first()
            if widget_instance is None:
                return MsgBuilder.not_found(msg="Widget instance not found").as_json_response()
            if not widget_instance.playable_by_current_user():
                return MsgBuilder.no_login().as_json_response()

        # Load and verify widget
        widget = Widget.objects.filter(id=widget_id).first()
        if widget is None:
            return MsgBuilder.not_found(msg="Widget not found").as_json_response()
        if not widget.is_generable:
            return MsgBuilder.invalid_input(msg="Widget engine does not support generation").as_json_response()

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
            return result.as_json_response()

        # Return generated qset
        return JsonResponse({
            **result,
            "title": topic,
        })

    @staticmethod
    def generate_from_prompt(request):
        json_body = json.loads(request.body)
        prompt = json_body.get("prompt")

        # Validate prompt
        if not prompt:
            return MsgBuilder.invalid_input(msg="Missing prompt").as_json_response()

        # Check if generation is available
        if not GenerationUtil.is_enabled():
            return MsgBuilder.failure(msg="AI generation is not enabled on this instance of Materia").as_json_response()

        # Verify eligibility
        # TODO if (\Service_User::verify_session() !== true) return Msg::no_login();

        result = GenerationUtil.generate_from_prompt(prompt)
        if type(result) is Msg:
            return result.as_json_response()
        else:
            return JsonResponse({
                "success": True,
                "response": result,
            })




