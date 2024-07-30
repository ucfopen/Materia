from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_copy_users_to_django"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="UserRole",
            options={"managed": False},
        ),
        migrations.AlterModelOptions(
            name="Users",
            options={"managed": False},
        ),
    ]
