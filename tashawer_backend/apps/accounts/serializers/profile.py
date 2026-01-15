"""
Profile serializers.
"""
from rest_framework import serializers

from apps.accounts.models import User, IndividualProfile, OrganizationProfile, ConsultantProfile


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'mobile',
            'role',
            'user_type',
            'registration_no',
            'is_verified',
            'is_approved',
            'account_status',
            'preferred_language',
            'full_name',
            'created_at',
            'last_login_at',
        ]
        read_only_fields = [
            'id',
            'email',
            'role',
            'registration_no',
            'is_verified',
            'is_approved',
            'account_status',
            'created_at',
            'last_login_at',
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()


class IndividualProfileSerializer(serializers.ModelSerializer):
    """Serializer for Individual Profile."""
    user = UserSerializer(read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = IndividualProfile
        fields = [
            'id',
            'user',
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
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'total_projects_posted',
            'total_spent',
            'created_at',
            'updated_at',
        ]

    def get_avatar(self, obj):
        """Return absolute URL for avatar."""
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None


class OrganizationProfileSerializer(serializers.ModelSerializer):
    """Serializer for Organization Profile."""
    user = UserSerializer(read_only=True)
    logo = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationProfile
        fields = [
            'id',
            'user',
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
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'total_projects_posted',
            'total_spent',
            'created_at',
            'updated_at',
        ]

    def get_logo(self, obj):
        """Return absolute URL for logo."""
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class ConsultantProfileSerializer(serializers.ModelSerializer):
    """Serializer for Consultant Profile."""
    user = UserSerializer(read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = ConsultantProfile
        fields = [
            'id',
            'user',
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
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'rating',
            'total_reviews',
            'total_projects_completed',
            'total_earned',
            'created_at',
            'updated_at',
        ]

    def get_avatar(self, obj):
        """Return absolute URL for avatar."""
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None


class PublicConsultantProfileSerializer(serializers.ModelSerializer):
    """Public serializer for Consultant Profile (limited fields)."""

    class Meta:
        model = ConsultantProfile
        fields = [
            'id',
            'consultant_type',
            'full_name',
            'specialization',
            'experience_years',
            'hourly_rate',
            'skills',
            'avatar',
            'bio',
            'city',
            'availability_status',
            'rating',
            'total_reviews',
            'total_projects_completed',
        ]
