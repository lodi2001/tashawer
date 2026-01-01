"""
Audit Log model for tracking admin actions.
Implements AC9 from NUW-21.
"""
import uuid

from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """
    Audit log for tracking admin actions on user accounts.
    """

    class ActionType(models.TextChoices):
        APPROVE = 'approve', 'Approve User'
        SUSPEND = 'suspend', 'Suspend User'
        ACTIVATE = 'activate', 'Activate User'
        EDIT = 'edit', 'Edit User Info'
        RESET_PASSWORD = 'reset_password', 'Reset Password'
        DELETE = 'delete', 'Delete User'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='admin_actions',
        verbose_name='Admin'
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs',
        verbose_name='Target User'
    )
    action = models.CharField(
        max_length=20,
        choices=ActionType.choices,
        verbose_name='Action Type'
    )
    details = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Action Details'
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='IP Address'
    )
    user_agent = models.TextField(
        null=True,
        blank=True,
        verbose_name='User Agent'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Created At'
    )

    class Meta:
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['admin', 'created_at']),
            models.Index(fields=['target_user', 'created_at']),
            models.Index(fields=['action', 'created_at']),
        ]

    def __str__(self):
        admin_email = self.admin.email if self.admin else 'Unknown'
        target_email = self.target_user.email if self.target_user else 'Unknown'
        return f"{admin_email} - {self.action} - {target_email}"

    @classmethod
    def log_action(cls, admin, target_user, action, details=None, request=None):
        """
        Create an audit log entry.

        Args:
            admin: The admin user performing the action
            target_user: The user being acted upon
            action: ActionType choice
            details: Optional dict with additional details
            request: Optional HTTP request for IP/user agent
        """
        ip_address = None
        user_agent = None

        if request:
            # Get IP address
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')

            # Get user agent
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

        return cls.objects.create(
            admin=admin,
            target_user=target_user,
            action=action,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )
