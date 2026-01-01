"""
Admin serializers for user management.
Implements NUW-21: Admin – Manage Users
"""
from rest_framework import serializers

from apps.accounts.models import (
    User,
    IndividualProfile,
    OrganizationProfile,
    ConsultantProfile,
    AuditLog,
)


class AdminUserListSerializer(serializers.ModelSerializer):
    """
    Serializer for user list view (AC2).
    Displays: Name, Email, Mobile, User Type, Account Status, Registration Date
    """
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'email',
            'mobile',
            'user_type',
            'account_status',
            'is_verified',
            'is_approved',
            'registration_no',
            'created_at',
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()


class AdminIndividualDetailSerializer(serializers.ModelSerializer):
    """Serializer for Individual user details (AC4)."""

    class Meta:
        model = IndividualProfile
        fields = [
            'full_name',
            'full_name_ar',
            'national_id',
            'date_of_birth',
            'city',
            'address',
            'avatar',
            'bio',
            'total_projects_posted',
            'total_spent',
        ]


class AdminOrganizationDetailSerializer(serializers.ModelSerializer):
    """Serializer for Organization user details (AC4)."""

    class Meta:
        model = OrganizationProfile
        fields = [
            'company_name',
            'company_name_ar',
            'company_type',
            'commercial_registration_no',
            'vat_number',
            'representative_name',
            'representative_position',
            'representative_mobile',
            'city',
            'address',
            'logo',
            'commercial_registration_doc',
            'total_projects_posted',
            'total_spent',
        ]


class AdminConsultantDetailSerializer(serializers.ModelSerializer):
    """Serializer for Consultant user details (AC4)."""

    class Meta:
        model = ConsultantProfile
        fields = [
            'consultant_type',
            'full_name',
            'full_name_ar',
            'specialization',
            'experience_years',
            'hourly_rate',
            'saudi_engineering_license_no',
            'license_document',
            'skills',
            'certifications',
            'avatar',
            'bio',
            'bio_ar',
            'portfolio_url',
            'city',
            'availability_status',
            'rating',
            'total_reviews',
            'total_projects_completed',
            'total_earned',
            'commercial_registration_no',
        ]


class AdminUserDetailSerializer(serializers.ModelSerializer):
    """
    Full user detail serializer for admin view (AC4).
    Includes profile based on user type.
    """
    full_name = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()
    approved_by_email = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'mobile',
            'user_type',
            'registration_no',
            'is_active',
            'is_verified',
            'is_approved',
            'account_status',
            'preferred_language',
            'timezone',
            'full_name',
            'profile',
            'created_at',
            'updated_at',
            'last_login_at',
            'approved_at',
            'approved_by_email',
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_approved_by_email(self, obj):
        return obj.approved_by.email if obj.approved_by else None

    def get_profile(self, obj):
        """Get profile data based on user type."""
        if obj.user_type == User.UserType.INDIVIDUAL:
            profile = getattr(obj, 'individual_profile', None)
            if profile:
                return AdminIndividualDetailSerializer(profile).data
        elif obj.user_type == User.UserType.ORGANIZATION:
            profile = getattr(obj, 'organization_profile', None)
            if profile:
                return AdminOrganizationDetailSerializer(profile).data
        elif obj.user_type == User.UserType.CONSULTANT:
            profile = getattr(obj, 'consultant_profile', None)
            if profile:
                return AdminConsultantDetailSerializer(profile).data
        return None


class AdminUserEditSerializer(serializers.Serializer):
    """
    Serializer for admin editing user info (AC8).
    Limited fields only.
    """
    # User fields
    mobile = serializers.CharField(max_length=20, required=False)
    account_status = serializers.ChoiceField(
        choices=User.AccountStatus.choices,
        required=False
    )

    # Individual profile fields
    full_name = serializers.CharField(max_length=255, required=False)

    # Organization profile fields
    representative_name = serializers.CharField(max_length=255, required=False)
    address = serializers.CharField(required=False, allow_blank=True)

    # Consultant profile fields
    specialization = serializers.CharField(max_length=255, required=False)
    skills = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )


class AdminSuspendSerializer(serializers.Serializer):
    """Serializer for suspend action with optional reason."""
    reason = serializers.CharField(required=False, allow_blank=True)


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs."""
    admin_email = serializers.SerializerMethodField()
    target_user_email = serializers.SerializerMethodField()
    action_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'admin_email',
            'target_user_email',
            'action',
            'action_display',
            'details',
            'ip_address',
            'created_at',
        ]

    def get_admin_email(self, obj):
        return obj.admin.email if obj.admin else None

    def get_target_user_email(self, obj):
        return obj.target_user.email if obj.target_user else None

    def get_action_display(self, obj):
        return obj.get_action_display()
