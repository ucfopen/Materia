import logging
from importlib import import_module

from core.message_exception import MsgFailure
from django.conf import settings
from generation.core import GenerationDriver

logger = logging.getLogger(__name__)


class GenerationDriverFactory:

    _drivers = {
        "bedrock": "generation.bedrock.BedrockGenerationDriver",
    }

    _cached_driver = None
    _cached_provider = None

    @classmethod
    def get_driver(cls) -> GenerationDriver:

        provider = settings.AI_GENERATION.get("PROVIDER")

        if cls._cached_driver is not None and cls._cached_provider == provider:
            return cls._cached_driver

        if not provider:
            logger.error("AI_GENERATION PROVIDER not configured")
            raise MsgFailure(msg="AI generation provider not configured")

        # Normalize provider name (case-insensitive)
        provider_key = provider.lower()

        # Validate provider is supported
        if provider_key not in cls._drivers:
            logger.error(f"Unknown AI generation provider: {provider}")
            raise MsgFailure(msg=f"Unknown AI generation provider: {provider}")

        try:
            driver_path = cls._drivers[provider_key]
            module_path, class_name = driver_path.rsplit(".", 1)
            module = import_module(module_path)
            driver_class = getattr(module, class_name)

            cls._cached_driver = driver_class
            cls._cached_provider = provider

            return driver_class

        except (ImportError, AttributeError) as e:
            logger.error(
                f"Failed to load generation driver for {provider}: {e}", exc_info=True
            )
            raise MsgFailure(msg="Failed to initialize AI generation driver")

    @classmethod
    def clear_cache(cls):
        """Clear the cached driver instance. Useful for testing or config changes."""
        cls._cached_driver = None
        cls._cached_provider = None
