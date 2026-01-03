"""
Order serializers for API responses and requests.
"""

from rest_framework import serializers
from apps.orders.models import Order, OrderStatus, Milestone


class OrderListSerializer(serializers.ModelSerializer):
    """Serializer for order list view"""
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    consultant_name = serializers.CharField(source='consultant.get_full_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    milestone_count = serializers.SerializerMethodField()
    completed_milestones = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'title',
            'status',
            'amount',
            'currency',
            'client_name',
            'consultant_name',
            'project_title',
            'progress_percentage',
            'expected_delivery_date',
            'milestone_count',
            'completed_milestones',
            'is_overdue',
            'created_at',
        ]

    def get_milestone_count(self, obj):
        return obj.milestones.count()

    def get_completed_milestones(self, obj):
        return obj.milestones.filter(status='completed').count()


class OrderDetailSerializer(serializers.ModelSerializer):
    """Serializer for order detail view"""
    client = serializers.SerializerMethodField()
    consultant = serializers.SerializerMethodField()
    project = serializers.SerializerMethodField()
    proposal = serializers.SerializerMethodField()
    escrow = serializers.SerializerMethodField()
    milestones = serializers.SerializerMethodField()
    activities = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'title',
            'description',
            'status',
            'amount',
            'currency',
            'client',
            'consultant',
            'project',
            'proposal',
            'escrow',
            'expected_delivery_date',
            'actual_delivery_date',
            'deadline_extended',
            'original_delivery_date',
            'progress_percentage',
            'max_revisions',
            'revisions_used',
            'client_notes',
            'consultant_notes',
            'confirmed_at',
            'started_at',
            'delivered_at',
            'completed_at',
            'cancelled_at',
            'cancellation_reason',
            'is_active',
            'can_cancel',
            'can_deliver',
            'can_request_revision',
            'is_overdue',
            'milestones',
            'activities',
            'created_at',
            'updated_at',
        ]

    def get_client(self, obj):
        return {
            'id': str(obj.client.id),
            'full_name': obj.client.get_full_name(),
            'email': obj.client.email,
        }

    def get_consultant(self, obj):
        return {
            'id': str(obj.consultant.id),
            'full_name': obj.consultant.get_full_name(),
            'email': obj.consultant.email,
        }

    def get_project(self, obj):
        return {
            'id': str(obj.project.id),
            'title': obj.project.title,
            'status': obj.project.status,
        }

    def get_proposal(self, obj):
        return {
            'id': str(obj.proposal.id),
            'proposed_amount': str(obj.proposal.proposed_amount),
            'estimated_duration': obj.proposal.estimated_duration,
        }

    def get_escrow(self, obj):
        if obj.escrow:
            return {
                'id': str(obj.escrow.id),
                'escrow_reference': obj.escrow.escrow_reference,
                'status': obj.escrow.status,
                'amount': str(obj.escrow.amount),
            }
        return None

    def get_milestones(self, obj):
        from .milestone import MilestoneListSerializer
        milestones = obj.milestones.all().order_by('sequence')
        return MilestoneListSerializer(milestones, many=True).data

    def get_activities(self, obj):
        from .milestone import OrderActivitySerializer
        activities = obj.activities.all()[:20]
        return OrderActivitySerializer(activities, many=True).data


class OrderCreateSerializer(serializers.Serializer):
    """Serializer for creating an order from a proposal"""
    proposal_id = serializers.UUIDField()

    def validate_proposal_id(self, value):
        from apps.proposals.models import Proposal, ProposalStatus

        try:
            proposal = Proposal.objects.get(id=value)
        except Proposal.DoesNotExist:
            raise serializers.ValidationError("Proposal not found")

        if proposal.status != ProposalStatus.ACCEPTED:
            raise serializers.ValidationError("Can only create order from accepted proposals")

        if hasattr(proposal, 'order'):
            raise serializers.ValidationError("Order already exists for this proposal")

        return value


class OrderStartWorkSerializer(serializers.Serializer):
    """Serializer for starting work on an order"""
    notes = serializers.CharField(required=False, allow_blank=True)


class OrderDeliverSerializer(serializers.Serializer):
    """Serializer for delivering an order"""
    notes = serializers.CharField(required=False, allow_blank=True)


class OrderRevisionSerializer(serializers.Serializer):
    """Serializer for requesting revision"""
    feedback = serializers.CharField(required=True, min_length=10)


class OrderCompleteSerializer(serializers.Serializer):
    """Serializer for completing an order"""
    rating = serializers.IntegerField(required=False, min_value=1, max_value=5)
    review = serializers.CharField(required=False, allow_blank=True)


class OrderCancelSerializer(serializers.Serializer):
    """Serializer for cancelling an order"""
    reason = serializers.CharField(required=True, min_length=10)


class OrderExtendDeadlineSerializer(serializers.Serializer):
    """Serializer for extending order deadline"""
    new_deadline = serializers.DateField()
    reason = serializers.CharField(required=False, allow_blank=True)

    def validate_new_deadline(self, value):
        from django.utils import timezone
        if value <= timezone.now().date():
            raise serializers.ValidationError("New deadline must be in the future")
        return value
