from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.core.models import SoftDeleteModel


class ProposalStatus(models.TextChoices):
    """Proposal status choices"""
    DRAFT = 'draft', 'Draft'
    SUBMITTED = 'submitted', 'Submitted'
    UNDER_REVIEW = 'under_review', 'Under Review'
    ACCEPTED = 'accepted', 'Accepted'
    REJECTED = 'rejected', 'Rejected'
    WITHDRAWN = 'withdrawn', 'Withdrawn'


class Proposal(SoftDeleteModel):
    """
    Proposal model for consultant bids on projects.
    Consultants submit proposals to open projects.
    """

    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='proposals',
        help_text="The project this proposal is for"
    )
    consultant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='proposals',
        help_text="The consultant submitting this proposal"
    )
    cover_letter = models.TextField(
        help_text="Consultant's introduction and approach"
    )
    proposed_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Proposed price in SAR"
    )
    estimated_duration = models.PositiveIntegerField(
        help_text="Estimated duration in days"
    )
    delivery_date = models.DateField(
        help_text="Proposed delivery date"
    )
    status = models.CharField(
        max_length=20,
        choices=ProposalStatus.choices,
        default=ProposalStatus.DRAFT,
        help_text="Current proposal status"
    )

    # Optional fields
    rejection_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for rejection (if rejected)"
    )

    # Tracking fields
    submitted_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the proposal was submitted"
    )
    reviewed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the proposal was reviewed (accepted/rejected)"
    )

    class Meta:
        db_table = 'proposals'
        verbose_name = 'Proposal'
        verbose_name_plural = 'Proposals'
        ordering = ['-created_at']
        # One proposal per consultant per project
        constraints = [
            models.UniqueConstraint(
                fields=['project', 'consultant'],
                name='unique_proposal_per_consultant_per_project'
            )
        ]
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['project']),
            models.Index(fields=['consultant']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Proposal by {self.consultant} for {self.project.title}"

    @property
    def is_editable(self):
        """Check if proposal can be edited"""
        return self.status in [ProposalStatus.DRAFT, ProposalStatus.SUBMITTED]

    @property
    def can_withdraw(self):
        """Check if proposal can be withdrawn"""
        return self.status in [ProposalStatus.DRAFT, ProposalStatus.SUBMITTED, ProposalStatus.UNDER_REVIEW]

    def submit(self):
        """Submit the proposal"""
        if self.status == ProposalStatus.DRAFT:
            self.status = ProposalStatus.SUBMITTED
            self.submitted_at = timezone.now()
            self.save(update_fields=['status', 'submitted_at', 'updated_at'])

    def accept(self):
        """Accept the proposal"""
        from apps.projects.models import ProjectStatus

        if self.status in [ProposalStatus.SUBMITTED, ProposalStatus.UNDER_REVIEW]:
            self.status = ProposalStatus.ACCEPTED
            self.reviewed_at = timezone.now()
            self.save(update_fields=['status', 'reviewed_at', 'updated_at'])

            # Update project status and assign consultant
            self.project.status = ProjectStatus.IN_PROGRESS
            self.project.save(update_fields=['status', 'updated_at'])

            # Reject all other proposals for this project
            Proposal.objects.filter(
                project=self.project
            ).exclude(
                id=self.id
            ).update(
                status=ProposalStatus.REJECTED,
                reviewed_at=timezone.now()
            )

    def reject(self, reason=None):
        """Reject the proposal"""
        if self.status in [ProposalStatus.SUBMITTED, ProposalStatus.UNDER_REVIEW]:
            self.status = ProposalStatus.REJECTED
            self.reviewed_at = timezone.now()
            if reason:
                self.rejection_reason = reason
            self.save(update_fields=['status', 'reviewed_at', 'rejection_reason', 'updated_at'])

    def withdraw(self):
        """Withdraw the proposal"""
        if self.can_withdraw:
            self.status = ProposalStatus.WITHDRAWN
            self.save(update_fields=['status', 'updated_at'])
