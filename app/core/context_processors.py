from core.models import UserSettings


def theme(request):
    if not request.user.is_authenticated:
        return {"theme": "light"}

    user_profile, _ = UserSettings.objects.get_or_create(user=request.user)
    profile_fields = user_profile.get_profile_fields()
    theme_value = profile_fields.get("theme", "light")
    return {"theme": theme_value}
