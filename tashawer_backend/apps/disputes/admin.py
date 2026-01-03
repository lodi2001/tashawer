"""
Django admin configuration for disputes app.
"""

from django.contrib import admin
from django.utils.html import format_html
from apps.disputes.models import (
    Dispute,
    DisputeEvidence,
    DisputeMessage,
    DisputeActivity,
)


class DisputeEvidenceInline(admin.TabularInline):
    """Inline for dispute evidence."""
    model = DisputeEvidence
    extra = 0
    readonly_fields = ['original_filename', 'file_size', 'file_type', 'uploaded_by', 'created_at']
    fields = ['file', 'original_filename', 'file_type', 'description', 'uploaded_by', 'created_at']


class DisputeMessageInline(admin.TabularInline):
    """Inline for dispute messages."""
    model = DisputeMessage
    extra = 0
    readonly_fields = ['sender', 'created_at']
    fields = ['sender', 'message', 'is_admin_message', 'is_internal_note', 'created_at']


class DisputeActivityInline(admin.TabularInline):
    """Inline for dispute activities."""
    model = DisputeActivity
    extra = 0
    readonly_fields = ['activity_type', 'description', 'user', 'metadata', 'created_at']
    fields = ['activity_type', 'description', 'user', 'metadata', 'created_at']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    """Admin configuration for Dispute model."""
    list_display = [
        'dispute_number',
        'order_number',
        'reason',
        'status_badge',
        'disputed_amount',
        'initiated_by',
        'assigned_admin',
        'created_at',
    ]
    list_filter = ['status', 'reason', 'resolution_type', 'created_at']
    search_fields = ['dispute_number', 'order__order_number', 'description']
    readonly_fields = [
        'dispute_number', 'created_at', 'updated_at', 'resolved_at',
        'client_info', 'consultant_info'
    ]
    raw_id_fields = ['order', 'initiated_by', 'assigned_admin', 'resolved_by']
    inlines = [DisputeEvidenceInline, DisputeMessageInline, DisputeActivityInline]
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Basic Information', {
            'fields': (
                'dispute_number', 'order', 'initiated_by',
                'client_info', 'consultant_info'
            )
        }),
        ('Dispute Details', {
            'fields': (
                'reason', 'description', 'desired_resolution', 'disputed_amount'
            )
        }),
        ('Status & Assignment', {
            'fields': (
                'status', 'assigned_admin', 'response_deadline'
            )
        }),
        ('Resolution', {
            'fields': (
                'resolution_type', 'resolution_amount', 'resolution_notes',
                'resolved_by', 'resolved_at'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def order_number(self, obj):
        return obj.order.order_number
    order_number.short_description = 'Order'
    order_number.admin_order_field = 'order__order_number'

    def status_badge(self, obj):
        colors = {
            'open': '#FFA500',
            'under_review': '#007BFF',
            'awaiting_response': '#FFC107',
            'in_mediation': '#6F42C1',
            'resolved': '#28A745',
            'closed': '#6C757D',
            'escalated': '#DC3545',
        }
        color = colors.get(obj.status, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'

    def client_info(self, obj):
        return f"{obj.client.full_name} ({obj.client.email})" if obj.client else '-'
    client_info.short_description = 'Client'

    def consultant_info(self, obj):
        return f"{obj.consultant.full_name} ({obj.consultant.email})" if obj.consultant else '-'
    consultant_info.short_description = 'Consultant'

    actions = ['assign_to_me', 'mark_under_review']

    @admin.action(description='Assign selected disputes to me')
    def assign_to_me(self, request, queryset):
        for dispute in queryset:
            dispute.assign_admin(request.user)
        self.message_user(request, f'{queryset.count()} disputes assigned to you.')

    @admin.action(description='Mark selected disputes as Under Review')
    def mark_under_review(self, request, queryset):
        queryset.update(status='under_review')
        self.message_user(request, f'{queryset.count()} disputes marked as under review.')


@admin.register(DisputeEvidence)
class DisputeEvidenceAdmin(admin.ModelAdmin):
    """Admin configuration for DisputeEvidence model."""
    list_display = ['id', 'dispute', 'original_filename', 'file_type', 'uploaded_by', 'created_at']
    list_filter = ['file_type', 'created_at']
    search_fields = ['dispute__dispute_number', 'original_filename', 'description']
    raw_id_fields = ['dispute', 'uploaded_by']
    readonly_fields = ['original_filename', 'file_size', 'created_at']


@admin.register(DisputeMessage)
class DisputeMessageAdmin(admin.ModelAdmin):
    """Admin configuration for DisputeMessage model."""
    list_display = ['id', 'dispute', 'sender', 'is_admin_message', 'is_internal_note', 'created_at']
    list_filter = ['is_admin_message', 'is_internal_note', 'created_at']
    search_fields = ['dispute__dispute_number', 'message']
    raw_id_fields = ['dispute', 'sender']
    readonly_fields = ['created_at']


@admin.register(DisputeActivity)
class DisputeActivityAdmin(admin.ModelAdmin):
    """Admin configuration for DisputeActivity model."""
    list_display = ['id', 'dispute', 'activity_type', 'user', 'created_at']
    list_filter = ['activity_type', 'created_at']
    search_fields = ['dispute__dispute_number', 'description']
    raw_id_fields = ['dispute', 'user']
    readonly_fields = ['dispute', 'activity_type', 'description', 'user', 'metadata', 'created_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
