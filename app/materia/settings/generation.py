import os

from util.widget.validator import ValidatorUtil

AI_GENERATION = {
    "ENABLED": ValidatorUtil.validate_bool(os.environ.get("GENERATION_ENABLED"), False),
    "ALLOW_IMAGES": ValidatorUtil.validate_bool(os.environ.get("GENERATION_ALLOW_IMAGES"), False),
    "PROVIDER": os.environ.get("GENERATION_API_PROVIDER"),
    "ENDPOINT": os.environ.get("GENERATION_API_ENDPOINT"),
    "API_KEY": os.environ.get("GENERATION_API_KEY"),
    "API_VERSION": os.environ.get("GENERATION_API_VERSION"),
    "MODEL": os.environ.get("GENERATION_API_MODEL"),
    "LOG_STATS": ValidatorUtil.validate_bool(os.environ.get("GENERATION_LOG_STATS"), False),
}
