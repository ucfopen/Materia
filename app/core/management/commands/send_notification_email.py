from django.core.management import base

from core.services.email_service import EmailService


class Command(base.BaseCommand):
    help = "Send a simple basic notification email using the current setup"

    def add_arguments(self, parser):
        # Required
        parser.add_argument(
            "to",
            type=str,
            help="Email address to send to",
        )

        parser.add_argument(
            "from",
            type=str,
            help="Sender name",
        )

        parser.add_argument("message", type=str, help="Message to send")

        # Optionals
        parser.add_argument(
            "--button-text",
            "-b",
            type=str,
            nargs="?",
            default=None,
            help="Text of action button",
        )

        parser.add_argument(
            "--button-link",
            "-l",
            type=str,
            nargs="?",
            default=None,
            help="HREF of action button",
        )

    def handle(self, *args, **kwargs):
        context = {
            "message_html": kwargs["message"],
            "action_link": kwargs["button_link"],
            "action_text": kwargs["button_text"],
        }

        EmailService.send_email(
            template="basic_notification.html",
            context=context,
            plain_msg="",
            sender=kwargs["from"],
            to=kwargs["to"],
        )
        print("Email sent!")
