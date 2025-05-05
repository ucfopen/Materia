from datetime import datetime

import pytz
from django.contrib.auth.models import User as DjangoUser
from django.db import IntegrityError, migrations, transaction
from django.utils.timezone import make_aware

# from core.models import Users


def copy_users_to_django(apps, schema_editor):
    """
    Copy old Fuel Users model to Django's User model
    """
    # TODO: figure out how to handle profile_fields, will do!いつてきます にほ 犬 和　
    #column profile_fields is a type TEXT. has json that looks like this:
    # a:4:{s:11:"useGravatar";b:1;s:6:"notify";b:1;s:16:"last_pass_change";s:10:"1589489163";s:9:"beardMode";b:0;}
    #or this: a:3:{s:6:"notify";s:2:"on";s:9:"beardMode";b:0;s:11:"useGravatar";b:1;}
    # TODO: look into bulk_create for potential efficiency

    FuelUsers = apps.get_model("core", "Users")

    # use raw sql to create a guest user with id 0
    with transaction.atomic():
        cursor = schema_editor.connection.cursor()
        cursor.execute(
            """
            SET SESSION sql_mode='NO_AUTO_VALUE_ON_ZERO';
            INSERT INTO `auth_user` (`id`, `password`, `last_login`, `is_superuser`, `username`, `first_name`, `last_name`, `email`, `is_staff`, `is_active`, `date_joined`)
            VALUES
                (0, '', NULL, 0, 'guestuser', 'guest', 'user', 'testguestuser@ucf.edu', 0, 1, NOW());
            """
        )

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
            # duplicate username, make a new one
            fuel_user.username = (
                f"{fuel_user.username}_{fuel_user.id}{fuel_user.first}{fuel_user.last}"
            )
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


def revert_django_users_to_empty(apps, schema_editor):
    # delete all Django User objects
    try:
        DjangoUser.apps.get_model("auth", "User")
        DjangoUser.objects.all().delete()
    except Exception:
        pass


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial")
    ]

    operations = [
        migrations.RunPython(copy_users_to_django, revert_django_users_to_empty)
    ]
