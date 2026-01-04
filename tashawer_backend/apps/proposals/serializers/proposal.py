from rest_framework import serializers
from django.utils import timezone
from apps.proposals.models import Proposal, ProposalStatus
from apps.projects.models import Project, ProjectStatus


class ConsultantInfoSerializer(serializers.Serializer):
    """Minimal consultant info for proposal display"""
    id = serializers.UUIDField()
    full_name = serializers.SerializerMethodField()
    user_type = serializers.CharField()

    def get_full_name(self, obj):
        return obj.get_full_name()


class ProjectInfoSerializer(serializers.Serializer):
    """Minimal project info for proposal display"""
    id = serializers.UUIDField()
    title = serializers.CharField()
    budget_range = serializers.CharField()
    deadline = serializers.DateField()
    status = serializers.CharField()
    client_id = serializers.UUIDField()


class ProposalListSerializer(serializers.ModelSerializer):
    """Serializer for proposal listing (minimal data)"""

    consultant = ConsultantInfoSerializer(read_only=True)
    project = ProjectInfoSerializer(read_only=True)

    class Meta:
        model = Proposal
        fields = [
            'id',
            'project',
            'consultant',
            'proposed_amount',
            'estimated_duration',
            'delivery_date',
            'status',
            'submitted_at',
            'created_at',
        ]
        read_only_fields = fields


class ProposalDetailSerializer(serializers.ModelSerializer):
    """Serializer for full proposal details"""

    consultant = ConsultantInfoSerializer(read_only=True)
    project = ProjectInfoSerializer(read_only=True)
    is_editable = serializers.BooleanField(read_only=True)
    can_withdraw = serializers.BooleanField(read_only=True)
    is_owner = serializers.SerializerMethodField()
    is_project_owner = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = [
            'id',
            'project',
            'consultant',
            'cover_letter',
            'proposed_amount',
            'estimated_duration',
            'delivery_date',
            'status',
            'rejection_reason',
            'is_editable',
            'can_withdraw',
            'is_owner',
            'is_project_owner',
            'submitted_at',
            'reviewed_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.consultant_id == request.user.id
        return False

    def get_is_project_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.project.client_id == request.user.id
        return False


class ProposalCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new proposal"""

    project_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Proposal
        fields = [
            'id',
            'project_id',
            'cover_letter',
            'proposed_amount',
            'estimated_duration',
            'delivery_date',
        ]
        read_only_fields = ['id']

    def validate_project_id(self, value):
        try:
            project = Project.objects.get(id=value)
        except Project.DoesNotExist:
            raise serializers.ValidationError("Project not found")

        if project.status != ProjectStatus.OPEN:
            raise serializers.ValidationError("Project is not open for proposals")

        return value

    def validate_cover_letter(self, value):
        if len(value) < 100:
            raise serializers.ValidationError("Cover letter must be at least 100 characters")
        return value

    def validate_proposed_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Proposed amount must be positive")
        return value

    def validate_delivery_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Delivery date cannot be in the past")
        return value

    def validate(self, data):
        project_id = data.get('project_id')
        request = self.context.get('request')

        # Check if consultant already submitted a proposal
        if Proposal.objects.filter(
            project_id=project_id,
            consultant=request.user
        ).exists():
            raise serializers.ValidationError({
                'project_id': 'You have already submitted a proposal to this project'
            })

        # Check if delivery date is within project deadline
        project = Project.objects.get(id=project_id)
        delivery_date = data.get('delivery_date')
        if delivery_date and delivery_date > project.deadline:
            raise serializers.ValidationError({
                'delivery_date': 'Delivery date must be on or before the project deadline'
            })

        return data

    def create(self, validated_data):
        project_id = validated_data.pop('project_id')
        validated_data['project_id'] = project_id
        validated_data['consultant'] = self.context['request'].user
        validated_data['status'] = ProposalStatus.SUBMITTED
        validated_data['submitted_at'] = timezone.now()

        return super().create(validated_data)


class ProposalUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a proposal"""

    class Meta:
        model = Proposal
        fields = [
            'cover_letter',
            'proposed_amount',
            'estimated_duration',
            'delivery_date',
        ]

    def validate_cover_letter(self, value):
        if len(value) < 100:
            raise serializers.ValidationError("Cover letter must be at least 100 characters")
        return value

    def validate_proposed_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Proposed amount must be positive")
        return value

    def validate_delivery_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Delivery date cannot be in the past")
        return value

    def validate(self, data):
        instance = self.instance

        # Check if proposal is editable
        if not instance.is_editable:
            raise serializers.ValidationError(
                "This proposal cannot be edited in its current status"
            )

        # Check if delivery date is within project deadline
        delivery_date = data.get('delivery_date', instance.delivery_date)
        if delivery_date and delivery_date > instance.project.deadline:
            raise serializers.ValidationError({
                'delivery_date': 'Delivery date must be on or before the project deadline'
            })

        return data
