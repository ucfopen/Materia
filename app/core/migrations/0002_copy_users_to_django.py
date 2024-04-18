from datetime import datetime

from django.db import migrations
from django.contrib.auth.models import User

# from core.models import Users


def copy_users_to_django(apps, schema_editor):
    """
    Copy old Fuel Users model to Django's User model
    """
    # TODO: figure out how to handle password and login_hash
    # TODO: figure out how to handle profile_fields
    # TODO: look into bulk_create for potential efficiency

    Users = apps.get_model("core", "Users")

    for user in Users.objects.all():
        # convert created_at and last_login to datetime
        date_joined = datetime.fromtimestamp(user.created_at)
        last_login = datetime.fromtimestamp(user.last_login)

        new_user = User.objects.create(
            id=user.id,
            password=user.password,
            last_login=last_login,
            is_superuser=False,
            username=user.username,
            first_name=user.first,
            last_name=user.last,
            email=user.email,
            is_staff=False,
            is_active=True,
            date_joined=date_joined,
        )
        new_user.save()


def revert_django_users_to_empty(apps, schema_editor):
    # delete all Django User objects
    try:
        User.objects.all().delete()
    except Exception:
        pass


class Migration(migrations.Migration):
    dependencies = [("core", "0001_initial")]

    operations = [
        migrations.RunPython(copy_users_to_django, revert_django_users_to_empty)
    ]
