import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0010_boolean_conversion"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RemoveField(
            model_name="usersettings",
            name="settings",
        ),
        migrations.AlterField(
            model_name="usersettings",
            name="profile_fields",
            field=models.JSONField(default=dict),
        ),
        migrations.AlterField(
            model_name="usersettings",
            name="user",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="profile_settings",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="widgetqset",
            name="data",
            field=models.TextField(db_column="data"),
        ),
    ]
