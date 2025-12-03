import os

LTI_USERDATA = {
    "claim": os.environ.get("LTI_PAYLOAD_USER_CLAIM"),
    "identifier": os.environ.get("LTI_PAYLOAD_USER_IDENTIFIER"),
    "create_users": True,
    "update_roles": True,
    "ags_claim": os.environ.get(
        "LTI_PAYLOAD_AGS_USER_CLAIM", os.environ.get("LTI_PAYLOAD_USER_CLAIM")
    ),
    "ags_identifier": os.environ.get(
        "LTI_PAYLOAD_AGS_USER_IDENTIFIER", os.environ.get("LTI_PAYLOAD_USER_CLAIM")
    ),
}

LTI_COURSE_ROLES = {
    "staff": [
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor",
        "http://purl.imsglobal.org/vocab/lis/v2/membership/Instructor#TeachingAssistant",
        "http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper",
    ],
    "student": [
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner",
    ],
}

LTI_INSTITUTION_ROLES = {
    "staff": [
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator",
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor",
    ],
    "student": [
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student",
    ],
}

# Register LTI associations?
LTI_SAVE_ASSOCIATIONS = True

LTI_URL_CONFIGS = {
    "tool_url": os.environ.get("BASE_URL", "").rstrip("/"),
}
