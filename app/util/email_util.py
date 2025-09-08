import logging

from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.models import User
from django.template.loader import render_to_string

logger = logging.getLogger("django")


class EmailUtil:
    @staticmethod
    def send_email(
        template: str,
        context: dict,
        plain_msg: str,
        sender: User,
        to: User,
    ) -> bool:
        """
        Sends a Materia-themed email.

        Args:
            template: The template in templates/email/ to use. Should be extended off email_root.html.
            context: The context dict to fill the template.
            plain_msg: A plain string with the message's content, used when the reader does not view the HTML version of
            the email.
            sender: User that is sending the email.
            to: User that is receiving the email.

        Returns:
            A boolean indicating whether the email was sent successfully.
        """

        # Check if emails are enabled
        if not settings.SEND_EMAILS:
            return False

        # Append context with items required for root email template
        context["static_url"] = f"{settings.URLS["BASE_URL"]}static/"

        # Send email
        html = render_to_string(f"email/{template}", context)
        send_mail(
            subject=f"{settings.NAME} Notification",
            html_message=html,
            message=plain_msg,
            from_email=f'"{sender.first_name} {sender.last_name}" <{settings.SYSTEM_EMAIL}>',
            recipient_list=[to.email],
        )
        return True
