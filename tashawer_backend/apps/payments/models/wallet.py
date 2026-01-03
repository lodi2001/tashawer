from django.db import models, transaction as db_transaction
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.core.models import SoftDeleteModel
from decimal import Decimal


class WalletStatus(models.TextChoices):
    """Wallet status choices"""
    ACTIVE = 'active', 'Active'
    FROZEN = 'frozen', 'Frozen'
    SUSPENDED = 'suspended', 'Suspended'


class DepositStatus(models.TextChoices):
    """Deposit status choices"""
    PENDING = 'pending', 'Pending'
    PROCESSING = 'processing', 'Processing'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    CANCELLED = 'cancelled', 'Cancelled'


class Wallet(SoftDeleteModel):
    """
    Wallet model for managing user balances.
    Each user has one wallet that tracks their available balance.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='wallet',
        help_text="Owner of this wallet"
    )

    # Balance tracking
    balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Current available balance in SAR"
    )
    pending_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Balance pending clearance in SAR"
    )
    currency = models.CharField(
        max_length=3,
        default='SAR',
        help_text="Wallet currency"
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=WalletStatus.choices,
        default=WalletStatus.ACTIVE,
        help_text="Current wallet status"
    )

    # Statistics
    total_deposited = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total amount deposited over time"
    )
    total_withdrawn = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total amount withdrawn over time"
    )
    total_earned = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total earnings from projects"
    )
    total_spent = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total spent on projects"
    )

    class Meta:
        db_table = 'wallets'
        verbose_name = 'Wallet'
        verbose_name_plural = 'Wallets'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Wallet {self.user.email} - {self.balance} {self.currency}"

    @property
    def is_active(self):
        """Check if wallet is active"""
        return self.status == WalletStatus.ACTIVE

    @property
    def available_balance(self):
        """Get available balance (total balance minus pending)"""
        return self.balance

    def can_debit(self, amount):
        """Check if wallet has sufficient balance for debit"""
        return self.is_active and self.balance >= Decimal(str(amount))

    @db_transaction.atomic
    def credit(self, amount, description=None):
        """
        Add funds to wallet balance.
        Used for deposits and earnings.
        """
        if not self.is_active:
            raise ValidationError("Wallet is not active")

        amount = Decimal(str(amount))
        if amount <= 0:
            raise ValidationError("Credit amount must be positive")

        # Lock the wallet row for update
        wallet = Wallet.objects.select_for_update().get(pk=self.pk)
        wallet.balance += amount
        wallet.save(update_fields=['balance', 'updated_at'])

        # Update self to reflect changes
        self.balance = wallet.balance
        return True

    @db_transaction.atomic
    def debit(self, amount, description=None):
        """
        Remove funds from wallet balance.
        Used for payments and withdrawals.
        """
        if not self.is_active:
            raise ValidationError("Wallet is not active")

        amount = Decimal(str(amount))
        if amount <= 0:
            raise ValidationError("Debit amount must be positive")

        # Lock the wallet row for update
        wallet = Wallet.objects.select_for_update().get(pk=self.pk)
        if wallet.balance < amount:
            raise ValidationError("Insufficient balance")

        wallet.balance -= amount
        wallet.save(update_fields=['balance', 'updated_at'])

        # Update self to reflect changes
        self.balance = wallet.balance
        return True

    def freeze(self, reason=None):
        """Freeze the wallet"""
        self.status = WalletStatus.FROZEN
        self.save(update_fields=['status', 'updated_at'])

    def unfreeze(self):
        """Unfreeze the wallet"""
        if self.status == WalletStatus.FROZEN:
            self.status = WalletStatus.ACTIVE
            self.save(update_fields=['status', 'updated_at'])

    @classmethod
    def get_or_create_wallet(cls, user):
        """Get user's wallet or create one if it doesn't exist"""
        wallet, created = cls.objects.get_or_create(user=user)
        return wallet


class Deposit(SoftDeleteModel):
    """
    Deposit model for tracking wallet deposits.
    Records each deposit attempt and its status.
    """

    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.PROTECT,
        related_name='deposits',
        help_text="Wallet to deposit into"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='deposits',
        help_text="User making the deposit"
    )

    # Amount
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Deposit amount in SAR"
    )
    currency = models.CharField(
        max_length=3,
        default='SAR',
        help_text="Currency code"
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=DepositStatus.choices,
        default=DepositStatus.PENDING,
        help_text="Current deposit status"
    )

    # Payment gateway details
    payment_method = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Payment method used"
    )
    gateway_charge_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Charge ID from payment gateway"
    )
    gateway_response = models.JSONField(
        blank=True,
        null=True,
        help_text="Raw response from payment gateway"
    )

    # Reference
    reference_number = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique deposit reference number"
    )

    # Timestamps
    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the deposit was completed"
    )

    # Notes
    failure_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for failure if failed"
    )

    class Meta:
        db_table = 'deposits'
        verbose_name = 'Deposit'
        verbose_name_plural = 'Deposits'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['wallet']),
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['reference_number']),
            models.Index(fields=['gateway_charge_id']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Deposit {self.reference_number} - {self.amount} {self.currency}"

    def save(self, *args, **kwargs):
        if not self.reference_number:
            import uuid
            self.reference_number = f"DEP-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)

    @db_transaction.atomic
    def complete(self, gateway_response=None):
        """
        Mark deposit as completed and credit wallet.
        """
        from .transaction import Transaction, TransactionType, TransactionStatus

        if self.status != DepositStatus.PROCESSING:
            raise ValidationError("Deposit must be in processing state to complete")

        # Update deposit status
        self.status = DepositStatus.COMPLETED
        self.completed_at = timezone.now()
        if gateway_response:
            self.gateway_response = gateway_response
        self.save(update_fields=['status', 'completed_at', 'gateway_response', 'updated_at'])

        # Credit wallet
        self.wallet.credit(self.amount)

        # Update wallet statistics
        wallet = Wallet.objects.select_for_update().get(pk=self.wallet.pk)
        wallet.total_deposited += self.amount
        wallet.save(update_fields=['total_deposited', 'updated_at'])

        # Create transaction record
        Transaction.objects.create(
            payer=self.user,
            payee=self.user,
            transaction_type=TransactionType.DEPOSIT,
            status=TransactionStatus.COMPLETED,
            amount=self.amount,
            currency=self.currency,
            payment_method=self.payment_method,
            gateway_transaction_id=self.gateway_charge_id,
            gateway_response=gateway_response,
            description=f"Wallet deposit",
            completed_at=timezone.now()
        )

        return True

    def fail(self, reason=None, gateway_response=None):
        """Mark deposit as failed"""
        self.status = DepositStatus.FAILED
        self.failure_reason = reason
        if gateway_response:
            self.gateway_response = gateway_response
        self.save(update_fields=['status', 'failure_reason', 'gateway_response', 'updated_at'])

    def cancel(self):
        """Cancel the deposit"""
        if self.status == DepositStatus.PENDING:
            self.status = DepositStatus.CANCELLED
            self.save(update_fields=['status', 'updated_at'])
