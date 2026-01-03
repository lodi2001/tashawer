"""
Milestone model for tracking order progress and deliverables.

Milestones break down an order into trackable phases with specific
deliverables and deadlines.
"""

import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.core.models import SoftDeleteModel


class MilestoneStatus(models.TextChoices):
    """Milestone status choices"""
    PENDING = 'pending', 'Pending'
    IN_PROGRESS = 'in_progress', 'In Progress'
    SUBMITTED = 'submitted', 'Submitted for Review'
    REVISION_REQUESTED = 'revision_requested', 'Revision Requested'
    APPROVED = 'approved', 'Approved'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'


class Milestone(SoftDeleteModel):
    """
    Milestone model for order progress tracking.

    Each milestone represents a phase of work with:
    - Specific deliverables
    - Due date
    - Optional payment amount (for milestone-based payment)
    """

    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='milestones',
        help_text="The order this milestone belongs to"
    )

    # Milestone details
    title = models.CharField(
        max_length=255,
        help_text="Milestone title"
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed description of milestone deliverables"
    )
    sequence = models.PositiveSmallIntegerField(
        default=1,
        help_text="Order of this milestone (for display)"
    )

    # Timeline
    due_date = models.DateField(
        help_text="Milestone due date"
    )
    completed_date = models.DateField(
        blank=True,
        null=True,
        help_text="Actual completion date"
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=MilestoneStatus.choices,
        default=MilestoneStatus.PENDING,
        help_text="Current milestone status"
    )

    # Payment (for milestone-based payments)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Milestone payment amount (if using milestone payments)"
    )
    is_paid = models.BooleanField(
        default=False,
        help_text="Whether payment has been released for this milestone"
    )
    paid_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When payment was released"
    )

    # Feedback
    client_feedback = models.TextField(
        blank=True,
        null=True,
        help_text="Client feedback on milestone"
    )
    consultant_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Consultant notes on milestone"
    )

    # Approval
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_milestones',
        help_text="User who approved this milestone"
    )
    approved_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the milestone was approved"
    )

    # Submission
    submitted_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When consultant submitted for review"
    )

    class Meta:
        db_table = 'milestones'
        verbose_name = 'Milestone'
        verbose_name_plural = 'Milestones'
        ordering = ['sequence', 'due_date']
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['status']),
            models.Index(fields=['due_date']),
            models.Index(fields=['sequence']),
        ]

    def __str__(self):
        return f"{self.order.order_number} - {self.sequence}. {self.title}"

    @property
    def is_overdue(self):
        """Check if milestone is overdue"""
        if self.status in [MilestoneStatus.COMPLETED, MilestoneStatus.CANCELLED]:
            return False
        return timezone.now().date() > self.due_date

    @property
    def can_start(self):
        """Check if milestone can be started"""
        return self.status == MilestoneStatus.PENDING

    @property
    def can_submit(self):
        """Check if milestone can be submitted for review"""
        return self.status in [MilestoneStatus.IN_PROGRESS, MilestoneStatus.REVISION_REQUESTED]

    @property
    def can_approve(self):
        """Check if milestone can be approved"""
        return self.status == MilestoneStatus.SUBMITTED

    @property
    def can_request_revision(self):
        """Check if revision can be requested"""
        return self.status == MilestoneStatus.SUBMITTED

    def start(self):
        """Start working on milestone"""
        if self.can_start:
            self.status = MilestoneStatus.IN_PROGRESS
            self.save(update_fields=['status', 'updated_at'])

            # Update order status if needed
            from .order import OrderStatus
            if self.order.status == OrderStatus.CONFIRMED:
                self.order.start_work()

    def submit(self, notes=None):
        """Submit milestone for client review"""
        if self.can_submit:
            self.status = MilestoneStatus.SUBMITTED
            self.submitted_at = timezone.now()
            if notes:
                self.consultant_notes = notes
            self.save(update_fields=['status', 'submitted_at', 'consultant_notes', 'updated_at'])

    def request_revision(self, feedback=None):
        """Client requests revision on milestone"""
        if self.can_request_revision:
            self.status = MilestoneStatus.REVISION_REQUESTED
            if feedback:
                self.client_feedback = feedback
            self.save(update_fields=['status', 'client_feedback', 'updated_at'])

    def approve(self, user):
        """Client approves milestone"""
        if self.can_approve:
            self.status = MilestoneStatus.APPROVED
            self.approved_by = user
            self.approved_at = timezone.now()
            self.save(update_fields=['status', 'approved_by', 'approved_at', 'updated_at'])

    def complete(self, user=None):
        """Mark milestone as completed"""
        if self.status == MilestoneStatus.APPROVED:
            self.status = MilestoneStatus.COMPLETED
            self.completed_date = timezone.now().date()
            if user and not self.approved_by:
                self.approved_by = user
                self.approved_at = timezone.now()
            self.save(update_fields=[
                'status', 'completed_date', 'approved_by', 'approved_at', 'updated_at'
            ])

            # Update order progress
            self.order.update_progress()

    def cancel(self):
        """Cancel milestone"""
        if self.status not in [MilestoneStatus.COMPLETED, MilestoneStatus.CANCELLED]:
            self.status = MilestoneStatus.CANCELLED
            self.save(update_fields=['status', 'updated_at'])

    def release_payment(self):
        """Release payment for this milestone"""
        if self.status == MilestoneStatus.COMPLETED and self.amount > 0 and not self.is_paid:
            self.is_paid = True
            self.paid_at = timezone.now()
            self.save(update_fields=['is_paid', 'paid_at', 'updated_at'])


def deliverable_upload_path(instance, filename):
    """Generate upload path for deliverables"""
    return f'orders/{instance.milestone.order.id}/milestones/{instance.milestone.id}/deliverables/{filename}'


class Deliverable(SoftDeleteModel):
    """
    Deliverable file attached to a milestone.

    Consultants upload deliverables as proof of work completion.
    """

    milestone = models.ForeignKey(
        Milestone,
        on_delete=models.CASCADE,
        related_name='deliverables',
        help_text="The milestone this deliverable belongs to"
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_deliverables',
        help_text="User who uploaded this file"
    )

    # File info
    file = models.FileField(
        upload_to=deliverable_upload_path,
        help_text="Uploaded file"
    )
    original_filename = models.CharField(
        max_length=255,
        help_text="Original filename"
    )
    file_size = models.PositiveIntegerField(
        help_text="File size in bytes"
    )
    file_type = models.CharField(
        max_length=100,
        help_text="File MIME type"
    )

    # Metadata
    title = models.CharField(
        max_length=255,
        blank=True,
        help_text="Title/description of deliverable"
    )
    version = models.PositiveSmallIntegerField(
        default=1,
        help_text="Version number"
    )
    is_final = models.BooleanField(
        default=False,
        help_text="Whether this is the final version"
    )

    class Meta:
        db_table = 'deliverables'
        verbose_name = 'Deliverable'
        verbose_name_plural = 'Deliverables'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['milestone']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.original_filename} (v{self.version})"

    @property
    def file_size_display(self):
        """Return human-readable file size"""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"


class OrderActivity(models.Model):
    """
    Activity log for orders.

    Tracks all changes and events on an order for audit purposes.
    """

    ORDER_ACTIVITY_TYPES = [
        ('created', 'Order Created'),
        ('confirmed', 'Order Confirmed'),
        ('started', 'Work Started'),
        ('milestone_created', 'Milestone Created'),
        ('milestone_started', 'Milestone Started'),
        ('milestone_submitted', 'Milestone Submitted'),
        ('milestone_approved', 'Milestone Approved'),
        ('milestone_revision', 'Revision Requested'),
        ('milestone_completed', 'Milestone Completed'),
        ('deliverable_uploaded', 'Deliverable Uploaded'),
        ('delivered', 'Order Delivered'),
        ('revision_requested', 'Revision Requested'),
        ('completed', 'Order Completed'),
        ('cancelled', 'Order Cancelled'),
        ('disputed', 'Dispute Opened'),
        ('deadline_extended', 'Deadline Extended'),
        ('message', 'Message'),
        ('note', 'Note Added'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='activities',
        help_text="The order this activity belongs to"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_activities',
        help_text="User who performed the activity"
    )
    activity_type = models.CharField(
        max_length=30,
        choices=ORDER_ACTIVITY_TYPES,
        help_text="Type of activity"
    )
    description = models.TextField(
        blank=True,
        help_text="Activity description"
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this activity occurred"
    )

    class Meta:
        db_table = 'order_activities'
        verbose_name = 'Order Activity'
        verbose_name_plural = 'Order Activities'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['activity_type']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.order.order_number} - {self.activity_type}"

    @classmethod
    def log(cls, order, activity_type, user=None, description='', metadata=None):
        """Create an activity log entry"""
        return cls.objects.create(
            order=order,
            user=user,
            activity_type=activity_type,
            description=description,
            metadata=metadata or {}
        )
