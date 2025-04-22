# Materia URLS config

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

# figure out how to get images working

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
    "BASE_URL": "http://localhost:420/",
    "MEDIA_URL": "http://localhost:420/media/",
    "MEDIA_UPLOAD_URL": "http://localhost:420/media/upload",
    "WIDGET_URL": "http://localhost:420/widget/",
    "STATIC_CROSSDOMAIN": "http://localhost:420/",
}
