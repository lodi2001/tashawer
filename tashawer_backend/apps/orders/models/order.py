"""
Order model for managing work engagements.

An Order is created when a proposal is accepted and payment is confirmed.
It represents the active work engagement between client and consultant.
"""

import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.core.models import SoftDeleteModel


class OrderStatus(models.TextChoices):
    """Order status choices"""
    PENDING_PAYMENT = 'pending_payment', 'Pending Payment'
    CONFIRMED = 'confirmed', 'Confirmed'
    IN_PROGRESS = 'in_progress', 'In Progress'
    UNDER_REVIEW = 'under_review', 'Under Review'
    REVISION_REQUESTED = 'revision_requested', 'Revision Requested'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'
    DISPUTED = 'disputed', 'Disputed'


def generate_order_number():
    """Generate unique order number"""
    import random
    import string
    timestamp = timezone.now().strftime('%y%m%d')
    random_suffix = ''.join(random.choices(string.digits, k=4))
    return f'ORD-{timestamp}-{random_suffix}'


class Order(SoftDeleteModel):
    """
    Order model representing an active work engagement.

    Created when:
    1. Proposal is accepted
    2. Escrow is funded

    The Order tracks the entire lifecycle of the work from start to completion.
    """

    # Unique identifier
    order_number = models.CharField(
        max_length=30,
        unique=True,
        default=generate_order_number,
        help_text="Unique order reference number"
    )

    # Related entities
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.PROTECT,
        related_name='orders',
        help_text="The project this order is for"
    )
    proposal = models.OneToOneField(
        'proposals.Proposal',
        on_delete=models.PROTECT,
        related_name='order',
        help_text="The accepted proposal"
    )
    escrow = models.OneToOneField(
        'payments.Escrow',
        on_delete=models.PROTECT,
        related_name='order',
        null=True,
        blank=True,
        help_text="The escrow holding the funds"
    )

    # Parties
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='client_orders',
        help_text="The client who placed the order"
    )
    consultant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='consultant_orders',
        help_text="The consultant working on the order"
    )

    # Order details
    title = models.CharField(
        max_length=255,
        help_text="Order title (copied from project)"
    )
    description = models.TextField(
        blank=True,
        help_text="Order description/scope"
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Total order amount in SAR"
    )
    currency = models.CharField(
        max_length=3,
        default='SAR',
        help_text="Currency code"
    )

    # Timeline
    expected_delivery_date = models.DateField(
        help_text="Expected delivery date"
    )
    actual_delivery_date = models.DateField(
        blank=True,
        null=True,
        help_text="Actual delivery date"
    )
    deadline_extended = models.BooleanField(
        default=False,
        help_text="Whether deadline was extended"
    )
    original_delivery_date = models.DateField(
        blank=True,
        null=True,
        help_text="Original delivery date (if extended)"
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING_PAYMENT,
        help_text="Current order status"
    )

    # Progress tracking
    progress_percentage = models.PositiveSmallIntegerField(
        default=0,
        help_text="Overall completion percentage (0-100)"
    )

    # Revision tracking
    max_revisions = models.PositiveSmallIntegerField(
        default=2,
        help_text="Maximum number of revisions allowed"
    )
    revisions_used = models.PositiveSmallIntegerField(
        default=0,
        help_text="Number of revisions used"
    )

    # Notes
    client_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Notes from client"
    )
    consultant_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Notes from consultant"
    )

    # Timestamps
    confirmed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the order was confirmed (payment received)"
    )
    started_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When work started"
    )
    delivered_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the order was delivered for review"
    )
    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the order was completed"
    )
    cancelled_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the order was cancelled"
    )

    # Cancellation
    cancellation_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for cancellation"
    )
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_orders',
        help_text="User who cancelled the order"
    )

    class Meta:
        db_table = 'orders'
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['status']),
            models.Index(fields=['client']),
            models.Index(fields=['consultant']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['expected_delivery_date']),
        ]

    def __str__(self):
        return f"{self.order_number} - {self.title}"

    @property
    def is_active(self):
        """Check if order is in an active state"""
        return self.status in [
            OrderStatus.CONFIRMED,
            OrderStatus.IN_PROGRESS,
            OrderStatus.UNDER_REVIEW,
            OrderStatus.REVISION_REQUESTED,
        ]

    @property
    def can_cancel(self):
        """Check if order can be cancelled"""
        return self.status in [
            OrderStatus.PENDING_PAYMENT,
            OrderStatus.CONFIRMED,
            OrderStatus.IN_PROGRESS,
        ]

    @property
    def can_deliver(self):
        """Check if order can be delivered"""
        return self.status in [
            OrderStatus.CONFIRMED,
            OrderStatus.IN_PROGRESS,
            OrderStatus.REVISION_REQUESTED,
        ]

    @property
    def can_request_revision(self):
        """Check if client can request revision"""
        return (
            self.status == OrderStatus.UNDER_REVIEW and
            self.revisions_used < self.max_revisions
        )

    @property
    def is_overdue(self):
        """Check if order is overdue"""
        if self.status in [OrderStatus.COMPLETED, OrderStatus.CANCELLED]:
            return False
        return timezone.now().date() > self.expected_delivery_date

    def confirm(self):
        """Confirm order after payment"""
        if self.status == OrderStatus.PENDING_PAYMENT:
            self.status = OrderStatus.CONFIRMED
            self.confirmed_at = timezone.now()
            self.save(update_fields=['status', 'confirmed_at', 'updated_at'])

    def start_work(self):
        """Mark order as in progress"""
        if self.status == OrderStatus.CONFIRMED:
            self.status = OrderStatus.IN_PROGRESS
            self.started_at = timezone.now()
            self.save(update_fields=['status', 'started_at', 'updated_at'])

    def deliver(self):
        """Submit order for client review"""
        if self.can_deliver:
            self.status = OrderStatus.UNDER_REVIEW
            self.delivered_at = timezone.now()
            self.save(update_fields=['status', 'delivered_at', 'updated_at'])

    def request_revision(self, notes=None):
        """Client requests revision"""
        if self.can_request_revision:
            self.status = OrderStatus.REVISION_REQUESTED
            self.revisions_used += 1
            if notes:
                self.client_notes = notes
            self.save(update_fields=['status', 'revisions_used', 'client_notes', 'updated_at'])

    def complete(self):
        """Mark order as completed"""
        if self.status == OrderStatus.UNDER_REVIEW:
            self.status = OrderStatus.COMPLETED
            self.completed_at = timezone.now()
            self.actual_delivery_date = timezone.now().date()
            self.progress_percentage = 100
            self.save(update_fields=[
                'status', 'completed_at', 'actual_delivery_date',
                'progress_percentage', 'updated_at'
            ])

            # Release escrow if linked
            if self.escrow and self.escrow.can_release:
                self.escrow.release(note="Order completed")

    def cancel(self, user, reason=None):
        """Cancel the order"""
        if self.can_cancel:
            self.status = OrderStatus.CANCELLED
            self.cancelled_at = timezone.now()
            self.cancelled_by = user
            if reason:
                self.cancellation_reason = reason
            self.save(update_fields=[
                'status', 'cancelled_at', 'cancelled_by',
                'cancellation_reason', 'updated_at'
            ])

    def open_dispute(self):
        """Mark order as disputed"""
        if self.is_active:
            self.status = OrderStatus.DISPUTED
            self.save(update_fields=['status', 'updated_at'])

    def extend_deadline(self, new_date: 'date', reason=None):
        """Extend the delivery deadline"""
        if not self.deadline_extended:
            self.original_delivery_date = self.expected_delivery_date
        self.expected_delivery_date = new_date
        self.deadline_extended = True
        self.save(update_fields=[
            'expected_delivery_date', 'original_delivery_date',
            'deadline_extended', 'updated_at'
        ])

    def update_progress(self):
        """Calculate and update progress based on milestones"""
        milestones = self.milestones.all()
        if milestones.exists():
            total = milestones.count()
            completed = milestones.filter(status='completed').count()
            self.progress_percentage = int((completed / total) * 100)
            self.save(update_fields=['progress_percentage', 'updated_at'])

    @classmethod
    def create_from_proposal(cls, proposal, escrow=None):
        """Create an order from an accepted proposal"""
        from apps.proposals.models import ProposalStatus

        if proposal.status != ProposalStatus.ACCEPTED:
            raise ValueError("Can only create order from accepted proposal")

        order = cls.objects.create(
            project=proposal.project,
            proposal=proposal,
            escrow=escrow,
            client=proposal.project.client,
            consultant=proposal.consultant,
            title=proposal.project.title,
            description=proposal.project.description,
            amount=proposal.proposed_amount,
            expected_delivery_date=proposal.delivery_date,
            status=OrderStatus.PENDING_PAYMENT if not escrow else OrderStatus.CONFIRMED,
        )

        if escrow:
            order.confirmed_at = timezone.now()
            order.save(update_fields=['confirmed_at'])

        return order
