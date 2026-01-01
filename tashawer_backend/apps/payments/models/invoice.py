from django.db import models
from django.conf import settings
from apps.core.models import SoftDeleteModel


class InvoiceStatus(models.TextChoices):
    """Invoice status choices"""
    DRAFT = 'draft', 'Draft'
    ISSUED = 'issued', 'Issued'
    PAID = 'paid', 'Paid'
    CANCELLED = 'cancelled', 'Cancelled'


class InvoiceType(models.TextChoices):
    """Invoice type choices"""
    CLIENT_PAYMENT = 'client_payment', 'Client Payment'
    CONSULTANT_PAYOUT = 'consultant_payout', 'Consultant Payout'
    PLATFORM_FEE = 'platform_fee', 'Platform Fee'


class Invoice(SoftDeleteModel):
    """
    Invoice model for generating payment documentation.
    """

    # Invoice parties
    issued_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='invoices_received',
        help_text="User the invoice is issued to"
    )
    issued_by = models.CharField(
        max_length=255,
        default='Tashawer Platform',
        help_text="Entity issuing the invoice"
    )

    # Invoice details
    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique invoice number"
    )
    invoice_type = models.CharField(
        max_length=20,
        choices=InvoiceType.choices,
        help_text="Type of invoice"
    )
    status = models.CharField(
        max_length=20,
        choices=InvoiceStatus.choices,
        default=InvoiceStatus.DRAFT,
        help_text="Current invoice status"
    )

    # Financial details
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Subtotal before VAT"
    )
    vat_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=15.00,
        help_text="VAT percentage"
    )
    vat_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="VAT amount"
    )
    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Total amount including VAT"
    )
    currency = models.CharField(
        max_length=3,
        default='SAR',
        help_text="Currency code"
    )

    # Related objects
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
        help_text="Related project"
    )
    escrow = models.ForeignKey(
        'payments.Escrow',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
        help_text="Related escrow"
    )
    transaction = models.ForeignKey(
        'payments.Transaction',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
        help_text="Related transaction"
    )

    # Invoice content
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Invoice description/notes"
    )
    line_items = models.JSONField(
        default=list,
        help_text="Invoice line items"
    )

    # Dates
    issue_date = models.DateField(
        help_text="Date invoice was issued"
    )
    due_date = models.DateField(
        blank=True,
        null=True,
        help_text="Payment due date"
    )
    paid_date = models.DateField(
        blank=True,
        null=True,
        help_text="Date payment was received"
    )

    # PDF storage
    pdf_file = models.FileField(
        upload_to='invoices/',
        blank=True,
        null=True,
        help_text="Generated PDF invoice"
    )

    class Meta:
        db_table = 'invoices'
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['invoice_type']),
            models.Index(fields=['issued_to']),
            models.Index(fields=['invoice_number']),
            models.Index(fields=['-issue_date']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.total} {self.currency}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            import uuid
            from django.utils import timezone
            year = timezone.now().year
            self.invoice_number = f"INV-{year}-{uuid.uuid4().hex[:8].upper()}"

        # Calculate VAT and total if not set
        if self.subtotal and not self.vat_amount:
            self.vat_amount = self.subtotal * (self.vat_rate / 100)
        if self.subtotal and self.vat_amount and not self.total:
            self.total = self.subtotal + self.vat_amount

        super().save(*args, **kwargs)

    def issue(self):
        """Issue the invoice"""
        from django.utils import timezone
        if self.status == InvoiceStatus.DRAFT:
            self.status = InvoiceStatus.ISSUED
            if not self.issue_date:
                self.issue_date = timezone.now().date()
            self.save(update_fields=['status', 'issue_date', 'updated_at'])

    def mark_paid(self):
        """Mark invoice as paid"""
        from django.utils import timezone
        if self.status == InvoiceStatus.ISSUED:
            self.status = InvoiceStatus.PAID
            self.paid_date = timezone.now().date()
            self.save(update_fields=['status', 'paid_date', 'updated_at'])

    def cancel(self):
        """Cancel the invoice"""
        if self.status in [InvoiceStatus.DRAFT, InvoiceStatus.ISSUED]:
            self.status = InvoiceStatus.CANCELLED
            self.save(update_fields=['status', 'updated_at'])
