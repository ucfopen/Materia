import hashlib

from django.conf import settings
from django.contrib.auth.models import User


class UserService:

    @staticmethod
    def get_avatar_url(user: User) -> str:
        profile_settings = user.profile_settings
        use_gravatar = profile_settings.get_profile_fields().get("useGravatar", False)
        if not use_gravatar:
            return f"{settings.STATIC_URL}img/default-avatar.jpg"

        clean_email = user.email.strip().lower().encode("utf-8")
        hash_email = hashlib.md5(clean_email).hexdigest()
        return f"https://www.gravatar.com/avatar/{hash_email}?d=retro&s=256"
