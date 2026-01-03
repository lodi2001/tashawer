"""
Django admin configuration for notifications app.
"""

from django.contrib import admin
from django.utils.html import format_html
from apps.notifications.models import (
    Notification,
    NotificationPreference,
    EmailLog,
)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin configuration for Notification model."""
    list_display = [
        'id',
        'user',
        'notification_type',
        'category',
        'title',
        'read_status',
        'created_at',
    ]
    list_filter = ['notification_type', 'category', 'is_read', 'created_at']
    search_fields = ['user__email', 'title', 'message']
    readonly_fields = ['created_at', 'read_at']
    raw_id_fields = ['user']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Notification Content', {
            'fields': (
                'notification_type', 'category',
                'title', 'title_ar',
                'message', 'message_ar',
            )
        }),
        ('Related Object', {
            'fields': ('related_object_type', 'related_object_id', 'action_url'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_read', 'read_at', 'created_at'),
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
    )

    def read_status(self, obj):
        if obj.is_read:
            return format_html(
                '<span style="color: green;">Read</span>'
            )
        return format_html(
            '<span style="color: orange; font-weight: bold;">Unread</span>'
        )
    read_status.short_description = 'Status'

    actions = ['mark_as_read', 'mark_as_unread']

    @admin.action(description='Mark selected as read')
    def mark_as_read(self, request, queryset):
        from django.utils import timezone
        queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(request, f'{queryset.count()} notifications marked as read.')

    @admin.action(description='Mark selected as unread')
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False, read_at=None)
        self.message_user(request, f'{queryset.count()} notifications marked as unread.')


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    """Admin configuration for NotificationPreference model."""
    list_display = [
        'user',
        'preferred_language',
        'email_summary',
        'push_summary',
        'updated_at',
    ]
    search_fields = ['user__email', 'user__full_name']
    list_filter = ['preferred_language']
    raw_id_fields = ['user']

    fieldsets = (
        ('User', {
            'fields': ('user', 'preferred_language')
        }),
        ('Email Preferences', {
            'fields': (
                'email_orders', 'email_proposals', 'email_payments',
                'email_messages', 'email_disputes', 'email_reviews', 'email_system',
            )
        }),
        ('Push Preferences', {
            'fields': (
                'push_orders', 'push_proposals', 'push_payments',
                'push_messages', 'push_disputes', 'push_reviews', 'push_system',
            )
        }),
        ('SMS Preferences', {
            'fields': ('sms_payments', 'sms_disputes', 'sms_system'),
        }),
    )

    def email_summary(self, obj):
        enabled = sum([
            obj.email_orders, obj.email_proposals, obj.email_payments,
            obj.email_messages, obj.email_disputes, obj.email_reviews, obj.email_system
        ])
        return f"{enabled}/7 enabled"
    email_summary.short_description = 'Email'

    def push_summary(self, obj):
        enabled = sum([
            obj.push_orders, obj.push_proposals, obj.push_payments,
            obj.push_messages, obj.push_disputes, obj.push_reviews, obj.push_system
        ])
        return f"{enabled}/7 enabled"
    push_summary.short_description = 'Push'


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    """Admin configuration for EmailLog model."""
    list_display = [
        'id',
        'to_email',
        'subject',
        'notification_type',
        'status_badge',
        'sent_at',
        'created_at',
    ]
    list_filter = ['status', 'notification_type', 'created_at']
    search_fields = ['to_email', 'subject', 'user__email']
    readonly_fields = [
        'to_email', 'subject', 'template_name', 'notification_type',
        'status', 'error_message', 'sent_at', 'opened_at', 'clicked_at', 'created_at'
    ]
    raw_id_fields = ['user']
    date_hierarchy = 'created_at'

    def status_badge(self, obj):
        colors = {
            'pending': '#FFA500',
            'sent': '#28A745',
            'failed': '#DC3545',
            'bounced': '#6C757D',
        }
        color = colors.get(obj.status, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.status.title()
        )
    status_badge.short_description = 'Status'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
