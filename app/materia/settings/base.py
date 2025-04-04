# BASE config file for Materia

import os
from pathlib import Path

from .css import *  # noqa: F401, F403
from .js import *  # noqa: F401, F403
from .urls import *  # noqa: F401, F403

# import additional config files
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

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "materia-local-dev-secret-key"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["*", "localhost", "127.0.0.1"]


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    # apps
    "core",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "EXCEPTION_HANDLER": "rest_framework.views.exception_handler",
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


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.environ.get("MYSQL_DATABASE"),
        "USER": os.environ.get("MYSQL_USER"),
        "PASSWORD": os.environ.get("MYSQL_PASSWORD"),
        "HOST": os.environ.get("MYSQL_HOST"),
        "PORT": os.environ.get("MYSQL_PORT"),
    },
}

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

# amount of kilobytes alloted to any individual user for media storage
MEDIA_QUOTA = 5000

# defines the desired media driver
MEDIA_DRIVER = (os.environ.get("ASSET_STORAGE_DRIVER", "file"),)

# defines class names based on the desired media driver
# is there a smarter/safer way of doing this?
DRIVER_SETTINGS = {
    "file": {"class": "FileAssetStorageDriver"},
    "db": {"class": "DBAssetStorageDriver"},
    "s3": (
        None
        if MEDIA_DRIVER != "s3"
        else {
            "class": "S3AssetStorageDriver",
            # env or imds. Should be set to env for fakes3
            "credential_provider": os.environ.get(
                "ASSET_STORAGE_S3_CREDENTIAL_PROVIDER", "env"
            ),
            # set to url for testing endpoint
            "endpoint": os.environ.get(
                "ASSET_STORAGE_S3_ENDPOINT", "http://fakes3:10001"
            ),
            # aws region for bucket
            "region": os.environ.get("ASSET_STORAGE_S3_REGION", "us-east-1"),
            # bucket to store original user uploads
            "bucket": os.environ.get("ASSET_STORAGE_S3_BUCKET", "fake_bucket"),
            # OPTIONAL - directory to store original and resized assets
            "subdir": os.environ.get("ASSET_STORAGE_S3_BASEPATH", "media"),
            # aws api secret key
            "secret_key": os.environ.get(
                "AWS_SECRET_ACCESS_KEY",
                os.environ.get("ASSET_STORAGE_S3_SECRET", "SECRET"),
            ),
            # aws api key
            "key": os.environ.get(
                "AWS_ACCESS_KEY_ID", os.environ.get("ASSET_STORAGE_S3_KEY", "KEY")
            ),
            "token": os.environ.get("AWS_SESSION_TOKEN", "TOKEN"),  # aws session token
            # using fakes3 unless explicitly disabled
            "fakes3_enabled": os.environ.get("DEV_ONLY_FAKES3_DISABLED", True),
            # base S3 URL for viewing objects in-browser
            "view_url": os.environ.get(
                "ASSET_STORAGE_S3_BASEURL", "http://localhost:10001/fake_bucket/media/"
            ),
        }
    ),
}
