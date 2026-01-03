"""
Webhook Log Model for tracking payment gateway webhook events.

This model provides an audit trail for all incoming webhooks,
enabling debugging, retry handling, and compliance requirements.
"""

import uuid
from django.db import models


class WebhookSource(models.TextChoices):
    """Sources of webhook events."""
    TAP = 'tap', 'Tap Payment Gateway'
    OTHER = 'other', 'Other'


class WebhookEventType(models.TextChoices):
    """Types of webhook events."""
    PAYMENT = 'payment', 'Payment'
    DEPOSIT = 'deposit', 'Deposit'
    REFUND = 'refund', 'Refund'
    CHARGE_CAPTURED = 'charge.captured', 'Charge Captured'
    CHARGE_FAILED = 'charge.failed', 'Charge Failed'
    CHARGE_CANCELLED = 'charge.cancelled', 'Charge Cancelled'
    UNKNOWN = 'unknown', 'Unknown'


class WebhookStatus(models.TextChoices):
    """Processing status of webhook events."""
    RECEIVED = 'received', 'Received'
    PROCESSING = 'processing', 'Processing'
    PROCESSED = 'processed', 'Processed Successfully'
    FAILED = 'failed', 'Processing Failed'
    IGNORED = 'ignored', 'Ignored (Duplicate/Invalid)'


class WebhookLog(models.Model):
    """
    Log model for tracking webhook events from payment gateways.

    Provides:
    - Audit trail for all webhook events
    - Debugging information for payment issues
    - Idempotency tracking via event_id
    - Retry tracking via attempt_count
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    # Source and identification
    source = models.CharField(
        max_length=20,
        choices=WebhookSource.choices,
        default=WebhookSource.TAP,
        help_text="Source of the webhook"
    )
    event_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Unique event ID from the gateway (for idempotency)"
    )
    event_type = models.CharField(
        max_length=50,
        choices=WebhookEventType.choices,
        default=WebhookEventType.UNKNOWN,
        help_text="Type of webhook event"
    )

    # Reference information
    reference_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        db_index=True,
        help_text="Our internal reference number (transaction/deposit)"
    )
    gateway_charge_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        db_index=True,
        help_text="Gateway's charge/transaction ID"
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=WebhookStatus.choices,
        default=WebhookStatus.RECEIVED,
        help_text="Processing status of this webhook"
    )
    gateway_status = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Status reported by the gateway (e.g., CAPTURED, FAILED)"
    )

    # Payload and response
    headers = models.JSONField(
        default=dict,
        blank=True,
        help_text="Request headers (sanitized)"
    )
    payload = models.JSONField(
        default=dict,
        help_text="Full webhook payload"
    )
    response_status = models.IntegerField(
        blank=True,
        null=True,
        help_text="HTTP response status we returned"
    )
    response_body = models.JSONField(
        default=dict,
        blank=True,
        help_text="Response we sent back to gateway"
    )

    # Retry handling
    attempt_count = models.PositiveIntegerField(
        default=1,
        help_text="Number of times this webhook was received"
    )
    is_duplicate = models.BooleanField(
        default=False,
        help_text="Whether this is a duplicate of a previously processed event"
    )

    # Security
    signature_valid = models.BooleanField(
        default=True,
        help_text="Whether the webhook signature was valid"
    )
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
        help_text="IP address of the webhook sender"
    )

    # Error tracking
    error_message = models.TextField(
        blank=True,
        null=True,
        help_text="Error message if processing failed"
    )

    # Timestamps
    received_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the webhook was received"
    )
    processed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the webhook was successfully processed"
    )

    class Meta:
        db_table = 'webhook_logs'
        ordering = ['-received_at']
        verbose_name = 'Webhook Log'
        verbose_name_plural = 'Webhook Logs'
        indexes = [
            models.Index(fields=['source', 'received_at']),
            models.Index(fields=['event_id']),
            models.Index(fields=['status']),
            models.Index(fields=['-received_at']),
        ]

    def __str__(self):
        return f"{self.source}:{self.event_type} - {self.reference_number or self.gateway_charge_id} ({self.status})"

    def mark_processed(self):
        """Mark webhook as successfully processed."""
        from django.utils import timezone
        self.status = WebhookStatus.PROCESSED
        self.processed_at = timezone.now()
        self.save(update_fields=['status', 'processed_at'])

    def mark_failed(self, error_message: str):
        """Mark webhook as failed with error message."""
        self.status = WebhookStatus.FAILED
        self.error_message = error_message
        self.save(update_fields=['status', 'error_message'])

    def mark_ignored(self, reason: str = "Duplicate"):
        """Mark webhook as ignored."""
        self.status = WebhookStatus.IGNORED
        self.is_duplicate = True
        self.error_message = reason
        self.save(update_fields=['status', 'is_duplicate', 'error_message'])

    @classmethod
    def log_webhook(
        cls,
        source: str,
        event_type: str,
        payload: dict,
        headers: dict = None,
        reference_number: str = None,
        gateway_charge_id: str = None,
        gateway_status: str = None,
        ip_address: str = None,
        signature_valid: bool = True,
    ) -> 'WebhookLog':
        """
        Create a webhook log entry.

        Checks for existing events with same event_id to handle idempotency.
        """
        # Extract event ID if present (Tap uses 'id' field)
        event_id = payload.get('id') or payload.get('object', {}).get('id')

        # Check for existing webhook with same event_id
        if event_id:
            existing = cls.objects.filter(
                source=source,
                event_id=event_id
            ).first()

            if existing:
                existing.attempt_count += 1
                existing.is_duplicate = True
                existing.save(update_fields=['attempt_count', 'is_duplicate'])
                return existing

        # Sanitize headers (remove sensitive data)
        sanitized_headers = {}
        if headers:
            for key, value in headers.items():
                key_lower = key.lower()
                if 'authorization' in key_lower or 'secret' in key_lower:
                    sanitized_headers[key] = '[REDACTED]'
                else:
                    sanitized_headers[key] = value

        return cls.objects.create(
            source=source,
            event_id=event_id,
            event_type=event_type,
            payload=payload,
            headers=sanitized_headers,
            reference_number=reference_number,
            gateway_charge_id=gateway_charge_id,
            gateway_status=gateway_status,
            ip_address=ip_address,
            signature_valid=signature_valid,
        )
