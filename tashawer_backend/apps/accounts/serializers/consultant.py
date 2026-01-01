"""
Serializers for consultant discovery and portfolio features.
"""
from rest_framework import serializers

from apps.accounts.models import (
    User,
    ConsultantProfile,
    ConsultantPortfolio,
    PortfolioImage,
    ConsultantSkill,
    ConsultantCertification,
    ProjectInvitation,
)
from apps.projects.models import Category, Project


class PortfolioImageSerializer(serializers.ModelSerializer):
    """Serializer for portfolio images."""

    class Meta:
        model = PortfolioImage
        fields = [
            'id',
            'image',
            'caption',
            'is_primary',
            'order',
        ]
        read_only_fields = ['id']


class ConsultantPortfolioSerializer(serializers.ModelSerializer):
    """Serializer for consultant portfolio items."""
    images = PortfolioImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = ConsultantPortfolio
        fields = [
            'id',
            'title',
            'title_ar',
            'description',
            'description_ar',
            'category',
            'category_name',
            'client_name',
            'project_url',
            'completion_date',
            'project_value',
            'is_featured',
            'order',
            'images',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ConsultantPortfolioCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating portfolio items."""

    class Meta:
        model = ConsultantPortfolio
        fields = [
            'title',
            'title_ar',
            'description',
            'description_ar',
            'category',
            'client_name',
            'project_url',
            'completion_date',
            'project_value',
            'is_featured',
            'order',
        ]

    def create(self, validated_data):
        consultant = self.context['request'].user.consultant_profile
        return ConsultantPortfolio.objects.create(
            consultant=consultant,
            **validated_data
        )


class ConsultantSkillSerializer(serializers.ModelSerializer):
    """Serializer for consultant skills."""
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = ConsultantSkill
        fields = [
            'id',
            'name',
            'name_ar',
            'category',
            'category_name',
            'proficiency',
            'years_experience',
            'is_verified',
        ]
        read_only_fields = ['id', 'is_verified']


class ConsultantSkillCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating consultant skills."""

    class Meta:
        model = ConsultantSkill
        fields = [
            'name',
            'name_ar',
            'category',
            'proficiency',
            'years_experience',
        ]

    def create(self, validated_data):
        consultant = self.context['request'].user.consultant_profile
        return ConsultantSkill.objects.create(
            consultant=consultant,
            **validated_data
        )


class ConsultantCertificationSerializer(serializers.ModelSerializer):
    """Serializer for consultant certifications."""
    is_expired = serializers.BooleanField(read_only=True)
    is_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = ConsultantCertification
        fields = [
            'id',
            'name',
            'name_ar',
            'issuing_organization',
            'credential_id',
            'credential_url',
            'issue_date',
            'expiry_date',
            'document',
            'is_verified',
            'is_expired',
            'is_valid',
            'created_at',
        ]
        read_only_fields = ['id', 'is_verified', 'created_at']


class ConsultantCertificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating certifications."""

    class Meta:
        model = ConsultantCertification
        fields = [
            'name',
            'name_ar',
            'issuing_organization',
            'credential_id',
            'credential_url',
            'issue_date',
            'expiry_date',
            'document',
        ]

    def create(self, validated_data):
        consultant = self.context['request'].user.consultant_profile
        return ConsultantCertification.objects.create(
            consultant=consultant,
            **validated_data
        )


class ConsultantPublicProfileSerializer(serializers.ModelSerializer):
    """Public profile serializer for consultant discovery."""
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    portfolio_items = ConsultantPortfolioSerializer(many=True, read_only=True)
    skill_items = ConsultantSkillSerializer(many=True, read_only=True)
    certification_items = ConsultantCertificationSerializer(many=True, read_only=True)

    class Meta:
        model = ConsultantProfile
        fields = [
            'id',
            'user_id',
            'email',
            'consultant_type',
            'full_name',
            'full_name_ar',
            'specialization',
            'experience_years',
            'hourly_rate',
            'avatar',
            'bio',
            'bio_ar',
            'portfolio_url',
            'city',
            'availability_status',
            'rating',
            'total_reviews',
            'total_projects_completed',
            'portfolio_items',
            'skill_items',
            'certification_items',
            'created_at',
        ]


class ConsultantListSerializer(serializers.ModelSerializer):
    """Serializer for consultant listing/browse page."""
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    skills_count = serializers.SerializerMethodField()
    top_skills = serializers.SerializerMethodField()

    class Meta:
        model = ConsultantProfile
        fields = [
            'id',
            'user_id',
            'consultant_type',
            'full_name',
            'specialization',
            'experience_years',
            'hourly_rate',
            'avatar',
            'bio',
            'city',
            'availability_status',
            'rating',
            'total_reviews',
            'total_projects_completed',
            'skills_count',
            'top_skills',
        ]

    def get_skills_count(self, obj):
        return obj.skill_items.count()

    def get_top_skills(self, obj):
        skills = obj.skill_items.all()[:5]
        return [s.name for s in skills]


class ProjectInvitationSerializer(serializers.ModelSerializer):
    """Serializer for project invitations."""
    project_title = serializers.CharField(source='project.title', read_only=True)
    consultant_name = serializers.SerializerMethodField()
    invited_by_name = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProjectInvitation
        fields = [
            'id',
            'project',
            'project_title',
            'consultant',
            'consultant_name',
            'invited_by',
            'invited_by_name',
            'message',
            'status',
            'responded_at',
            'expires_at',
            'is_expired',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'invited_by',
            'status',
            'responded_at',
            'created_at',
        ]

    def get_consultant_name(self, obj):
        return obj.consultant.get_full_name()

    def get_invited_by_name(self, obj):
        return obj.invited_by.get_full_name()


class ProjectInvitationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating project invitations."""

    class Meta:
        model = ProjectInvitation
        fields = [
            'project',
            'consultant',
            'message',
            'expires_at',
        ]

    def validate_project(self, value):
        user = self.context['request'].user
        if value.client != user:
            raise serializers.ValidationError("You can only invite consultants to your own projects.")
        if value.status != 'open':
            raise serializers.ValidationError("You can only invite consultants to open projects.")
        return value

    def validate_consultant(self, value):
        if value.role != 'consultant':
            raise serializers.ValidationError("You can only invite consultants.")
        return value

    def validate(self, data):
        # Check if invitation already exists
        if ProjectInvitation.objects.filter(
            project=data['project'],
            consultant=data['consultant']
        ).exists():
            raise serializers.ValidationError("An invitation already exists for this consultant and project.")
        return data

    def create(self, validated_data):
        validated_data['invited_by'] = self.context['request'].user
        return ProjectInvitation.objects.create(**validated_data)


class AvailabilityStatusSerializer(serializers.Serializer):
    """Serializer for updating availability status."""
    availability_status = serializers.ChoiceField(
        choices=ConsultantProfile.AvailabilityStatus.choices
    )
