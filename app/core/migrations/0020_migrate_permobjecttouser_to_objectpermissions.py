from django.db import migrations


# This is a custom-written migration to migrate the data from PermObjectToUser to ObjectPermission
def migrate_permissions(apps, schema_editor):
    OldPermObjectToUser = apps.get_model("core", "PermObjectToUser")
    ObjectPermission = apps.get_model("core", "ObjectPermission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    content_types = {}
    for model_name in ["question", "asset", "widgetinstance"]:
        try:
            content_types[model_name] = ContentType.objects.get(
                app_label="core", model=model_name
            )
        except ContentType.DoesNotExist:
            content_types[model_name] = ContentType.objects.create(
                app_label="core", model=model_name
            )

    object_type_mapping = {
        1: content_types["question"],
        2: content_types["asset"],
        4: content_types["widgetinstance"],
    }

    permission_mapping = {
        1: "visible",
        30: "full",
    }

    new_permissions = []

    for old_perm in OldPermObjectToUser.objects.all():
        if old_perm.perm not in permission_mapping:
            continue

        content_type = object_type_mapping.get(old_perm.object_type)
        if not content_type:
            continue

        if not old_perm.user_id:
            continue

        new_perm = ObjectPermission(
            user_id=old_perm.user_id,
            content_type=content_type,
            object_id=old_perm.object_id,
            permission=permission_mapping[old_perm.perm],
            expires_at=old_perm.expires_at,
        )
        new_permissions.append(new_perm)

    ObjectPermission.objects.bulk_create(new_permissions)


def reverse_migration(apps, schema_editor):
    ObjectPermission = apps.get_model("core", "ObjectPermission")
    ObjectPermission.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0019_alter_permobjecttouser_user_objectpermission"),
    ]

    operations = [
        migrations.RunPython(migrate_permissions, reverse_migration),
    ]

