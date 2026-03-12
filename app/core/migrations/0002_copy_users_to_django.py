from datetime import datetime

import pytz
from django.db import IntegrityError, migrations, transaction
from django.utils.timezone import make_aware


def copy_users_to_django(apps, schema_editor):
    """
    Copy old Fuel Users model to Django's User model
    """
    FuelUsers = apps.get_model("core", "Users")
    DjangoUser = apps.get_model("auth", "User")

    for fuel_user in FuelUsers.objects.all():
        # convert created_at and last_login to datetime
        date_joined = make_aware(datetime.fromtimestamp(fuel_user.created_at), pytz.utc)
        last_login = make_aware(datetime.fromtimestamp(fuel_user.last_login), pytz.utc)

        if not fuel_user.username:
            fuel_user.username = f"{fuel_user.id}{fuel_user.first}{fuel_user.last}"

        try:
            with transaction.atomic():
                new_user = DjangoUser.objects.create(
                    id=fuel_user.id,
                    password=fuel_user.password,
                    last_login=last_login,
                    is_superuser=False,
                    username=fuel_user.username,
                    first_name=fuel_user.first,
                    last_name=fuel_user.last,
                    email=fuel_user.email,
                    is_staff=False,
                    is_active=True,
                    date_joined=date_joined,
                )
                new_user.save()
        except IntegrityError:
            # there should not be more than one row per username, but in such a
            #  case we essentially 'collapse' all duplicate users into a single
            #  record by replacing any duplicate user ids with a single designated
            #  id depending on which is the first row for that username
            original_user = DjangoUser.objects.get(username=fuel_user.username)

            def replace_user_ids(model_name, old_id, new_id):
                apps.get_model("core", model_name).objects.filter(
                    user_id=old_id
                ).update(user_id=new_id)

            replace_user_ids("LogActivity", fuel_user.id, original_user.id)
            replace_user_ids("LogPlay", fuel_user.id, original_user.id)
            replace_user_ids("LogStorage", fuel_user.id, original_user.id)
            replace_user_ids("Lti", fuel_user.id, original_user.id)
            replace_user_ids("PermObjectToUser", fuel_user.id, original_user.id)
            replace_user_ids("PermRoleToUser", fuel_user.id, original_user.id)
            replace_user_ids("UserExtraAttempts", fuel_user.id, original_user.id)
            replace_user_ids("WidgetInstance", fuel_user.id, original_user.id)

            # TODO:
            # ideally we would also be able to see if this record has been updated more
            #  recently than the one we originally used, but Django auth user models don't
            #  have a field to track update datetimes


def revert_django_users_to_empty(apps, schema_editor):
    # delete all Django User objects
    DjangoUser = apps.get_model("auth", "User")
    db_alias = schema_editor.connection.alias

    try:
        DjangoUser.objects.using(db_alias).all().delete()
    except Exception:
        pass


class Migration(migrations.Migration):
    dependencies = [("core", "0001_initial")]

    operations = [
        migrations.RunPython(
            copy_users_to_django, revert_django_users_to_empty, atomic=False
        ),
    ]
