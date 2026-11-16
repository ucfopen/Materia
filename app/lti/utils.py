import secrets
import uuid
from typing import Optional

from django.conf import settings
from django.core.cache import cache
from django.http.request import HttpRequest
from pylti1p3.exception import LtiException
from pylti1p3.contrib.django.launch_data_storage.cache import DjangoCacheDataStorage
from pylti1p3.contrib.django.message_launch import DjangoMessageLaunch

from lti_tool.models import LtiLaunch
from lti_tool.utils import DjangoToolConfig


POST_MESSAGE_CACHE_PREFIX = "lti-oidc-post-message"


def _get_post_message_timeout() -> int:
    return getattr(settings, "LTI_OIDC_POST_MESSAGE_TIMEOUT", 300)


def _get_cache_key(value_type: str, value: str) -> str:
    return f"{POST_MESSAGE_CACHE_PREFIX}:{value_type}:{value}"


class CookieFreeDjangoCacheDataStorage(DjangoCacheDataStorage):
    """Store PyLTI launch data without namespacing it with a browser cookie."""

    def get_session_cookie_name(self) -> Optional[str]:
        return None


def store_post_message_initiation(
    state: str,
    nonce: str,
    storage_target: str,
    platform_origin: str,
) -> None:
    """Remember the browser-storage values needed when the LMS posts back."""

    cache.set(
        _get_cache_key("initiation", state),
        {
            "state": state,
            "nonce": nonce,
            "storage_target": storage_target,
            "platform_origin": platform_origin,
        },
        timeout=_get_post_message_timeout(),
    )


def consume_post_message_initiation(state: str, storage_target: str) -> dict:
    """Claim an initiation exactly once before rendering the get_data bridge."""

    initiation = cache.get(_get_cache_key("initiation", state))
    if not initiation:
        raise LtiException("Post-message OIDC initiation expired or was consumed")

    if initiation.get("storage_target") != storage_target:
        raise LtiException("Post-message OIDC storage target does not match")

    cache.delete(_get_cache_key("initiation", state))
    return initiation


def create_post_message_handoff(initiation: dict, id_token: str) -> str:
    """Temporarily retain the LMS response while browser storage is queried."""

    handoff_id = uuid.uuid4().hex
    cache.set(
        _get_cache_key("handoff", handoff_id),
        {
            **initiation,
            "id_token": id_token,
        },
        timeout=_get_post_message_timeout(),
    )
    return handoff_id


def consume_post_message_handoff(handoff_id: str, storage_target: str) -> dict:
    """Retrieve a handoff once and reject expired, mismatched, or replayed IDs."""

    handoff = cache.get(_get_cache_key("handoff", handoff_id))
    if not handoff:
        raise LtiException("Post-message OIDC handoff expired or was consumed")

    if handoff.get("storage_target") != storage_target:
        raise LtiException("Post-message OIDC storage target does not match")

    cache.delete(_get_cache_key("handoff", handoff_id))
    return handoff


def get_launch_from_request(
    request: HttpRequest, launch_id: Optional[str] = None
) -> LtiLaunch:
    """Returns the MateriaMessageLaunch associated with a request.
    Based on the Django LTI implementation, altered to use our override message launch

    Optionally, a launch_id may be specified to retrieve the launch from the cache.
    """
    tool_conf = DjangoToolConfig()
    launch_data_storage = CookieFreeDjangoCacheDataStorage()
    if launch_id is not None:
        message_launch = MateriaMessageLaunch.from_cache(
            launch_id, request, tool_conf, launch_data_storage=launch_data_storage
        )
    else:
        message_launch = MateriaMessageLaunch(
            request, tool_conf, launch_data_storage=launch_data_storage
        )
        message_launch.validate()
    return LtiLaunch(message_launch)


class MateriaMessageLaunch(DjangoMessageLaunch):
    """Validate OIDC state and nonce values returned by platform storage."""

    def validate_state(self) -> "MateriaMessageLaunch":
        state_from_request = self._get_request_param("state")
        state_from_platform = self._get_request_param("platform_state")
        if not state_from_request or not state_from_platform:
            raise LtiException("Missing post-message OIDC state")

        if not secrets.compare_digest(state_from_request, state_from_platform):
            raise LtiException("Post-message OIDC state does not match")

        return self

    def validate_nonce(self) -> "MateriaMessageLaunch":
        nonce_from_token = self._get_jwt_body().get("nonce")
        nonce_from_platform = self._get_request_param("platform_nonce")
        if not isinstance(nonce_from_token, str) or not isinstance(
            nonce_from_platform, str
        ):
            raise LtiException("Missing post-message OIDC nonce")

        if not secrets.compare_digest(nonce_from_token, nonce_from_platform):
            raise LtiException("Post-message OIDC nonce does not match")

        return self
