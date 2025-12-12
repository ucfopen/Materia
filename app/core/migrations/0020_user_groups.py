from django.contrib.auth.models import Group
from django.db import migrations
from django.db.models import Q, Subquery


def create_user_groups(apps, schema_editor):
    print()
    support_group, created_support_group = Group.objects.get_or_create(
        name="support_user"
    )
    if created_support_group:
        print("support_user group created")

    author_group, created_author_group = Group.objects.get_or_create(
        name="basic_author"
    )
    if created_author_group:
        print("basic_author group created")

    no_author_group, created_no_author_group = Group.objects.get_or_create(
        name="no_author"
    )
    if created_no_author_group:
        print("no_author group created")


def clean_perm_role_to_user(apps, schema_editor):
    # Skip this migration if PermRoleToUser doesn't exist (meaning we aren't migrating from PHP)
    # TODO: can that even happen? 0001_initial creates this table when starting from scratch
    if "perm_role_to_user" not in schema_editor.connection.introspection.table_names():
        return

    PermRoleToUser = apps.get_model("core", "PermRoleToUser")
    User = apps.get_model("auth", "User")
    print("\nDeleting perm_role_to_user rows that do not have matching user...")
    all_user_ids = User.objects.all().values_list("id", flat=True)
    violating_rows = PermRoleToUser.objects.filter(
        ~Q(user_id__in=Subquery(all_user_ids))
    )
    print(f"Found {violating_rows.count()} violating rows. Deleting...")
    violating_rows.delete()


def convert_user_groups(apps, schema_editor):
    # Skip this migration if PermRoleToUser doesn't exist (meaning we aren't migrating from PHP)
    if "perm_role_to_user" not in schema_editor.connection.introspection.table_names():
        return

    Group = apps.get_model("auth", "Group")
    UserGroups = apps.get_model("auth", "User_Groups")

    User = apps.get_model("auth", "User")
    UserRole = apps.get_model("core", "UserRole")
    PermRoleToUser = apps.get_model("core", "PermRoleToUser")

    # Map PHP role ids to Django role ids by name
    php_to_django_role = {}
    superuser_role = None
    for php_role in UserRole.objects.all():
        django_role = Group.objects.filter(name=php_role.name).first()
        if django_role is None:
            if php_role.name == "super_user":
                superuser_role = php_role.role_id
                continue
            else:
                print(f"Could not find PHP role '{php_role.name}' in Django DB")
                continue
        php_to_django_role[php_role.role_id] = django_role.id

    # Convert all roles
    for user_id, php_role_id in PermRoleToUser.objects.all().values_list(
        "user_id", "role_id"
    ):
        if php_role_id == superuser_role:
            django_user = User.objects.get(id=user_id)
            django_user.is_superuser = True
            django_user.save()
        else:
            UserGroups.objects.create(
                user_id=user_id, group_id=php_to_django_role[php_role_id]
            )


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0019_backfill_user_settings"),
    ]

    operations = [
        migrations.RunPython(clean_perm_role_to_user, migrations.RunPython.noop),
        migrations.RunPython(create_user_groups, migrations.RunPython.noop),
        migrations.RunPython(convert_user_groups, migrations.RunPython.noop),
    ]
