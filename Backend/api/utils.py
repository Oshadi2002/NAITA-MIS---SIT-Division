from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_coordinator_invite(email, registration_link):
    """
    Sends an invitation email to a university coordinator.
    """
    subject = 'Invitation to join as University Coordinator'
    message = (
        f"Hello,\n\n"
        f"You have been invited to register as a University Coordinator in the SIT Management System.\n\n"
        f"Please follow the link below to complete your registration:\n"
        f"{registration_link}\n\n"
        f"This link is unique to you and can only be used once.\n\n"
        f"Thank you."
    )
    
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'admin@system.com')
    
    try:
        send_mail(
            subject,
            message,
            from_email,
            [email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send coordinator invite email to {email}: {str(e)}")
        return False
