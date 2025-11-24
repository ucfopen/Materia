# BASE config file for Materia

import os
from pathlib import Path

from core.utils.validator_util import ValidatorUtil

from .apps import *  # noqa: F401, F403
from .css import *  # noqa: F401, F403
from .db import *  # noqa: F401, F403

# empty by default - override with environment/implementation-specific settings
from .extra import *  # noqa: F401, F403
from .generation import *  # noqa: F401, F403
from .js import *  # noqa: F401, F403
from .lti import *  # noqa: F401, F403

# import additional config files
from .session import *  # noqa: F401, F403
from .storage import *  # noqa: F401, F403
from .urls import *  # noqa: F401, F403
from .widgets import *  # noqa: F401, F403

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
APP_PATH = (
    Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))).resolve().parent
)

DIRS = {
    "media": os.path.realpath(os.path.join(APP_PATH, "media")),  # + os.sep,
    "media_uploads": os.path.realpath(
        os.path.join(APP_PATH, "media", "uploads")
    ),  # + os.sep,
    "widgets": os.path.realpath(
        os.path.join(APP_PATH, "staticfiles", "widget")
    ),  # + os.sep
}

SESSION_COOKIE_SAMESITE = "None"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SECURE = True

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "materia-local-dev-secret-key"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get("DJANGO_ENV", "prod") == "dev"

ALLOWED_HOSTS = ["*", "localhost", "127.0.0.1"]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "EXCEPTION_HANDLER": "core.exception_handlers.materia_exception_handler",
}

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    # "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "lti_tool.middleware.LtiLaunchMiddleware",
]

ROOT_URLCONF = "materia.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "core.context_processors.dark_mode",
                "core.context_processors.fonts",
            ],
        },
    },
]

WSGI_APPLICATION = "materia.wsgi.application"

# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "US/Eastern"

USE_I18N = True

USE_TZ = True

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "filename": "./logfile.log",
        },
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
        },
    },
    "loggers": {
        "django": {"handlers": ["file", "console"], "level": "INFO", "propagate": True},
        "django.db": {
            "handlers": ["file", "console"],
            "level": "ERROR",  # change to DEBUG to see all queries
        },
    },
}

SEMESTERS = [
    {
        "spring": {"month": 1, "day": 1},
        "summer": {"month": 5, "day": 3},
        "fall": {"month": 8, "day": 7},
    }
]

USER_SETTINGS_CACHE_TIMEOUT = 3600
PLAYDATA_EXPORTER_CACHE_TIMEOUT = 120
LOCK_TIMEOUT = 120

LOGIN_URL = "/login/"

NAME = "Materia"

# Email config
SEND_EMAILS = ValidatorUtil.validate_bool(os.environ.get("SEND_EMAILS", False))
EMAIL_BACKEND = os.environ.get("EMAIL_BACKEND")
SYSTEM_EMAIL = os.environ.get("SYSTEM_EMAIL")

# SMTP config
EMAIL_HOST = os.environ.get("EMAIL_HOST")
EMAIL_PORT = os.environ.get("EMAIL_PORT")
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS")
EMAIL_USE_SSL = os.environ.get("EMAIL_USE_SSL")
EMAIL_TIMEOUT = int(os.environ.get("EMAIL_TIMEOUT", 0))
EMAIL_SSL_KEYFILE = os.environ.get("EMAIL_SSL_KEYFILE")
EMAIL_SSL_CERTFILE = os.environ.get("EMAIL_SSL_CERTFILE")

# Sendgrid config
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
SENDGRID_SANDBOX_MODE_IN_DEBUG = False
