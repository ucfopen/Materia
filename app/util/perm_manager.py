import logging

logger = logging.getLogger("django")


class PermManager:
    def user_is_student(user):
        return user.groups.filter(name="Student").exists()

