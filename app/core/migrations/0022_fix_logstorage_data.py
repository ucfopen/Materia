from django.db import migrations


def fix_logstorage_data(apps, schema_editor):
    """
    Removes the b'' that surrounds some of the data in the qset table
    """

    LogStorage = apps.get_model("core", "LogStorage")

    for log_storage in LogStorage.objects.all():
        decoded = log_storage.data.decode("utf-8")
        if decoded.startswith("b'") and decoded.endswith("'"):
            decoded = decoded[2:-1]
            log_storage.data = decoded
            log_storage.save()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0021_fix_qset_data"),
    ]

    operations = [migrations.RunPython(fix_logstorage_data, migrations.RunPython.noop)]
