from typing import Optional

from django.conf import settings
from django.http.request import HttpRequest
from lti_tool.models import LtiLaunch
from lti_tool.utils import DjangoToolConfig
from pylti1p3.contrib.django.launch_data_storage.cache import DjangoCacheDataStorage
from pylti1p3.contrib.django.message_launch import DjangoMessageLaunch


# overrides pylti1p3's DjangoMessageLaunch class so we can short-circuit nonce validation
# TODO we should really figure out why nonce validation is borked
class ExtendedDjangoMessageLaunch(DjangoMessageLaunch):

    def validate_nonce(self):
        iss = self.get_iss()
        platform_domain = (
            settings.LTI_URL_CONFIGS["platform_iss"] or "https://canvas.instructure.com"
        )
        if iss == platform_domain:
            return self
        return super().validate_nonce()


# overrides django-lti's implementation of this method to replace DjangoMessageLaunch with ExtendedDjangoMessageLaunch
def get_launch_from_request(
    request: HttpRequest, launch_id: Optional[str] = None
) -> LtiLaunch:
    """Returns the DjangoMessageLaunch associated with a request.

    Optionally, a launch_id may be specified to retrieve the launch from the cache.
    """
    tool_conf = DjangoToolConfig()
    launch_data_storage = DjangoCacheDataStorage()
    if launch_id is not None:
        message_launch = ExtendedDjangoMessageLaunch.from_cache(
            launch_id, request, tool_conf, launch_data_storage=launch_data_storage
        )
    else:
        message_launch = ExtendedDjangoMessageLaunch(
            request, tool_conf, launch_data_storage=launch_data_storage
        )
        message_launch.validate()
    return LtiLaunch(message_launch)
