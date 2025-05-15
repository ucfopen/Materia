# Materia URLS config

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

# figure out how to get images working

import os

STATIC_URL = "/static/"
STATIC_ROOT = "./staticfiles/"

LOGIN_URL = "/login/"

LOGIN_LINKS = [
    {"href": "/lookup-username", "title": "Lookup Username"},
    {"href": "/password-reset", "title": "Reset Password"},
]

# STATIC_URL = "/"
# STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
# STATICFILES_DIRS = [
#     os.path.join(BASE_DIR, "public"),
# ]

URLS = {
    "BASE_URL": os.environ.get(
        "BASE_URL",
        "http://localhost/",
    ),
    "MEDIA_URL": os.environ.get(
        "MEDIA_URL",
        "http://localhost/media/",
    ),
    "MEDIA_UPLOAD_URL": os.environ.get(
        "MEDIA_UPLOAD_URL",
        "http://localhost/media/upload",
    ),
    "WIDGET_URL": os.environ.get(
        "WIDGET_URL",
        "http://localhost/widget/",
    ),
    "STATIC_CROSSDOMAIN": os.environ.get(
        "STATIC_CROSSDOMAIN",
        "http://localhost/",
    ),
}
