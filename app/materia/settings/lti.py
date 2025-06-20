import os

LTI_USERDATA = {
    "claim": os.environ.get("LTI_PAYLOAD_USER_CLAIM"),
    "identifier": os.environ.get("LTI_PAYLOAD_USER_IDENTIFIER"),
    "create_users": True,
}

CANVAS_OAUTH_CLIENT_ID = os.environ.get("CANVAS_OAUTH_CLIENT_ID")
CANVAS_OAUTH_CLIENT_SECRET = os.environ.get("CANVAS_OAUTH_CLIENT_SECRET")
CANVAS_OAUTH_CANVAS_DOMAIN = os.environ.get("CANVAS_DOMAIN")
