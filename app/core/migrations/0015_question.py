import django.db.models.deletion
from django.db import migrations, models
from django.utils import timezone


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0014_rename_type_assetdata_file_type"),
    ]

    operations = [
        migrations.CreateModel(
            name="Question",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                (
                    "qset",
                    models.ForeignKey(
                        db_column="qset_id",
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="questions",
                        to="core.widgetqset",
                    ),
                ),
                ("_data", models.TextField(db_column="data")),
                ("item_id", models.CharField(max_length=100, blank=True)),
                ("created_at", models.DateTimeField(default=timezone.now)),
                (
                    "type",
                    models.ForeignKey(
                        db_column="type",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="widget_type",
                        to="core.widget",
                    ),
                ),
            ],
            options={
                "db_table": "question",
            },
        ),
    ]
