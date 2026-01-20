import os

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "materia-local-dev-secret-key")

ALLOWED_HOSTS = [
    os.environ.get("BASE_URL", "")
    .rstrip("/")
    .replace("https://", "")
    .replace("http://", "")
    .split(":")[0]
]

# cookie security
SESSION_COOKIE_SAMESITE = "None"
SESSION_COOKIE_SECURE = True

# CSRF configuration
CSRF_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SECURE = True
CSRF_TRUSTED_ORIGINS = [
    os.environ.get("BASE_URL").rstrip("/"),
]

# CORS configuration
CORS_ALLOWED_ORIGINS = [
    os.environ.get("BASE_URL").rstrip("/"),
]
CORS_URLS_REGEX = r"^/api/.*$"

# COOP configuration
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin-allow-popups"
