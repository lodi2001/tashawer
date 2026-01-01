"""
Signals for accounts app.
"""
import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.accounts.models import User
from apps.accounts.services.email_service import EmailService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, update_fields, **kwargs):
    """
    Handle post-save signals for User model.
    """
    # Skip if this is a new user (handled by registration views)
    if created:
        return

    # Send account approved email if user was just approved
    if update_fields and 'is_approved' in update_fields:
        if instance.is_approved:
            try:
                EmailService.send_account_approved_email(instance)
            except Exception as e:
                logger.error(f"Failed to send account approved email: {str(e)}")
