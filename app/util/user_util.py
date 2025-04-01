from django.contrib.auth.models import User

from util.message_util import MsgBuilder, Msg
from util.perm_manager import PermManager


class UserUtil:
    # WAS Service_User::verify_session
    # Takes in the current request and a string or list of roles.
    # If no user is logged in, returns a no_login Msg.
    # If a user is logged in, but don't have one of the requested roles, returns a no_perms Msg.
    # Otherwise, returns true.
    @staticmethod
    def verify_session(
            user: User,
            roles: str | list[str] = None,
            no_perm_msg: str = "User does not have required roles"
    ) -> tuple[bool, Msg | None]:
        # Check if a user is logged in
        if not user.is_authenticated:
            return False, MsgBuilder.no_login()

        # If no check for roles is requested, just return true
        if not roles:
            return True, None

        # Check if the user has the roles required
        roles_result = PermManager.does_user_have_roles(user, roles)
        if roles_result:
            return True, None
        else:
            return False, MsgBuilder.no_perm(msg=no_perm_msg)
