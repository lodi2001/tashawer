from django.contrib import admin
from .models import Proposal


@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'project',
        'consultant',
        'proposed_amount',
        'estimated_duration',
        'status',
        'submitted_at',
        'created_at',
    ]
    list_filter = ['status', 'created_at', 'submitted_at']
    search_fields = ['project__title', 'consultant__email', 'cover_letter']
    readonly_fields = ['created_at', 'updated_at', 'submitted_at', 'reviewed_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Proposal Info', {
            'fields': ('project', 'consultant', 'status')
        }),
        ('Proposal Details', {
            'fields': ('cover_letter', 'proposed_amount', 'estimated_duration', 'delivery_date')
        }),
        ('Review', {
            'fields': ('rejection_reason',)
        }),
        ('Timestamps', {
            'fields': ('submitted_at', 'reviewed_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
