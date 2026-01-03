"""
Notification models for in-app and email notifications.
"""

import uuid
from django.db import models
from django.conf import settings


class NotificationType(models.TextChoices):
    """Types of notifications."""
    # Order related
    ORDER_CREATED = 'order_created', 'Order Created'
    ORDER_CONFIRMED = 'order_confirmed', 'Order Confirmed'
    ORDER_STARTED = 'order_started', 'Order Started'
    ORDER_DELIVERED = 'order_delivered', 'Order Delivered'
    ORDER_COMPLETED = 'order_completed', 'Order Completed'
    ORDER_CANCELLED = 'order_cancelled', 'Order Cancelled'
    ORDER_REVISION_REQUESTED = 'order_revision_requested', 'Revision Requested'

    # Milestone related
    MILESTONE_SUBMITTED = 'milestone_submitted', 'Milestone Submitted'
    MILESTONE_APPROVED = 'milestone_approved', 'Milestone Approved'
    MILESTONE_REVISION = 'milestone_revision', 'Milestone Revision Requested'

    # Proposal related
    PROPOSAL_RECEIVED = 'proposal_received', 'Proposal Received'
    PROPOSAL_ACCEPTED = 'proposal_accepted', 'Proposal Accepted'
    PROPOSAL_REJECTED = 'proposal_rejected', 'Proposal Rejected'

    # Project related
    PROJECT_INVITATION = 'project_invitation', 'Project Invitation'
    PROJECT_UPDATED = 'project_updated', 'Project Updated'

    # Payment related
    PAYMENT_RECEIVED = 'payment_received', 'Payment Received'
    PAYMENT_RELEASED = 'payment_released', 'Payment Released'
    WITHDRAWAL_APPROVED = 'withdrawal_approved', 'Withdrawal Approved'
    WITHDRAWAL_REJECTED = 'withdrawal_rejected', 'Withdrawal Rejected'

    # Dispute related
    DISPUTE_OPENED = 'dispute_opened', 'Dispute Opened'
    DISPUTE_RESPONSE_NEEDED = 'dispute_response_needed', 'Dispute Response Needed'
    DISPUTE_RESOLVED = 'dispute_resolved', 'Dispute Resolved'

    # Message related
    NEW_MESSAGE = 'new_message', 'New Message'

    # Review related
    NEW_REVIEW = 'new_review', 'New Review'

    # System
    SYSTEM_ANNOUNCEMENT = 'system_announcement', 'System Announcement'
    ACCOUNT_VERIFIED = 'account_verified', 'Account Verified'


class NotificationCategory(models.TextChoices):
    """Categories for notification preferences."""
    ORDERS = 'orders', 'Orders'
    PROPOSALS = 'proposals', 'Proposals'
    PAYMENTS = 'payments', 'Payments'
    MESSAGES = 'messages', 'Messages'
    DISPUTES = 'disputes', 'Disputes'
    REVIEWS = 'reviews', 'Reviews'
    SYSTEM = 'system', 'System'


class Notification(models.Model):
    """
    In-app notification model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
    )
    category = models.CharField(
        max_length=20,
        choices=NotificationCategory.choices,
        default=NotificationCategory.SYSTEM,
    )
    title = models.CharField(max_length=255)
    title_ar = models.CharField(max_length=255, blank=True)
    message = models.TextField()
    message_ar = models.TextField(blank=True)

    # Related object reference (generic)
    related_object_type = models.CharField(max_length=50, blank=True)
    related_object_id = models.UUIDField(null=True, blank=True)

    # Action URL for click handling
    action_url = models.CharField(max_length=500, blank=True)

    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    # Metadata for additional context
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['notification_type']),
        ]

    def __str__(self):
        return f"{self.notification_type} for {self.user.email}"

    def mark_as_read(self):
        """Mark notification as read."""
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    def get_title(self, language='en'):
        """Get title in specified language."""
        if language == 'ar' and self.title_ar:
            return self.title_ar
        return self.title

    def get_message(self, language='en'):
        """Get message in specified language."""
        if language == 'ar' and self.message_ar:
            return self.message_ar
        return self.message


class NotificationPreference(models.Model):
    """
    User notification preferences.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )

    # Email preferences by category
    email_orders = models.BooleanField(default=True)
    email_proposals = models.BooleanField(default=True)
    email_payments = models.BooleanField(default=True)
    email_messages = models.BooleanField(default=True)
    email_disputes = models.BooleanField(default=True)
    email_reviews = models.BooleanField(default=True)
    email_system = models.BooleanField(default=True)

    # Push notification preferences by category
    push_orders = models.BooleanField(default=True)
    push_proposals = models.BooleanField(default=True)
    push_payments = models.BooleanField(default=True)
    push_messages = models.BooleanField(default=True)
    push_disputes = models.BooleanField(default=True)
    push_reviews = models.BooleanField(default=True)
    push_system = models.BooleanField(default=True)

    # SMS preferences (only for critical notifications)
    sms_payments = models.BooleanField(default=True)
    sms_disputes = models.BooleanField(default=True)
    sms_system = models.BooleanField(default=False)

    # Preferred language for notifications
    preferred_language = models.CharField(
        max_length=5,
        choices=[('en', 'English'), ('ar', 'Arabic')],
        default='en'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'

    def __str__(self):
        return f"Preferences for {self.user.email}"

    def should_send_email(self, category: str) -> bool:
        """Check if email should be sent for category."""
        field_name = f'email_{category}'
        return getattr(self, field_name, True)

    def should_send_push(self, category: str) -> bool:
        """Check if push should be sent for category."""
        field_name = f'push_{category}'
        return getattr(self, field_name, True)

    def should_send_sms(self, category: str) -> bool:
        """Check if SMS should be sent for category."""
        field_name = f'sms_{category}'
        return getattr(self, field_name, False)


class EmailLog(models.Model):
    """
    Log of sent emails for tracking and debugging.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='email_logs'
    )
    to_email = models.EmailField()
    subject = models.CharField(max_length=255)
    template_name = models.CharField(max_length=100)
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        blank=True,
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('sent', 'Sent'),
            ('failed', 'Failed'),
            ('bounced', 'Bounced'),
        ],
        default='pending'
    )
    error_message = models.TextField(blank=True)

    # Tracking
    sent_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Email to {self.to_email}: {self.subject}"


class DeviceToken(models.Model):
    """
    FCM device tokens for push notifications.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='device_tokens'
    )
    token = models.CharField(max_length=500, unique=True)
    device_type = models.CharField(
        max_length=20,
        choices=[
            ('web', 'Web Browser'),
            ('android', 'Android'),
            ('ios', 'iOS'),
        ],
        default='web'
    )
    device_name = models.CharField(max_length=100, blank=True)
    device_info = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-last_used_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['token']),
        ]

    def __str__(self):
        return f"{self.device_type} token for {self.user.email}"
