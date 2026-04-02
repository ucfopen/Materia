import json
from abc import ABC, abstractmethod

from core.message_exception import MsgFailure, MsgInvalidInput, MsgNotFound
from core.models import Widget, WidgetInstance
from django.conf import settings


class GenerationCore:

    @staticmethod
    def is_enabled() -> bool:
        return bool(settings.AI_GENERATION["ENABLED"])

    @staticmethod
    def generate_qset_prompt(
        widget: Widget,
        topic: str,
        num_questions: int,
        build_off_existing: bool,
        instance: WidgetInstance = None,
    ) -> str:

        if not GenerationCore.is_enabled():
            raise MsgFailure(msg="Generation is not enabled")

        # Get demo for widget
        widget_demo_id = widget.metadata.get("demo")
        widget_demo = WidgetInstance.objects.filter(id=widget_demo_id).first()
        if widget_demo is None:
            raise MsgNotFound()

        # Prepare a few variables
        about = widget.metadata.get("about")
        # qset_version = 1

        # Grab custom prompt from the widget engine if it's available
        custom_engine_prompt = (
            widget.metadata["custom_engine_prompt"]
            if "custom_engine_prompt" in widget.metadata
            else None
        )

        # # Start logging time
        # start_time = datetime.now()
        # time_elapsed_seconds = 0

        if build_off_existing:
            if instance is None:
                raise MsgInvalidInput(
                    msg="Requires a previously saved instance to build from"
                )
            qset = instance.get_latest_qset()
            if not qset.data:
                raise MsgFailure(msg="No existing question set found")
            # if qset.version:
            #     qset_version = qset.version

            qset_encoded = json.dumps(qset.get_data())

            prompt_text = (
                f"{widget.name} is a 'widget', an interactive piece of educational web content described "
                f"as:'{about}'. Using the exact same json format of the following question set, without "
                f"changing any field keys or data types and without changing any of the existing questions, "
                f"generate {num_questions} more questions and add them to the existing question set. The "
                f"name of this particular instance of {widget.name} is {instance.name} and the new "
                f"questions must be based on this topic: '{topic}'. Return only the JSON for the resulting "
                f"question set."
                " Leave the asset field empty or otherwise equivalent to asset fields in questions "
                "with no associated asset. IDs must be null."
            )

        else:
            # Validate/process demo
            qset = widget_demo.get_latest_qset()
            if not qset:
                raise MsgNotFound(
                    msg="Unable to locate demo question set for widget engine"
                )
            # if qset.version:
            #     qset_version = qset.version

            qset_encoded = json.dumps(qset.get_data())

            prompt_text = (
                f"{widget.name} is a 'widget', an interactive piece of educational web content described "
                f"as: '{about}'. The following is a 'demo' question set for the widget titled "
                f"'{widget_demo.name}'. Using the same json format as the demo question set, and without "
                f"changing any field keys or data types, return only the JSON for a question set based on "
                f"this topic: '{topic}'. Ignore the topic of the demo contents entirely. Replace the "
                f"relevant field values with generated values. Generate a total {num_questions} of "
                f"questions. IDs must be NULL."
                "Asset fields associated with media (image, audio, or video) should be left blank. For "
                "text assets, or if the 'materiaType' of an asset is 'text', create a field titled "
                "'value' with the text inside the asset object."
                "Please return ONLY the json object without any formatting or qualifying characters such as "
                "backticks. The json object is ideally interpretable by python's json library without any "
                "kind of string sanitization."
            )

        # Insert custom engine prompt, if it exists
        if custom_engine_prompt:
            prompt_text += (
                f" Lastly, the following instructions apply to the {widget.name} widget specifically, "
                f"and supersede earlier instructions where applicable: {custom_engine_prompt}"
            )

        # Insert qset
        prompt_text += f"\n{qset_encoded}"

        return prompt_text


class GenerationDriver(ABC):
    """Abstract base class defining the interface all generation drivers must implement"""

    @staticmethod
    @abstractmethod
    def get_client():
        """
        Get or create the provider-specific client.
        Returns: Provider client instance
        """
        pass

    @staticmethod
    @abstractmethod
    def query(prompt: str, response_format: str = "json") -> str:
        """
        Perform the query for a given prompt.
        Returns: the result text from the model.
        """
        pass

    @staticmethod
    @abstractmethod
    def generate_qset(
        widget: Widget,
        topic: str,
        num_questions: int,
        build_off_existing: bool,
        instance: WidgetInstance = None,
    ) -> dict:
        """
        Generate a question set using the provider's API.

        Args:
            widget: The widget to generate questions for
            topic: The topic to generate questions about
            num_questions: Number of questions to generate
            build_off_existing: Whether to add to existing questions
            instance: Existing widget instance (required if build_off_existing=True)

        Returns:
            dict: Generated question set data
        """
        pass
