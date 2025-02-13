from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
import getpass

class Command(BaseCommand):
    help = "Creates a new student user"

    def handle(self, *args, **kwargs):
        username = input("Enter username: ")
        email = input("Enter email: ")
        password = getpass.getpass("Enter password: ")

        user, created = User.objects.get_or_create(username=username, email=email)
        if not created:
            self.stdout.write(self.style.WARNING(f"User {username} already exists. Updating password."))
        user.set_password(password)
        user.save()
        #we want the first tuple, the second one is a bool so we dont need it
        student_group, _ = Group.objects.get_or_create(name="Student")
        user.groups.add(student_group)
        user.save()

        self.stdout.write(self.style.SUCCESS(f"Student user '{username}' created successfully!"))

