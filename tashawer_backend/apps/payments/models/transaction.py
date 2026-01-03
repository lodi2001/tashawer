from django.db import models
from django.conf import settings
from apps.core.models import SoftDeleteModel


class TransactionType(models.TextChoices):
    """Transaction type choices"""
    PAYMENT = 'payment', 'Payment'
    DEPOSIT = 'deposit', 'Deposit'
    WITHDRAWAL = 'withdrawal', 'Withdrawal'
    ESCROW_HOLD = 'escrow_hold', 'Escrow Hold'
    ESCROW_RELEASE = 'escrow_release', 'Escrow Release'
    REFUND = 'refund', 'Refund'
    PLATFORM_FEE = 'platform_fee', 'Platform Fee'


class TransactionStatus(models.TextChoices):
    """Transaction status choices"""
    PENDING = 'pending', 'Pending'
    PROCESSING = 'processing', 'Processing'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    CANCELLED = 'cancelled', 'Cancelled'
    REFUNDED = 'refunded', 'Refunded'


class PaymentMethod(models.TextChoices):
    """Payment method choices"""
    CREDIT_CARD = 'credit_card', 'Credit Card'
    DEBIT_CARD = 'debit_card', 'Debit Card'
    BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
    MADA = 'mada', 'Mada'
    APPLE_PAY = 'apple_pay', 'Apple Pay'
    STC_PAY = 'stc_pay', 'STC Pay'


class Transaction(SoftDeleteModel):
    """
    Transaction model for tracking all payment transactions.
    Records every monetary movement in the system.
    """

    # Transaction parties
    payer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='payments_made',
        help_text="User making the payment"
    )
    payee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='payments_received',
        null=True,
        blank=True,
        help_text="User receiving the payment (null for platform fees)"
    )

    # Transaction details
    transaction_type = models.CharField(
        max_length=20,
        choices=TransactionType.choices,
        help_text="Type of transaction"
    )
    status = models.CharField(
        max_length=20,
        choices=TransactionStatus.choices,
        default=TransactionStatus.PENDING,
        help_text="Current transaction status"
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Transaction amount in SAR"
    )
    currency = models.CharField(
        max_length=3,
        default='SAR',
        help_text="Currency code"
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        null=True,
        blank=True,
        help_text="Payment method used"
    )

    # Related objects
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
        help_text="Related project"
    )
    proposal = models.ForeignKey(
        'proposals.Proposal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
        help_text="Related proposal"
    )
    escrow = models.ForeignKey(
        'payments.Escrow',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
        help_text="Related escrow"
    )

    # Payment gateway details
    gateway_transaction_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Transaction ID from payment gateway"
    )
    gateway_response = models.JSONField(
        blank=True,
        null=True,
        help_text="Raw response from payment gateway"
    )

    # Metadata
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Transaction description"
    )
    reference_number = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique reference number for the transaction"
    )
    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the transaction was completed"
    )

    class Meta:
        db_table = 'transactions'
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['transaction_type']),
            models.Index(fields=['payer']),
            models.Index(fields=['payee']),
            models.Index(fields=['reference_number']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.reference_number} - {self.transaction_type} - {self.amount} {self.currency}"

    def save(self, *args, **kwargs):
        if not self.reference_number:
            import uuid
            self.reference_number = f"TXN-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)
