"""
Admin configuration for accounts app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from apps.accounts.models import User, IndividualProfile, OrganizationProfile, ConsultantProfile, AuditLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin for User model."""
    list_display = [
        'email',
        'registration_no',
        'user_type',
        'is_verified',
        'is_approved',
        'account_status',
        'created_at',
    ]
    list_filter = [
        'user_type',
        'is_verified',
        'is_approved',
        'account_status',
        'is_staff',
        'is_active',
    ]
    search_fields = ['email', 'mobile', 'registration_no']
    ordering = ['-created_at']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {'fields': ('mobile', 'registration_no')}),
        (_('User Type'), {'fields': ('user_type',)}),
        (_('Status'), {'fields': (
            'is_active',
            'is_staff',
            'is_superuser',
            'is_verified',
            'is_approved',
            'account_status',
        )}),
        (_('Approval'), {'fields': ('approved_at', 'approved_by')}),
        (_('Settings'), {'fields': ('preferred_language', 'timezone')}),
        (_('Important dates'), {'fields': ('last_login', 'created_at', 'updated_at')}),
    )

    readonly_fields = ['created_at', 'updated_at', 'last_login', 'registration_no']

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'user_type'),
        }),
    )

    actions = ['approve_users', 'suspend_users', 'activate_users']

    def approve_users(self, request, queryset):
        for user in queryset:
            user.approve(approved_by=request.user)
        self.message_user(request, f'{queryset.count()} users approved.')

    approve_users.short_description = 'Approve selected users'

    def suspend_users(self, request, queryset):
        for user in queryset:
            user.suspend()
        self.message_user(request, f'{queryset.count()} users suspended.')

    suspend_users.short_description = 'Suspend selected users'

    def activate_users(self, request, queryset):
        for user in queryset:
            user.activate()
        self.message_user(request, f'{queryset.count()} users activated.')

    activate_users.short_description = 'Activate selected users'


@admin.register(IndividualProfile)
class IndividualProfileAdmin(admin.ModelAdmin):
    """Admin for Individual Profile."""
    list_display = ['full_name', 'user', 'city', 'total_projects_posted', 'created_at']
    search_fields = ['full_name', 'user__email', 'national_id']
    list_filter = ['city']
    raw_id_fields = ['user']


@admin.register(OrganizationProfile)
class OrganizationProfileAdmin(admin.ModelAdmin):
    """Admin for Organization Profile."""
    list_display = ['company_name', 'company_type', 'representative_name', 'city', 'created_at']
    search_fields = ['company_name', 'user__email', 'commercial_registration_no']
    list_filter = ['company_type', 'city']
    raw_id_fields = ['user']


@admin.register(ConsultantProfile)
class ConsultantProfileAdmin(admin.ModelAdmin):
    """Admin for Consultant Profile."""
    list_display = [
        'full_name',
        'consultant_type',
        'specialization',
        'rating',
        'availability_status',
        'created_at',
    ]
    search_fields = ['full_name', 'user__email', 'saudi_engineering_license_no']
    list_filter = ['consultant_type', 'availability_status', 'city']
    raw_id_fields = ['user']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Admin for Audit Log."""
    list_display = [
        'admin',
        'action',
        'target_user',
        'ip_address',
        'created_at',
    ]
    list_filter = ['action', 'created_at']
    search_fields = ['admin__email', 'target_user__email', 'ip_address']
    readonly_fields = [
        'admin',
        'target_user',
        'action',
        'details',
        'ip_address',
        'user_agent',
        'created_at',
    ]
    raw_id_fields = ['admin', 'target_user']
    ordering = ['-created_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
