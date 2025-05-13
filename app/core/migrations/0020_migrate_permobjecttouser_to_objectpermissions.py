from django.db import migrations


# This is a custom-written migration to migrate the data from PermObjectToUser to ObjectPermission
# Limited testing indicates it should probably work, but it should be tested with sample data at scale !!
def migrate_permissions(apps, schema_editor):
    # Get the old and new model classes
    OldPermObjectToUser = apps.get_model("core", "PermObjectToUser")
    ObjectPermission = apps.get_model("core", "ObjectPermission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    # create a new contenttype for each model we're using in association with ObjectPermission
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

    # Mapping of old object type integers to their associated content types
    object_type_mapping = {
        1: content_types["question"],
        2: content_types["asset"],
        4: content_types["widgetinstance"],
    }

    # Mapping of permission levels
    permission_mapping = {
        1: "visible",  # VISIBLE from old model
        30: "full",  # FULL from old model
    }

    # Bulk create list to optimize database writes
    new_permissions = []

    # Iterate through old permissions
    for old_perm in OldPermObjectToUser.objects.all():
        # Skip if the permission type isn't mapped
        if old_perm.perm not in permission_mapping:
            continue

        content_type = object_type_mapping.get(old_perm.object_type)

        # content type not included? this shouldn't happen, but skip
        if not content_type:
            continue

        # user id is null? skip
        if not old_perm.user_id:
            continue

        # Create new permission object
        new_perm = ObjectPermission(
            user_id=old_perm.user_id,
            content_type=content_type,
            object_id=old_perm.object_id,
            permission=permission_mapping[old_perm.perm],
            expires_at=old_perm.expires_at,
        )
        new_permissions.append(new_perm)

    # Bulk create new permissions
    ObjectPermission.objects.bulk_create(new_permissions)


def reverse_migration(apps, schema_editor):
    # Optional: method to reverse the migration if needed
    ObjectPermission = apps.get_model("core", "ObjectPermission")
    ObjectPermission.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0019_alter_permobjecttouser_user_objectpermission"),
    ]

    operations = [
        migrations.RunPython(migrate_permissions, reverse_migration),
    ]
