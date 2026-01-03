"""
Dispute models for handling order conflicts between clients and consultants.
"""

import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone

from apps.core.models import SoftDeleteModel


class DisputeReason(models.TextChoices):
    """Predefined dispute reasons."""
    QUALITY_ISSUES = 'quality_issues', 'Quality Issues'
    INCOMPLETE_WORK = 'incomplete_work', 'Incomplete Work'
    MISSED_DEADLINE = 'missed_deadline', 'Missed Deadline'
    COMMUNICATION_ISSUES = 'communication_issues', 'Communication Issues'
    SCOPE_DISAGREEMENT = 'scope_disagreement', 'Scope Disagreement'
    PAYMENT_DISPUTE = 'payment_dispute', 'Payment Dispute'
    UNRESPONSIVE_PARTY = 'unresponsive_party', 'Unresponsive Party'
    OTHER = 'other', 'Other'


class DisputeStatus(models.TextChoices):
    """Dispute workflow statuses."""
    OPEN = 'open', 'Open'
    UNDER_REVIEW = 'under_review', 'Under Review'
    AWAITING_RESPONSE = 'awaiting_response', 'Awaiting Response'
    IN_MEDIATION = 'in_mediation', 'In Mediation'
    RESOLVED = 'resolved', 'Resolved'
    CLOSED = 'closed', 'Closed'
    ESCALATED = 'escalated', 'Escalated'


class ResolutionType(models.TextChoices):
    """Types of dispute resolutions."""
    FULL_REFUND_CLIENT = 'full_refund_client', 'Full Refund to Client'
    PARTIAL_REFUND_CLIENT = 'partial_refund_client', 'Partial Refund to Client'
    RELEASE_TO_CONSULTANT = 'release_to_consultant', 'Release to Consultant'
    PARTIAL_RELEASE_CONSULTANT = 'partial_release_consultant', 'Partial Release to Consultant'
    MUTUAL_AGREEMENT = 'mutual_agreement', 'Mutual Agreement'
    NO_ACTION = 'no_action', 'No Action Required'


class Dispute(SoftDeleteModel):
    """
    Dispute model for handling conflicts between clients and consultants.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dispute_number = models.CharField(max_length=20, unique=True, editable=False)

    # Relationships
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.PROTECT,
        related_name='disputes'
    )
    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='initiated_disputes'
    )
    assigned_admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_disputes'
    )

    # Dispute details
    reason = models.CharField(
        max_length=30,
        choices=DisputeReason.choices,
        default=DisputeReason.OTHER
    )
    description = models.TextField(
        help_text='Detailed description of the dispute'
    )
    desired_resolution = models.TextField(
        blank=True,
        help_text='What the initiator wants as resolution'
    )

    # Status and workflow
    status = models.CharField(
        max_length=20,
        choices=DisputeStatus.choices,
        default=DisputeStatus.OPEN
    )

    # Financial information
    disputed_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Amount in dispute'
    )

    # Resolution details
    resolution_type = models.CharField(
        max_length=30,
        choices=ResolutionType.choices,
        null=True,
        blank=True
    )
    resolution_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Final resolution amount'
    )
    resolution_notes = models.TextField(
        blank=True,
        help_text='Admin notes on the resolution'
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_disputes'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Response deadline
    response_deadline = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Deadline for the other party to respond'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['dispute_number']),
            models.Index(fields=['status']),
            models.Index(fields=['order']),
            models.Index(fields=['initiated_by']),
        ]

    def __str__(self):
        return f"Dispute {self.dispute_number} - {self.order.order_number}"

    def save(self, *args, **kwargs):
        if not self.dispute_number:
            self.dispute_number = self._generate_dispute_number()
        super().save(*args, **kwargs)

    def _generate_dispute_number(self):
        """Generate unique dispute number."""
        from django.utils import timezone
        import random
        timestamp = timezone.now().strftime('%Y%m%d')
        random_suffix = random.randint(1000, 9999)
        return f"DSP-{timestamp}-{random_suffix}"

    @property
    def client(self):
        """Get the client from the order."""
        return self.order.client

    @property
    def consultant(self):
        """Get the consultant from the order."""
        return self.order.consultant

    @property
    def other_party(self):
        """Get the other party (not the initiator)."""
        if self.initiated_by == self.client:
            return self.consultant
        return self.client

    @property
    def is_open(self):
        """Check if dispute is still open."""
        return self.status in [
            DisputeStatus.OPEN,
            DisputeStatus.UNDER_REVIEW,
            DisputeStatus.AWAITING_RESPONSE,
            DisputeStatus.IN_MEDIATION,
            DisputeStatus.ESCALATED,
        ]

    @property
    def can_respond(self):
        """Check if the other party can still respond."""
        return self.status == DisputeStatus.AWAITING_RESPONSE

    @property
    def can_resolve(self):
        """Check if dispute can be resolved."""
        return self.status in [
            DisputeStatus.UNDER_REVIEW,
            DisputeStatus.IN_MEDIATION,
            DisputeStatus.ESCALATED,
        ]

    def open_dispute(self):
        """Open the dispute and update order status."""
        from apps.orders.models import OrderStatus

        self.status = DisputeStatus.OPEN
        self.save(update_fields=['status', 'updated_at'])

        # Update order status to disputed
        self.order.status = OrderStatus.DISPUTED
        self.order.save(update_fields=['status', 'updated_at'])

        # Pause escrow if exists
        if self.order.escrow:
            self.order.escrow.status = 'disputed'
            self.order.escrow.save(update_fields=['status', 'updated_at'])

    def assign_admin(self, admin_user):
        """Assign an admin to review the dispute."""
        self.assigned_admin = admin_user
        self.status = DisputeStatus.UNDER_REVIEW
        self.save(update_fields=['assigned_admin', 'status', 'updated_at'])

    def request_response(self, deadline_days=3):
        """Request response from the other party."""
        self.status = DisputeStatus.AWAITING_RESPONSE
        self.response_deadline = timezone.now() + timezone.timedelta(days=deadline_days)
        self.save(update_fields=['status', 'response_deadline', 'updated_at'])

    def start_mediation(self):
        """Move dispute to mediation status."""
        self.status = DisputeStatus.IN_MEDIATION
        self.save(update_fields=['status', 'updated_at'])

    def escalate(self):
        """Escalate the dispute for higher review."""
        self.status = DisputeStatus.ESCALATED
        self.save(update_fields=['status', 'updated_at'])

    def resolve(self, admin_user, resolution_type, resolution_amount=None, notes=''):
        """
        Resolve the dispute and process refunds/releases.
        """
        from apps.orders.models import OrderStatus

        self.status = DisputeStatus.RESOLVED
        self.resolution_type = resolution_type
        self.resolution_amount = resolution_amount
        self.resolution_notes = notes
        self.resolved_by = admin_user
        self.resolved_at = timezone.now()
        self.save()

        # Process financial resolution
        self._process_resolution()

        # Update order status
        if resolution_type in [ResolutionType.FULL_REFUND_CLIENT, ResolutionType.PARTIAL_REFUND_CLIENT]:
            self.order.status = OrderStatus.CANCELLED
        else:
            self.order.status = OrderStatus.COMPLETED
        self.order.save(update_fields=['status', 'updated_at'])

    def _process_resolution(self):
        """Process the financial resolution of the dispute."""
        escrow = self.order.escrow
        if not escrow:
            return

        if self.resolution_type == ResolutionType.FULL_REFUND_CLIENT:
            escrow.refund(reason=f"Dispute {self.dispute_number} - Full refund")
        elif self.resolution_type == ResolutionType.PARTIAL_REFUND_CLIENT:
            if self.resolution_amount:
                escrow.partial_refund(
                    amount=self.resolution_amount,
                    reason=f"Dispute {self.dispute_number} - Partial refund"
                )
        elif self.resolution_type == ResolutionType.RELEASE_TO_CONSULTANT:
            escrow.release(reason=f"Dispute {self.dispute_number} - Released to consultant")
        elif self.resolution_type == ResolutionType.PARTIAL_RELEASE_CONSULTANT:
            if self.resolution_amount:
                escrow.partial_release(
                    amount=self.resolution_amount,
                    reason=f"Dispute {self.dispute_number} - Partial release"
                )

    def close(self, notes=''):
        """Close the dispute without resolution."""
        self.status = DisputeStatus.CLOSED
        self.resolution_notes = notes
        self.resolved_at = timezone.now()
        self.save(update_fields=['status', 'resolution_notes', 'resolved_at', 'updated_at'])


class DisputeEvidence(models.Model):
    """
    Evidence files attached to a dispute.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dispute = models.ForeignKey(
        Dispute,
        on_delete=models.CASCADE,
        related_name='evidence'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='dispute_evidence'
    )

    file = models.FileField(upload_to='disputes/evidence/%Y/%m/')
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(default=0)
    file_type = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Dispute evidence'

    def __str__(self):
        return f"Evidence for {self.dispute.dispute_number}: {self.original_filename}"

    def save(self, *args, **kwargs):
        if self.file:
            self.original_filename = self.original_filename or self.file.name
            self.file_size = self.file.size
        super().save(*args, **kwargs)


class DisputeMessage(models.Model):
    """
    Messages/comments in a dispute thread.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dispute = models.ForeignKey(
        Dispute,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='dispute_messages'
    )

    message = models.TextField()
    is_admin_message = models.BooleanField(default=False)
    is_internal_note = models.BooleanField(
        default=False,
        help_text='Internal admin notes not visible to parties'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message in {self.dispute.dispute_number} by {self.sender.email}"


class DisputeActivity(models.Model):
    """
    Activity log for dispute events.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dispute = models.ForeignKey(
        Dispute,
        on_delete=models.CASCADE,
        related_name='activities'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    activity_type = models.CharField(max_length=50)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Dispute activities'

    def __str__(self):
        return f"{self.activity_type} - {self.dispute.dispute_number}"

    @classmethod
    def log(cls, dispute, activity_type, description, user=None, metadata=None):
        """Create an activity log entry."""
        return cls.objects.create(
            dispute=dispute,
            user=user,
            activity_type=activity_type,
            description=description,
            metadata=metadata or {}
        )
