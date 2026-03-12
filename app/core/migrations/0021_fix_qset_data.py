from django.db import migrations


def fix_qset_data(apps, schema_editor):
    """
    Removes the b'' that surrounds some of the data in the qset table
    """

    WidgetQset = apps.get_model("core", "WidgetQset")

    for qset in WidgetQset.objects.all():
        decoded = qset.data.decode("utf-8")
        if decoded.startswith("b'") and decoded.endswith("'"):
            decoded = decoded[2:-1]
            qset.data = decoded
            qset.save()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0020_user_groups"),
    ]

    operations = [migrations.RunPython(fix_qset_data, migrations.RunPython.noop)]
