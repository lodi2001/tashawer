from django.contrib import admin
from .models import Category, Project, ProjectAttachment


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'name_ar', 'is_active', 'order', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'name_ar']
    ordering = ['order', 'name']
    list_editable = ['is_active', 'order']


class ProjectAttachmentInline(admin.TabularInline):
    model = ProjectAttachment
    extra = 0
    readonly_fields = ['original_filename', 'file_size', 'file_type', 'uploaded_by', 'created_at']
    fields = ['file', 'original_filename', 'file_size', 'file_type', 'uploaded_by', 'created_at']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'client', 'category', 'status',
        'budget_range', 'deadline', 'location', 'created_at'
    ]
    list_filter = ['status', 'category', 'location', 'created_at']
    search_fields = ['title', 'description', 'client__email', 'client__full_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'published_at', 'completed_at']
    raw_id_fields = ['client']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    inlines = [ProjectAttachmentInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'title', 'description', 'category')
        }),
        ('Client & Location', {
            'fields': ('client', 'location')
        }),
        ('Budget & Timeline', {
            'fields': ('budget_min', 'budget_max', 'deadline')
        }),
        ('Status', {
            'fields': ('status', 'published_at', 'completed_at')
        }),
        ('Additional', {
            'fields': ('requirements',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def budget_range(self, obj):
        return obj.budget_range
    budget_range.short_description = 'Budget (SAR)'


@admin.register(ProjectAttachment)
class ProjectAttachmentAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'project', 'file_type', 'file_size', 'uploaded_by', 'created_at']
    list_filter = ['file_type', 'created_at']
    search_fields = ['original_filename', 'project__title']
    readonly_fields = ['id', 'file_size', 'file_type', 'created_at', 'updated_at']
    raw_id_fields = ['project', 'uploaded_by']
