import os

# default to database session storage
# this should be Django's default behavior as well
session_driver = os.environ.get("SESSION_DRIVER", "db")

if session_driver == "redis":
    SESSION_ENGINE = "django.contrib.sessions.backends.cache"
    SESSION_COOKIE_NAME = "djangorid"

    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": os.environ.get("REDIS_URL", "redis://redis:6379/0"),
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                # Mimicking memcache behavior.
                # http://niwinz.github.io/django-redis/latest/#_memcached_exceptions_behavior
                "IGNORE_EXCEPTIONS": True,
            },
        }
    }
elif session_driver == "file":
    SESSION_ENGINE = "django.contrib.sessions.backends.file"
    SESSION_COOKIE_NAME = "djangofid"
    SESSION_FILE_PATH = "/tmp"
else:
    # this is the default session storage engine for Django
    # nothing else should be required here
    SESSION_COOKIE_NAME = "djangodid"
