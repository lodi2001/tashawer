from django.db import models, transaction as db_transaction
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.core.models import SoftDeleteModel
from decimal import Decimal


class WithdrawalStatus(models.TextChoices):
    """Withdrawal status choices"""
    PENDING = 'pending', 'Pending Approval'
    APPROVED = 'approved', 'Approved'
    PROCESSING = 'processing', 'Processing'
    COMPLETED = 'completed', 'Completed'
    REJECTED = 'rejected', 'Rejected'
    CANCELLED = 'cancelled', 'Cancelled'


class BankAccount(SoftDeleteModel):
    """
    Bank account model for storing user bank details.
    Used for withdrawal payouts.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bank_accounts',
        help_text="Owner of this bank account"
    )

    # Bank details
    bank_name = models.CharField(
        max_length=100,
        help_text="Name of the bank"
    )
    bank_name_ar = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Bank name in Arabic"
    )
    account_holder_name = models.CharField(
        max_length=255,
        help_text="Name on the bank account"
    )
    iban = models.CharField(
        max_length=34,
        help_text="International Bank Account Number"
    )
    swift_code = models.CharField(
        max_length=11,
        blank=True,
        null=True,
        help_text="SWIFT/BIC code"
    )
    account_number = models.CharField(
        max_length=30,
        blank=True,
        null=True,
        help_text="Bank account number (if different from IBAN)"
    )

    # Status
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether this bank account has been verified"
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Whether this is the primary bank account"
    )

    # Verification
    verified_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the account was verified"
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_bank_accounts',
        help_text="Admin who verified this account"
    )

    class Meta:
        db_table = 'bank_accounts'
        verbose_name = 'Bank Account'
        verbose_name_plural = 'Bank Accounts'
        ordering = ['-is_primary', '-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['iban']),
            models.Index(fields=['is_verified']),
        ]

    def __str__(self):
        return f"{self.bank_name} - {self.iban[-4:]}"

    def save(self, *args, **kwargs):
        # Normalize IBAN (remove spaces, uppercase)
        if self.iban:
            self.iban = self.iban.replace(' ', '').upper()

        # If this is set as primary, unset other primary accounts
        if self.is_primary:
            BankAccount.objects.filter(
                user=self.user,
                is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)

        super().save(*args, **kwargs)

    def verify(self, admin_user):
        """Mark bank account as verified"""
        self.is_verified = True
        self.verified_at = timezone.now()
        self.verified_by = admin_user
        self.save(update_fields=['is_verified', 'verified_at', 'verified_by', 'updated_at'])


class Withdrawal(SoftDeleteModel):
    """
    Withdrawal model for tracking consultant payout requests.
    Requires admin approval before processing.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='withdrawals',
        help_text="User requesting withdrawal"
    )
    wallet = models.ForeignKey(
        'payments.Wallet',
        on_delete=models.PROTECT,
        related_name='withdrawals',
        help_text="Wallet to withdraw from"
    )
    bank_account = models.ForeignKey(
        BankAccount,
        on_delete=models.PROTECT,
        related_name='withdrawals',
        help_text="Bank account to receive funds"
    )

    # Amount
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Withdrawal amount in SAR"
    )
    fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Withdrawal fee (if any)"
    )
    net_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Net amount to be transferred (amount - fee)"
    )
    currency = models.CharField(
        max_length=3,
        default='SAR',
        help_text="Currency code"
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=WithdrawalStatus.choices,
        default=WithdrawalStatus.PENDING,
        help_text="Current withdrawal status"
    )

    # Reference
    reference_number = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique withdrawal reference number"
    )

    # Bank transfer details
    bank_reference = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Bank transfer reference number"
    )
    transfer_receipt = models.FileField(
        upload_to='withdrawals/receipts/',
        blank=True,
        null=True,
        help_text="Bank transfer receipt"
    )

    # Admin workflow
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_withdrawals',
        help_text="Admin who reviewed this withdrawal"
    )
    reviewed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the withdrawal was reviewed"
    )
    rejection_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for rejection (if rejected)"
    )

    # Timestamps
    approved_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the withdrawal was approved"
    )
    processed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the withdrawal started processing"
    )
    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the withdrawal was completed"
    )

    # Notes
    user_note = models.TextField(
        blank=True,
        null=True,
        help_text="Note from user"
    )
    admin_note = models.TextField(
        blank=True,
        null=True,
        help_text="Internal admin note"
    )

    class Meta:
        db_table = 'withdrawals'
        verbose_name = 'Withdrawal'
        verbose_name_plural = 'Withdrawals'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['wallet']),
            models.Index(fields=['status']),
            models.Index(fields=['reference_number']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Withdrawal {self.reference_number} - {self.amount} {self.currency}"

    def save(self, *args, **kwargs):
        if not self.reference_number:
            import uuid
            self.reference_number = f"WDR-{uuid.uuid4().hex[:12].upper()}"

        # Calculate net amount if not set
        if not self.net_amount:
            self.net_amount = self.amount - self.fee

        super().save(*args, **kwargs)

    def clean(self):
        """Validate withdrawal"""
        if self.amount <= 0:
            raise ValidationError("Withdrawal amount must be positive")

        if self.amount < Decimal('100'):
            raise ValidationError("Minimum withdrawal amount is 100 SAR")

        if self.wallet and self.amount > self.wallet.balance:
            raise ValidationError("Insufficient wallet balance")

    @db_transaction.atomic
    def approve(self, admin_user, note=None):
        """Approve the withdrawal request"""
        from .wallet import Wallet

        if self.status != WithdrawalStatus.PENDING:
            raise ValidationError("Only pending withdrawals can be approved")

        # Lock wallet and verify balance
        wallet = Wallet.objects.select_for_update().get(pk=self.wallet.pk)
        if wallet.balance < self.amount:
            raise ValidationError("Insufficient wallet balance")

        # Debit wallet
        wallet.balance -= self.amount
        wallet.total_withdrawn += self.amount
        wallet.save(update_fields=['balance', 'total_withdrawn', 'updated_at'])

        # Update withdrawal status
        self.status = WithdrawalStatus.APPROVED
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.approved_at = timezone.now()
        if note:
            self.admin_note = note
        self.save(update_fields=[
            'status', 'reviewed_by', 'reviewed_at', 'approved_at', 'admin_note', 'updated_at'
        ])

        # Update wallet reference
        self.wallet = wallet

        return True

    def reject(self, admin_user, reason):
        """Reject the withdrawal request"""
        if self.status != WithdrawalStatus.PENDING:
            raise ValidationError("Only pending withdrawals can be rejected")

        self.status = WithdrawalStatus.REJECTED
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.rejection_reason = reason
        self.save(update_fields=[
            'status', 'reviewed_by', 'reviewed_at', 'rejection_reason', 'updated_at'
        ])

        return True

    def start_processing(self):
        """Mark withdrawal as processing"""
        if self.status != WithdrawalStatus.APPROVED:
            raise ValidationError("Only approved withdrawals can be processed")

        self.status = WithdrawalStatus.PROCESSING
        self.processed_at = timezone.now()
        self.save(update_fields=['status', 'processed_at', 'updated_at'])

        return True

    @db_transaction.atomic
    def complete(self, bank_reference=None, receipt=None):
        """Complete the withdrawal"""
        from .transaction import Transaction, TransactionType, TransactionStatus

        if self.status != WithdrawalStatus.PROCESSING:
            raise ValidationError("Only processing withdrawals can be completed")

        self.status = WithdrawalStatus.COMPLETED
        self.completed_at = timezone.now()
        if bank_reference:
            self.bank_reference = bank_reference
        if receipt:
            self.transfer_receipt = receipt
        self.save(update_fields=[
            'status', 'completed_at', 'bank_reference', 'transfer_receipt', 'updated_at'
        ])

        # Create transaction record
        Transaction.objects.create(
            payer=self.user,
            payee=self.user,
            transaction_type=TransactionType.WITHDRAWAL,
            status=TransactionStatus.COMPLETED,
            amount=self.amount,
            currency=self.currency,
            description=f"Wallet withdrawal to {self.bank_account.bank_name}",
            completed_at=timezone.now()
        )

        return True

    @db_transaction.atomic
    def cancel(self):
        """Cancel the withdrawal (refund if already approved)"""
        from .wallet import Wallet

        if self.status == WithdrawalStatus.COMPLETED:
            raise ValidationError("Completed withdrawals cannot be cancelled")

        if self.status == WithdrawalStatus.CANCELLED:
            raise ValidationError("Withdrawal is already cancelled")

        # If approved/processing, refund to wallet
        if self.status in [WithdrawalStatus.APPROVED, WithdrawalStatus.PROCESSING]:
            wallet = Wallet.objects.select_for_update().get(pk=self.wallet.pk)
            wallet.balance += self.amount
            wallet.total_withdrawn -= self.amount
            wallet.save(update_fields=['balance', 'total_withdrawn', 'updated_at'])

        self.status = WithdrawalStatus.CANCELLED
        self.save(update_fields=['status', 'updated_at'])

        return True
