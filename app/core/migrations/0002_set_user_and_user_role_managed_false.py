from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='UserRole',
            options={'managed': False},
        ),
        migrations.AlterModelOptions(
            name='Users',
            options={'managed': False},
        )
    ]
