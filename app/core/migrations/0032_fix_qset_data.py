from django.db import migrations


def fix_qset_data(apps, schema_editor):
    """
    Removes the b'' that surrounds some of the data in the qset table
    """

    WidgetQset = apps.get_model("core", "WidgetQset")
    total_count = WidgetQset.objects.all().count()
    current_index = 0
    print()

    for qset in WidgetQset.objects.all():
        current_index += 1
        decoded = qset.data.decode("utf-8")
        if decoded.startswith("b'") and decoded.endswith("'"):
            decoded = decoded[2:-1]
            qset.data = decoded
            qset.save()

        if current_index % 1000 == 0:
            print(f"~{current_index / total_count * 100:.2f}%")


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0031_user_groups"),
    ]

    operations = [migrations.RunPython(fix_qset_data, migrations.RunPython.noop)]
