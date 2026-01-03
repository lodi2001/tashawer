from django.contrib import admin
from .models import Order, Milestone, Deliverable, OrderActivity


class MilestoneInline(admin.TabularInline):
    model = Milestone
    extra = 0
    readonly_fields = ['created_at', 'submitted_at', 'approved_at']
    fields = [
        'sequence', 'title', 'status', 'due_date',
        'amount', 'is_paid', 'created_at'
    ]


class DeliverableInline(admin.TabularInline):
    model = Deliverable
    extra = 0
    readonly_fields = ['created_at', 'file_size', 'file_type']
    fields = ['title', 'original_filename', 'version', 'is_final', 'created_at']


class OrderActivityInline(admin.TabularInline):
    model = OrderActivity
    extra = 0
    readonly_fields = ['activity_type', 'user', 'description', 'created_at']
    fields = ['activity_type', 'user', 'description', 'created_at']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number',
        'title',
        'status',
        'client',
        'consultant',
        'amount',
        'progress_percentage',
        'expected_delivery_date',
        'created_at',
    ]
    list_filter = ['status', 'currency', 'deadline_extended', 'created_at']
    search_fields = ['order_number', 'title', 'client__email', 'consultant__email']
    readonly_fields = [
        'order_number',
        'created_at',
        'updated_at',
        'confirmed_at',
        'started_at',
        'delivered_at',
        'completed_at',
        'cancelled_at',
    ]
    raw_id_fields = ['project', 'proposal', 'escrow', 'client', 'consultant', 'cancelled_by']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    inlines = [MilestoneInline, OrderActivityInline]

    fieldsets = (
        ('Order Info', {
            'fields': ('order_number', 'title', 'description', 'status')
        }),
        ('Parties', {
            'fields': ('client', 'consultant', 'project', 'proposal', 'escrow')
        }),
        ('Financial', {
            'fields': ('amount', 'currency')
        }),
        ('Timeline', {
            'fields': (
                'expected_delivery_date', 'actual_delivery_date',
                'deadline_extended', 'original_delivery_date'
            )
        }),
        ('Progress', {
            'fields': ('progress_percentage', 'max_revisions', 'revisions_used')
        }),
        ('Notes', {
            'fields': ('client_notes', 'consultant_notes'),
            'classes': ('collapse',)
        }),
        ('Cancellation', {
            'fields': ('cancellation_reason', 'cancelled_by'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': (
                'confirmed_at', 'started_at', 'delivered_at',
                'completed_at', 'cancelled_at', 'created_at', 'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = [
        'order',
        'sequence',
        'title',
        'status',
        'due_date',
        'amount',
        'is_paid',
        'created_at',
    ]
    list_filter = ['status', 'is_paid', 'created_at']
    search_fields = ['title', 'order__order_number']
    readonly_fields = ['created_at', 'updated_at', 'submitted_at', 'approved_at', 'paid_at']
    raw_id_fields = ['order', 'approved_by']
    date_hierarchy = 'created_at'
    ordering = ['order', 'sequence']
    inlines = [DeliverableInline]

    fieldsets = (
        ('Milestone Info', {
            'fields': ('order', 'sequence', 'title', 'description', 'status')
        }),
        ('Timeline', {
            'fields': ('due_date', 'completed_date')
        }),
        ('Payment', {
            'fields': ('amount', 'is_paid', 'paid_at')
        }),
        ('Feedback', {
            'fields': ('client_feedback', 'consultant_notes'),
            'classes': ('collapse',)
        }),
        ('Approval', {
            'fields': ('approved_by', 'approved_at', 'submitted_at'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Deliverable)
class DeliverableAdmin(admin.ModelAdmin):
    list_display = [
        'original_filename',
        'milestone',
        'version',
        'is_final',
        'file_size',
        'uploaded_by',
        'created_at',
    ]
    list_filter = ['is_final', 'file_type', 'created_at']
    search_fields = ['original_filename', 'title', 'milestone__order__order_number']
    readonly_fields = ['created_at', 'updated_at', 'file_size', 'file_type']
    raw_id_fields = ['milestone', 'uploaded_by']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']


@admin.register(OrderActivity)
class OrderActivityAdmin(admin.ModelAdmin):
    list_display = [
        'order',
        'activity_type',
        'user',
        'created_at',
    ]
    list_filter = ['activity_type', 'created_at']
    search_fields = ['order__order_number', 'description']
    readonly_fields = ['id', 'order', 'user', 'activity_type', 'description', 'metadata', 'created_at']
    raw_id_fields = ['order', 'user']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
