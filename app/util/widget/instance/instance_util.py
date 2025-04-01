import logging

from django.conf import settings
from django.contrib.auth.models import User
from django.core.cache import cache

from core.models import WidgetInstance

logger = logging.getLogger("django")


class WidgetInstanceUtil:
    # Obtains a lock on a widget instance that will last for 2 minutes.
    # Returns True if that lock is obtained by the user (or if they already have a lock on it)
    # Returns False if another lock is already owned by someone else
    # Can pass in either a WidgetInstance object or the id of that instance
    @staticmethod
    def get_lock(instance: WidgetInstance | str, user: User) -> bool:
        # Get instance id depending on what was passed in
        if type(instance) is WidgetInstance:
            instance_id = instance.id
        else:
            instance_id = instance

        # Get current lock, if any
        locked_by = cache.get(instance_id)

        # Not currently locked by anyone else, obtain a lock
        if locked_by is None:
            locked_by = user.pk
            cache.set(instance_id, locked_by, settings.LOCK_TIMEOUT)

        # Return True if requesting user owns the lock. False otherwise.
        return locked_by == user.pk

    # Checks if the user has a lock on this instance (if there is one)
    # Returns True if the user owns the lock, or if there is no lock on this instance
    # Returns False if there is a lock and the user doesn't own it
    # Can pass in either a WidgetInstance object or the id of that instance
    @staticmethod
    def user_has_lock_or_is_unlocked(instance: WidgetInstance | str, user: User) -> bool:
        # Get instance id depending on what was passed in
        if type(instance) is WidgetInstance:
            instance_id = instance.id
        else:
            instance_id = instance

        # Get current lock. Return True if no lock exists for this instance.
        locked_by = cache.get(instance_id)
        if locked_by is None:
            return True

        # Return True if requesting user owns the lock. False otherwise.
        return locked_by == user.pk
