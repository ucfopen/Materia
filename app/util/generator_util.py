
import json
from datetime import datetime

from django.conf import settings
from openai import OpenAI, AzureOpenAI, NOT_GIVEN, OpenAIError
from openai.types.chat import ChatCompletion

import logging
from core.models import WidgetInstance, Widget
from util.message_util import Msg, MsgBuilder

logger = logging.getLogger(__name__)


class GenerationUtil:
    client = None

    @staticmethod
    def generate_qset(
            widget: Widget,
            topic: str,
            num_questions: int,
            build_off_existing: bool,
            include_images: bool = False,
            instance: WidgetInstance = None,
    ) -> dict | Msg:
        # Check if generation is enabled
        if not GenerationUtil.is_enabled():
            return MsgBuilder.failure(msg="Generation is not enabled")

        # Check if image generation is allowed. Overrides what parameter says.
        if not settings.AI_GENERATION["ALLOW_IMAGES"]:
            include_images = False

        # Get demo for widget
        widget_demo_id = widget.metadata_clean()["demo"]
        widget_demo = WidgetInstance.objects.filter(id=widget_demo_id).first()
        if widget_demo is None:
            return MsgBuilder.not_found()

        # Prepare a few variables
        about = widget.metadata_clean()["about"]
        qset_version = 1

        # Grab custom prompt from the widget engine if it's available
        custom_engine_prompt = widget.meta_data["custom_engine_prompt"] \
            if "custom_engine_prompt" in widget.meta_data else None

        # Start logging time
        start_time = datetime.now()
        time_elapsed_seconds = 0

        ###################
        # Assemble prompt #
        ###################

        # build_off_existing is set. Append questions to an existing qset. The instance must have been previously saved.
        if build_off_existing:
            # Validate instance
            qset = instance.get_latest_qset()
            if instance is None:
                return MsgBuilder.invalid_input(msg="Requires a previously saved instance to build from")
            if not qset.data:
                return MsgBuilder.failure(msg="No existing question set found")
            if qset.version:
                qset_version = qset.version

            qset_encoded = json.dumps(qset.get_data())

            prompt_text = (f"{widget.name} is a 'widget', an interactive piece of educational web content described "
                           f"as:'{about}'. Using the exact same json format of the following question set, without "
                           f"changing any field keys or data types and without changing any of the existing questions, "
                           f"generate {num_questions} more questions and add them to the existing question set. The "
                           f"name of this particular instance of {widget.name} is {instance.name} and the new "
                           f"questions must be based on this topic: '{topic}'. Return only the JSON for the resulting "
                           f"question set.")

            # Generate image descriptions, if requested
            if include_images:
                prompt_text += (" In every asset or assets object in each new question, add a field titled "
                                "'description' that best describes the image within the answer or question's context, "
                                "unless otherwise specified later on in this prompt. Do not generate descriptions "
                                "that would violate OpenAI's image generation safety system and do not use real "
                                "names. IDs must be null.")
            else:
                prompt_text += (" Leave the asset field empty or otherwise equivalent to asset fields in questions "
                                "with no associated asset. IDs must be null.")

            # Insert custom engine prompt, if it exists
            if custom_engine_prompt:
                prompt_text += (f"Lastly, the following instructions apply to the {widget.name} widget specifically, "
                                f"and supersede earlier instructions where applicable: {custom_engine_prompt}")

            # Insert existing qset
            prompt_text += f"\n{qset_encoded}"

        # Building a brand new qset
        else:
            # Validate/process demo
            qset = widget_demo.get_latest_qset()
            if not qset:
                return MsgBuilder.not_found(msg="Unable to locate demo question set for widget engine")
            if qset.version:
                qset_version = qset.version

            qset_encoded = json.dumps(qset.get_data())

            prompt_text = (f"{widget.name} is a 'widget', an interactive piece of educational web content described "
                           f"as: '{about}'. The following is a 'demo' question set for the widget titled "
                           f"'{widget_demo.name}'. Using the same json format as the demo question set, and without "
                           f"changing any field keys or data types, return only the JSON for a question set based on "
                           f"this topic: '{topic}'. Ignore the topic of the demo contents entirely. Replace the "
                           f"relevant field values with generated values. Generate a total {num_questions} of "
                           f"questions. IDs must be NULL.")

            # Generate image descriptions, if requested
            if include_images:
                prompt_text += (" In every asset or assets object in each new question, add a field titled "
                                "'description' that best describes the image within the answer or question's context, "
                                "unless otherwise specified later on in this prompt. Do not generate descriptions "
                                "that would violate OpenAI's image generation safety system and do not use real "
                                "names. IDs must be null.")
            else:
                prompt_text += ("Asset fields associated with media (image, audio, or video) should be left blank. For "
                                "text assets, or if the 'materiaType' of an asset is 'text', create a field titled "
                                "'value' with the text inside the asset object.")

            # Insert custom engine prompt, if it exists
            if custom_engine_prompt:
                prompt_text += (f" Lastly, the following instructions apply to the {widget.name} widget specifically, "
                                f"and supersede earlier instructions where applicable: {custom_engine_prompt}")

            # Insert qset
            prompt_text += f"\n{qset_encoded}"

        # Send the prompt to the generative AI provider
        result = GenerationUtil._query(prompt_text, "json")
        time_elapsed_seconds = datetime.now().timestamp() - start_time.timestamp()

        if type(result) is Msg:
            logger.error(
                f"Error generating question set:"
                f"- Widget: {widget.name}\n"
                f"- Date: {datetime.now()}\n"
                f"- Time to complete (seconds): {time_elapsed_seconds}\n"
                f"- Number of questions asked to generate: {num_questions}\n"
                f"- Error: {result}"
            )
            return result

        # A qset was received - decode it
        content = result.choices[0].message.content
        qset = json.loads(content)
        logger.info(f"Generated question set received: {qset}")

        # Log
        if settings.AI_GENERATION["LOG_STATS"]:
            logger.debug(
                f"Successfully generated question set:"
                f"- Widget: {widget.name}\n"
                f"- Date: {datetime.now()}\n"
                f"- Time to complete (seconds): {time_elapsed_seconds}\n"
                f"- Number of questions asked to generate: {num_questions}\n"
                f"- Included images: {include_images}\n"
                f"- Prompt tokens: {result.usage.prompt_tokens}\n"
                f"- Completion tokens: {result.usage.completion_tokens}\n"
                f"- Total tokens: {result.usage.total_tokens}\n"
            )

        # Generate images, if requested
        # TODO image generation was never used in PHP docker, even though the code for it existed
        #      reasons mainly include it being expensive and unreliable
        #      so, for now at least, it's a low priority for me to port

        # Done!
        return {
            "qset": qset,
            "version": qset_version,
        }

    @staticmethod
    def generate_from_prompt(prompt: str) -> str | Msg:
        # Check if generation is enabled
        if not GenerationUtil.is_enabled():
            return MsgBuilder.failure(msg="Generation is not enabled")

        # Check if prompt length is valid
        if len(prompt) == 0 or len(prompt) > 10000:
            return MsgBuilder.invalid_input(msg="Prompt text length invalid")

        # Do query
        result = GenerationUtil._query(prompt, "text")

        if type(result) is Msg:
            logger.error(f"GENERATION UTIL: Error while generation prompt:\n"
                         f"- Prompt: {prompt}\n"
                         f"- Exception: {result}")
            return result

        return result.choices[0].message.content

    @staticmethod
    def is_enabled() -> bool:
        return bool(settings.AI_GENERATION["ENABLED"])

    @staticmethod
    def _query(prompt: str, response_format: str = "json") -> ChatCompletion | Msg:
        # Get client
        client = GenerationUtil._get_client()
        if client is None:
            return MsgBuilder.failure(msg="Failed to initialize generation client")

        # Process response format
        # TODO support for json_schema i think would be cool
        match response_format:
            case 'json':
                response_format = {"type": "json_object"}
            case 'text':
                response_format = {"type": "text"}
            case _:
                response_format = NOT_GIVEN

        try:
            completion = client.chat.completions.create(
                model=settings.AI_GENERATION["MODEL"],  # TODO specify a default model if not set?
                messages=[{"role": "user", "content": prompt}],
                max_tokens=16000,
                frequency_penalty=0,
                presence_penalty=0,
                temperature=1,
                top_p=1,
                response_format=response_format,
            )
        except OpenAIError as e:
            logger.error("GENERATION ERROR: Client threw an error while attempting completion. Exception follows:")
            logger.error(e)
            return MsgBuilder.failure(msg="Client threw an error while attempting completion")
        except Exception as e:
            logger.error("GENERATION ERROR: Unknown error occurred while attempting completion. Exception follows:")
            logger.error(e)
            return MsgBuilder.failure(msg="Unknown error occurred while attempting completion")

        # Check for refusal
        # TODO the openai docs are pretty unclear abt this... but refusals might be thrown as an exception?
        message = completion.choices[0].message
        if message.refusal:
            logger.error(
                f"GENERATION ERROR: Provider actively refused to run completion. Reason given: '{message.refusal}'"
            )
            return MsgBuilder.failure(msg="Provider actively refused to run completion")

        return completion

    @staticmethod
    def _get_client():
        # Initialize the client if not loaded
        if GenerationUtil.client is None and GenerationUtil.is_enabled():
            GenerationUtil.client = GenerationUtil._initialize_client()
        return GenerationUtil.client

    @staticmethod
    def _initialize_client():
        client = None

        # Check if provider is provided (lol)
        if not settings.AI_GENERATION["PROVIDER"]:
            logger.error("GENERATION ERROR: Question generation provider config missing.")
            return None

        # Set up based on type of provider
        # AZURE OPENAI
        if settings.AI_GENERATION["PROVIDER"] == "azure_openai":
            print(settings.AI_GENERATION)
            api_key = settings.AI_GENERATION["API_KEY"]
            endpoint = settings.AI_GENERATION["ENDPOINT"]
            api_version = settings.AI_GENERATION["API_VERSION"]

            if not api_key or not endpoint or not api_version:
                logger.error("GENERATION ERROR: Azure OpenAI question generation configs missing.")
                return None

            client = AzureOpenAI(
                api_key=api_key,
                api_version=api_version,
                azure_endpoint=endpoint,
            )
            # TODO: original code wraps in a try/catch. thats not really applicable here since we're initing a class,
            #       but we might want to do some kind of check to see if our client is working/valid

        # OPENAI
        elif settings.AI_GENERATION["PROVIDER"] == "openai":
            api_key = settings.AI_GENERATION["API_KEY"]

            if not api_key:
                logger.error("GENERATION ERROR: OpenAI Platform question generation configs missing.")
                return None

            client = OpenAI(api_key=api_key)
            # TODO: same as azure todo

        # NOT A SUPPORTED PROVIDER
        else:
            logger.error("GENERATION ERROR: Question generation provider config invalid.")
            return None

        return client
