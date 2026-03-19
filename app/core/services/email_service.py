import logging

from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.models import User
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    def send_email(
        template: str,
        context: dict,
        plain_msg: str,
        sender: User | str,
        to: User | str,
    ) -> bool:
        """
        Sends a Materia-themed email.

        Args:
            template: The template in templates/email/ to use. Should be extended off email_root.html.
            context: The context dict to fill the template.
            plain_msg: A plain string with the message's content, used when the reader does not view the HTML version of
            the email.
            sender: User that is sending the email, or any string
            to: User that is receiving the email, or any email string

        Returns:
            A boolean indicating whether the email was sent successfully.
        """

        # Check if emails are enabled
        if not settings.SEND_EMAILS:
            return False

        # Append context with items required for root email template
        context["static_url"] = f"{settings.URLS["BASE_URL"]}static/"

        # Determine from and to
        to_email = to.email if isinstance(to, User) else to
        from_str = (
            f"{sender.first_name} {sender.last_name}"
            if isinstance(sender, User)
            else sender
        )

        # Send email
        html = render_to_string(f"email/{template}", context)
        send_mail(
            subject=f"{settings.NAME} Notification",
            html_message=html,
            message=plain_msg,
            from_email=f'"{from_str}" <{settings.SYSTEM_EMAIL}>',
            recipient_list=[to_email],
        )
        return True
