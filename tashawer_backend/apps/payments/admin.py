from django.contrib import admin
from .models import (
    Transaction,
    Escrow,
    Invoice,
    Wallet,
    Deposit,
    Withdrawal,
    BankAccount,
    WebhookLog,
)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        'reference_number',
        'transaction_type',
        'status',
        'amount',
        'currency',
        'payer',
        'payee',
        'created_at',
    ]
    list_filter = ['transaction_type', 'status', 'currency', 'created_at']
    search_fields = ['reference_number', 'payer__email', 'payee__email', 'gateway_transaction_id']
    readonly_fields = ['reference_number', 'created_at', 'updated_at', 'completed_at']
    raw_id_fields = ['payer', 'payee', 'project', 'proposal', 'escrow']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']


@admin.register(Escrow)
class EscrowAdmin(admin.ModelAdmin):
    list_display = [
        'escrow_reference',
        'status',
        'amount',
        'currency',
        'client',
        'consultant',
        'created_at',
    ]
    list_filter = ['status', 'currency', 'created_at']
    search_fields = ['escrow_reference', 'client__email', 'consultant__email']
    readonly_fields = [
        'escrow_reference',
        'created_at',
        'updated_at',
        'funded_at',
        'released_at',
        'refunded_at',
    ]
    raw_id_fields = ['client', 'consultant', 'project', 'proposal']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        'invoice_number',
        'status',
        'invoice_type',
        'total',
        'currency',
        'issued_to',
        'created_at',
    ]
    list_filter = ['status', 'invoice_type', 'currency', 'created_at']
    search_fields = ['invoice_number', 'issued_to__email']
    readonly_fields = ['invoice_number', 'created_at', 'updated_at']
    raw_id_fields = ['issued_to', 'project', 'escrow', 'transaction']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'balance',
        'pending_balance',
        'currency',
        'status',
        'total_deposited',
        'total_earned',
        'created_at',
    ]
    list_filter = ['status', 'currency', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = [
        'created_at',
        'updated_at',
        'total_deposited',
        'total_withdrawn',
        'total_earned',
        'total_spent',
    ]
    raw_id_fields = ['user']
    ordering = ['-created_at']


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = [
        'reference_number',
        'status',
        'amount',
        'currency',
        'user',
        'payment_method',
        'created_at',
        'completed_at',
    ]
    list_filter = ['status', 'payment_method', 'currency', 'created_at']
    search_fields = ['reference_number', 'user__email', 'gateway_charge_id']
    readonly_fields = ['reference_number', 'created_at', 'updated_at', 'completed_at']
    raw_id_fields = ['wallet', 'user']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = [
        'bank_name',
        'account_holder_name',
        'iban',
        'user',
        'is_verified',
        'is_primary',
        'created_at',
    ]
    list_filter = ['is_verified', 'is_primary', 'bank_name', 'created_at']
    search_fields = ['bank_name', 'account_holder_name', 'iban', 'user__email']
    readonly_fields = ['created_at', 'updated_at', 'verified_at']
    raw_id_fields = ['user', 'verified_by']
    ordering = ['-created_at']

    actions = ['verify_accounts']

    def verify_accounts(self, request, queryset):
        for bank_account in queryset:
            bank_account.verify(request.user)
        self.message_user(request, f"Verified {queryset.count()} bank account(s)")
    verify_accounts.short_description = "Verify selected bank accounts"


@admin.register(Withdrawal)
class WithdrawalAdmin(admin.ModelAdmin):
    list_display = [
        'reference_number',
        'status',
        'amount',
        'net_amount',
        'currency',
        'user',
        'bank_account',
        'created_at',
        'completed_at',
    ]
    list_filter = ['status', 'currency', 'created_at']
    search_fields = ['reference_number', 'user__email', 'bank_reference']
    readonly_fields = [
        'reference_number',
        'created_at',
        'updated_at',
        'reviewed_at',
        'approved_at',
        'processed_at',
        'completed_at',
    ]
    raw_id_fields = ['user', 'wallet', 'bank_account', 'reviewed_by']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

    fieldsets = (
        ('Basic Info', {
            'fields': ('reference_number', 'user', 'wallet', 'bank_account', 'status')
        }),
        ('Amount', {
            'fields': ('amount', 'fee', 'net_amount', 'currency')
        }),
        ('Bank Transfer', {
            'fields': ('bank_reference', 'transfer_receipt')
        }),
        ('Review', {
            'fields': ('reviewed_by', 'reviewed_at', 'rejection_reason', 'admin_note')
        }),
        ('Notes', {
            'fields': ('user_note',)
        }),
        ('Timestamps', {
            'fields': ('approved_at', 'processed_at', 'completed_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['approve_withdrawals', 'reject_withdrawals']

    def approve_withdrawals(self, request, queryset):
        approved = 0
        for withdrawal in queryset.filter(status='pending'):
            try:
                withdrawal.approve(request.user)
                approved += 1
            except Exception:
                pass
        self.message_user(request, f"Approved {approved} withdrawal(s)")
    approve_withdrawals.short_description = "Approve selected withdrawals"

    def reject_withdrawals(self, request, queryset):
        rejected = 0
        for withdrawal in queryset.filter(status='pending'):
            try:
                withdrawal.reject(request.user, "Rejected by admin")
                rejected += 1
            except Exception:
                pass
        self.message_user(request, f"Rejected {rejected} withdrawal(s)")
    reject_withdrawals.short_description = "Reject selected withdrawals"


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    list_display = [
        'source',
        'event_type',
        'reference_number',
        'gateway_status',
        'status',
        'signature_valid',
        'attempt_count',
        'received_at',
    ]
    list_filter = ['source', 'event_type', 'status', 'signature_valid', 'received_at']
    search_fields = ['reference_number', 'gateway_charge_id', 'event_id', 'ip_address']
    readonly_fields = [
        'id',
        'source',
        'event_id',
        'event_type',
        'reference_number',
        'gateway_charge_id',
        'gateway_status',
        'headers',
        'payload',
        'response_status',
        'response_body',
        'attempt_count',
        'is_duplicate',
        'signature_valid',
        'ip_address',
        'error_message',
        'received_at',
        'processed_at',
    ]
    date_hierarchy = 'received_at'
    ordering = ['-received_at']

    fieldsets = (
        ('Identification', {
            'fields': ('id', 'source', 'event_id', 'event_type')
        }),
        ('References', {
            'fields': ('reference_number', 'gateway_charge_id', 'gateway_status')
        }),
        ('Status', {
            'fields': ('status', 'signature_valid', 'attempt_count', 'is_duplicate')
        }),
        ('Request', {
            'fields': ('ip_address', 'headers', 'payload'),
            'classes': ('collapse',)
        }),
        ('Response', {
            'fields': ('response_status', 'response_body', 'error_message'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('received_at', 'processed_at'),
        }),
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
