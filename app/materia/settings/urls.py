
# Materia URLS config

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

MEDIA_URL = "/media/"

# figure out how to get images working

STATIC_URL = "/static/"
STATIC_ROOT = "./staticfiles/"

# STATIC_URL = "/"
# STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
# STATICFILES_DIRS = [
#     os.path.join(BASE_DIR, "public"),
# ]

URLS = {
    "BASE_URL": "http://localhost:420/",
    "WIDGET_URL": "http://localhost:420/widget/",
    "STATIC_CROSSDOMAIN": "http://localhost:420/",
}
