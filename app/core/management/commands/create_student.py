from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
import getpass

class Command(BaseCommand):
    help = "Creates a new student user"

    def handle(self, *args, **kwargs):
        username = input("Enter username: ")
        email = input("Enter email: ")
        password = getpass.getpass("Enter password: ")

        # Check to see if a user with either the specified username *or* email (but not both) exists. If they do,
        # then fail the command. If a user with both exists, then just update the password later on.
        user_with_username = User.objects.filter(username=username).first()
        user_with_email = User.objects.filter(email=email).first()
        if (user_with_username or user_with_email) and not (user_with_username and user_with_email):
            if user_with_username:
                self.stdout.write(self.style.ERROR("User with that username already exists."))
            elif user_with_email:
                self.stdout.write(self.style.ERROR("User with email already exists."))
            return

        user, created = User.objects.get_or_create(username=username, email=email)
        if not created:
            self.stdout.write(self.style.WARNING(f"User {username} already exists. Updating password."))
        user.set_password(password)
        user.save()
        # we want the first tuple, the second one is a bool so we dont need it
        student_group, _ = Group.objects.get_or_create(name="Student")
        user.groups.add(student_group)
        user.save()

        self.stdout.write(self.style.SUCCESS(f"Student user '{username}' created successfully!"))

