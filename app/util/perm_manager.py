from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import User, AbstractUser

import logging
from util.message_util import MsgBuilder

logger = logging.getLogger("django")


class PermManager:
    @staticmethod
    def user_is_student(user):
        return user.groups.filter(name="Student").exists()

    @staticmethod
    def does_user_have_rolls(user: User, rolls: str | list[str]) -> bool:
        # Convert to list if single string passed in
        if type(rolls) is str:
            rolls = [rolls]

        # Empty list of rolls, just return false
        if not rolls:
            return False

        # Check to see if any of the roles are present
        return user.groups.filter(name__in=rolls).exists()
