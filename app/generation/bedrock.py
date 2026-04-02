import json
import logging
import threading

from core.message_exception import MsgFailure
from core.models import Widget, WidgetInstance
from core.services.boto_session_service import BotoSessionService
from django.conf import settings
from generation.core import GenerationCore, GenerationDriver

logger = logging.getLogger(__name__)

_bedrock_cache_lock = threading.Lock()
_bedrock_client_cache = None
_bedrock_resource_cache = None
_bedrock_cache_config = None


class BedrockGenerationDriver(GenerationDriver):

    @staticmethod
    def get_client():
        global _bedrock_client_cache, _bedrock_resource_cache, _bedrock_cache_config, _bedrock_cache_lock
        s = settings.AI_GENERATION

        # TODO what settings should be hashed to the config?
        current_config = s.get("GENERATION_API_MODEL")

        # Thread-safe cache check and initialization
        with _bedrock_cache_lock:
            # If config changed, invalidate cache
            if _bedrock_cache_config != current_config:
                _bedrock_cache_config = current_config

            # Return cached client/resource if available
            if _bedrock_client_cache is not None:
                return _bedrock_client_cache

            try:
                session = BotoSessionService.get_session()
            except Exception:
                logger.error("Boto3: Failed to create session", exc_info=True)
                raise

            _bedrock_client_cache = session.client(
                "bedrock-runtime", region_name="us-east-1"
            )
            return _bedrock_client_cache

    @staticmethod
    def query(prompt: str, response_format: str = "json") -> str:

        # Get Bedrock client
        client = BedrockGenerationDriver.get_client()

        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 4096,
        }

        # Invoke Bedrock model
        response = client.invoke_model(
            modelId=settings.AI_GENERATION["MODEL"], body=json.dumps(request_body)
        )

        response_body = json.loads(response["body"].read())
        generated_text = response_body.get("content", [{}])[0].get("text", "")

        return generated_text

    @staticmethod
    def generate_qset(
        widget: Widget,
        topic: str,
        num_questions: int,
        build_off_existing: bool,
        instance: WidgetInstance = None,
    ) -> dict:

        prompt = GenerationCore.generate_qset_prompt(
            widget, topic, num_questions, build_off_existing, instance
        )

        try:
            result = BedrockGenerationDriver.query(prompt)
            parsed = json.loads(result)

            return parsed

        except Exception:
            logger.error(
                "Failed to generate qset from prompt with error", exc_info=True
            )

            raise MsgFailure()

    @staticmethod
    def generate_from_prompt(prompt: str) -> str:
        try:
            result = BedrockGenerationDriver.query(prompt)
        except Exception as e:
            logger.error("Generation failure for prompt %s", prompt, exc_info=True)
            raise e

        return result
