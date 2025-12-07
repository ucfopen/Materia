import base64
import json
import logging

logger = logging.getLogger(__name__)


class Base64Util:
    """
    Simple utils for encoding JSON/dicts to base64 strings and back
    """

    @staticmethod
    def encode(data: dict) -> str:
        json_str = json.dumps(data)
        return base64.b64encode(json_str.encode("utf-8")).decode("utf-8")

    @staticmethod
    def decode(data: str) -> dict:
        try:
            decoded_bytes = base64.b64decode(data)
            return json.loads(decoded_bytes.decode("utf-8"))
        except Exception as e:
            logger.error(f"Error decoding JSON: {str(e)}")
            return {}
