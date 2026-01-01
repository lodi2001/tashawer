from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.core.models import SoftDeleteModel


class EscrowStatus(models.TextChoices):
    """Escrow status choices"""
    PENDING = 'pending', 'Pending Payment'
    FUNDED = 'funded', 'Funded'
    HELD = 'held', 'Held in Escrow'
    RELEASED = 'released', 'Released to Consultant'
    REFUNDED = 'refunded', 'Refunded to Client'
    DISPUTED = 'disputed', 'Under Dispute'
    CANCELLED = 'cancelled', 'Cancelled'


class Escrow(SoftDeleteModel):
    """
    Escrow model for holding payments until project completion.
    Acts as an intermediary to protect both clients and consultants.
    """

    # Parties involved
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='escrows_as_client',
        help_text="Client who funds the escrow"
    )
    consultant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='escrows_as_consultant',
        help_text="Consultant who receives the payment"
    )

    # Related objects
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.PROTECT,
        related_name='escrows',
        help_text="Project this escrow is for"
    )
    proposal = models.ForeignKey(
        'proposals.Proposal',
        on_delete=models.PROTECT,
        related_name='escrows',
        help_text="Accepted proposal for this escrow"
    )

    # Financial details
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Total escrow amount in SAR"
    )
    platform_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Platform fee amount in SAR"
    )
    consultant_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Amount consultant will receive (amount - platform_fee)"
    )
    currency = models.CharField(
        max_length=3,
        default='SAR',
        help_text="Currency code"
    )

    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=EscrowStatus.choices,
        default=EscrowStatus.PENDING,
        help_text="Current escrow status"
    )

    # Reference
    escrow_reference = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique escrow reference number"
    )

    # Timestamps
    funded_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the escrow was funded"
    )
    released_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When funds were released to consultant"
    )
    refunded_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When funds were refunded to client"
    )

    # Notes
    release_note = models.TextField(
        blank=True,
        null=True,
        help_text="Note when releasing payment"
    )
    refund_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for refund"
    )

    class Meta:
        db_table = 'escrows'
        verbose_name = 'Escrow'
        verbose_name_plural = 'Escrows'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['client']),
            models.Index(fields=['consultant']),
            models.Index(fields=['project']),
            models.Index(fields=['escrow_reference']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Escrow {self.escrow_reference} - {self.amount} {self.currency}"

    def save(self, *args, **kwargs):
        if not self.escrow_reference:
            import uuid
            self.escrow_reference = f"ESC-{uuid.uuid4().hex[:12].upper()}"
        # Calculate consultant amount if not set
        if not self.consultant_amount:
            self.consultant_amount = self.amount - self.platform_fee
        super().save(*args, **kwargs)

    @property
    def can_release(self):
        """Check if escrow can be released"""
        return self.status in [EscrowStatus.FUNDED, EscrowStatus.HELD]

    @property
    def can_refund(self):
        """Check if escrow can be refunded"""
        return self.status in [EscrowStatus.FUNDED, EscrowStatus.HELD, EscrowStatus.DISPUTED]

    def fund(self):
        """Mark escrow as funded"""
        if self.status == EscrowStatus.PENDING:
            self.status = EscrowStatus.FUNDED
            self.funded_at = timezone.now()
            self.save(update_fields=['status', 'funded_at', 'updated_at'])

    def hold(self):
        """Move to held status (after verification)"""
        if self.status == EscrowStatus.FUNDED:
            self.status = EscrowStatus.HELD
            self.save(update_fields=['status', 'updated_at'])

    def release(self, note=None):
        """Release funds to consultant"""
        from .transaction import Transaction, TransactionType, TransactionStatus

        if self.can_release:
            self.status = EscrowStatus.RELEASED
            self.released_at = timezone.now()
            if note:
                self.release_note = note
            self.save(update_fields=['status', 'released_at', 'release_note', 'updated_at'])

            # Create release transaction
            Transaction.objects.create(
                payer=self.client,
                payee=self.consultant,
                transaction_type=TransactionType.ESCROW_RELEASE,
                status=TransactionStatus.COMPLETED,
                amount=self.consultant_amount,
                currency=self.currency,
                project=self.project,
                proposal=self.proposal,
                escrow=self,
                description=f"Escrow release for project: {self.project.title}",
                completed_at=timezone.now()
            )

            # Create platform fee transaction if applicable
            if self.platform_fee > 0:
                Transaction.objects.create(
                    payer=self.consultant,
                    payee=None,  # Platform
                    transaction_type=TransactionType.PLATFORM_FEE,
                    status=TransactionStatus.COMPLETED,
                    amount=self.platform_fee,
                    currency=self.currency,
                    project=self.project,
                    proposal=self.proposal,
                    escrow=self,
                    description=f"Platform fee for project: {self.project.title}",
                    completed_at=timezone.now()
                )

            return True
        return False

    def refund(self, reason=None):
        """Refund funds to client"""
        from .transaction import Transaction, TransactionType, TransactionStatus

        if self.can_refund:
            self.status = EscrowStatus.REFUNDED
            self.refunded_at = timezone.now()
            if reason:
                self.refund_reason = reason
            self.save(update_fields=['status', 'refunded_at', 'refund_reason', 'updated_at'])

            # Create refund transaction
            Transaction.objects.create(
                payer=self.client,
                payee=self.client,
                transaction_type=TransactionType.REFUND,
                status=TransactionStatus.COMPLETED,
                amount=self.amount,
                currency=self.currency,
                project=self.project,
                proposal=self.proposal,
                escrow=self,
                description=f"Escrow refund for project: {self.project.title}",
                completed_at=timezone.now()
            )

            return True
        return False

    def dispute(self):
        """Mark escrow as disputed"""
        if self.status in [EscrowStatus.FUNDED, EscrowStatus.HELD]:
            self.status = EscrowStatus.DISPUTED
            self.save(update_fields=['status', 'updated_at'])
