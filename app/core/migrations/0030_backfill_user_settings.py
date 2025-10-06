import phpserialize
from django.db import migrations

from core.models import UserSettings as UserSettingsModel


def backfill_user_settings(apps, schema_editor):
    FuelUsers = apps.get_model("core", "Users")
    UserSettings = apps.get_model("core", "UserSettings")

    for user_id, profile_fields in FuelUsers.objects.all().values_list(
        "id", "profile_fields"
    ):
        # Ignore guest user
        if user_id == 0:
            continue

        # Ignore is user already had a UserSettings row
        if UserSettings.objects.filter(user_id=user_id).exists():
            continue

        # Try to convert the profile_fields field to a python dict
        old_fields_dict = None
        try:
            old_fields_dict = phpserialize.loads(
                profile_fields.encode(), decode_strings=True
            )
        except Exception:
            pass

        # Check if the profile_field was converted properly. Use default settings if not.
        apply_default_settings = False
        if not isinstance(old_fields_dict, dict):
            print(
                f"User {user_id} has an invalid profile_fields field. Applying defaults."
            )
            apply_default_settings = True

        # Set user's settings
        if apply_default_settings:
            UserSettings.objects.create(
                user_id=user_id,
                profile_fields={**UserSettingsModel.DEFAULT_PROFILE_FIELDS},
            )
        else:
            UserSettings.objects.create(user_id=user_id, profile_fields=old_fields_dict)


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0029_merge_20250926_1522"),
    ]

    operations = [
        migrations.RunPython(backfill_user_settings, migrations.RunPython.noop),
    ]
