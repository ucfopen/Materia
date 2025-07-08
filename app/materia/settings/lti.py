import os

LTI_USERDATA = {
    "claim": os.environ.get("LTI_PAYLOAD_USER_CLAIM"),
    "identifier": os.environ.get("LTI_PAYLOAD_USER_IDENTIFIER"),
    "create_users": True,
    "update_roles": True,
}

LTI_ROLES = {
    "staff": [
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator",
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor",
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor",
        "http://purl.imsglobal.org/vocab/lis/v2/membership/Instructor#TeachingAssistant",
        "http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper",
    ],
    "student": [
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student",
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner",
    ],
}

# Register LTI associations?
LTI_SAVE_ASSOCIATIONS = True

LTI_URL_CONFIGS = {
    "tool_url": os.environ.get("BASE_URL", "").rstrip("/"),
    "platform_iss": os.environ.get("PLATFORM_ISS"),
}

CANVAS_OAUTH_CLIENT_ID = os.environ.get("CANVAS_OAUTH_CLIENT_ID")
CANVAS_OAUTH_CLIENT_SECRET = os.environ.get("CANVAS_OAUTH_CLIENT_SECRET")
CANVAS_OAUTH_CANVAS_DOMAIN = os.environ.get("CANVAS_DOMAIN")
