import hashlib

from django.contrib.auth.models import User


class UserService:

    @staticmethod
    def get_avatar_url(user: User) -> str:
        clean_email = user.email.strip().lower().encode("utf-8")
        hash_email = hashlib.md5(clean_email).hexdigest()
        return f"https://www.gravatar.com/avatar/{hash_email}?d=retro&s=256"
