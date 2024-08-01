import logging

logger = logging.getLogger("django")


class PermManager:
    # TODO: implement this
    def user_is_student(user):
        return False

    # static public function is_student($user_id)
    # {
    #     return ! self::does_user_have_role([\Materia\Perm_Role::AUTHOR, \Materia\Perm_Role::SU], $user_id);
    # }
