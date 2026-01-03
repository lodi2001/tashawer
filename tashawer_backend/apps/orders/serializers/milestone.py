"""
Milestone and Deliverable serializers for API responses and requests.
"""

from rest_framework import serializers
from apps.orders.models import Milestone, MilestoneStatus, Deliverable, OrderActivity


class DeliverableSerializer(serializers.ModelSerializer):
    """Serializer for deliverable files"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Deliverable
        fields = [
            'id',
            'title',
            'original_filename',
            'file_url',
            'file_size',
            'file_type',
            'version',
            'is_final',
            'uploaded_by_name',
            'created_at',
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class DeliverableCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating deliverables"""

    class Meta:
        model = Deliverable
        fields = [
            'file',
            'title',
            'is_final',
        ]

    def create(self, validated_data):
        file = validated_data['file']
        validated_data['original_filename'] = file.name
        validated_data['file_size'] = file.size
        validated_data['file_type'] = file.content_type or 'application/octet-stream'

        # Determine version number
        milestone = validated_data.get('milestone')
        if milestone:
            existing_count = milestone.deliverables.count()
            validated_data['version'] = existing_count + 1

        return super().create(validated_data)


class MilestoneListSerializer(serializers.ModelSerializer):
    """Serializer for milestone list view"""
    deliverable_count = serializers.SerializerMethodField()

    class Meta:
        model = Milestone
        fields = [
            'id',
            'sequence',
            'title',
            'description',
            'status',
            'due_date',
            'completed_date',
            'amount',
            'is_paid',
            'is_overdue',
            'deliverable_count',
            'created_at',
        ]

    def get_deliverable_count(self, obj):
        return obj.deliverables.count()


class MilestoneDetailSerializer(serializers.ModelSerializer):
    """Serializer for milestone detail view"""
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    deliverables = DeliverableSerializer(many=True, read_only=True)
    approved_by_name = serializers.CharField(
        source='approved_by.get_full_name',
        read_only=True,
        default=None
    )

    class Meta:
        model = Milestone
        fields = [
            'id',
            'order_number',
            'sequence',
            'title',
            'description',
            'status',
            'due_date',
            'completed_date',
            'amount',
            'is_paid',
            'paid_at',
            'client_feedback',
            'consultant_notes',
            'approved_by_name',
            'approved_at',
            'submitted_at',
            'is_overdue',
            'can_start',
            'can_submit',
            'can_approve',
            'can_request_revision',
            'deliverables',
            'created_at',
            'updated_at',
        ]


class MilestoneCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating milestones"""

    class Meta:
        model = Milestone
        fields = [
            'title',
            'description',
            'due_date',
            'amount',
            'sequence',
        ]

    def validate_due_date(self, value):
        from django.utils import timezone
        if value < timezone.now().date():
            raise serializers.ValidationError("Due date cannot be in the past")
        return value


class MilestoneUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating milestones"""

    class Meta:
        model = Milestone
        fields = [
            'title',
            'description',
            'due_date',
            'amount',
        ]

    def validate_due_date(self, value):
        from django.utils import timezone
        if value < timezone.now().date():
            raise serializers.ValidationError("Due date cannot be in the past")
        return value


class MilestoneSubmitSerializer(serializers.Serializer):
    """Serializer for submitting a milestone"""
    notes = serializers.CharField(required=False, allow_blank=True)


class MilestoneRevisionSerializer(serializers.Serializer):
    """Serializer for requesting milestone revision"""
    feedback = serializers.CharField(required=True, min_length=10)


class MilestoneApproveSerializer(serializers.Serializer):
    """Serializer for approving a milestone"""
    feedback = serializers.CharField(required=False, allow_blank=True)


class OrderActivitySerializer(serializers.ModelSerializer):
    """Serializer for order activity log"""
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderActivity
        fields = [
            'id',
            'activity_type',
            'description',
            'user_name',
            'metadata',
            'created_at',
        ]

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name()
        return 'System'
