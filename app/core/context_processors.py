import logging

from core.models import UserSettings
from django.conf import settings

logger = logging.getLogger(__name__)


def fonts(request):
    return {"fonts": settings.FONTS_DEFAULT}


def theme(request):
    if not request.user.is_authenticated:
        return {"theme": "light"}

    user_profile, _ = UserSettings.objects.get_or_create(user=request.user)
    profile_fields = user_profile.get_profile_fields()
    theme_value = profile_fields.get("theme", "light")
    return {"theme": theme_value}

    # TODO: below is the version that used caching. It did not appear to reliably return the most recently set value.

    # cache_key = f'user_dark_mode_{request.user.id}'
    # cached_value = cache.get(cache_key)

    # logger.error("hi")

    # if cached_value is not None:
    #     logger.error("cached value is NOT None")
    #     logger.error(f"cached value for user {request.user.id} is {cached_value}")
    #     return {"darkMode": cached_value}
    # else:
    #     logger.error("cached value IS None")

    # try:
    #     user_profile, _ = UserSettings.objects.get_or_create(user=request.user)
    #     profile_fields = user_profile.get_profile_fields()
    #     dark_mode = bool(profile_fields.get("darkMode", False))
    #     cache.set(cache_key, dark_mode, settings.USER_SETTINGS_CACHE_TIMEOUT)
    #     logger.error(f'setting dark mode cache to {dark_mode} for user {request.user.id}')
    #     return {"darkMode": dark_mode}
    # except Exception as e:
    #     logging.error(f"Error fetching user settings: {e}")
    #     return {"darkMode": False}
