"""
Dispute serializers for API endpoints.
"""

from rest_framework import serializers
from apps.disputes.models import (
    Dispute,
    DisputeEvidence,
    DisputeMessage,
    DisputeActivity,
    DisputeReason,
    DisputeStatus,
    ResolutionType,
)


class UserInfoSerializer(serializers.Serializer):
    """Minimal user info serializer."""
    id = serializers.UUIDField()
    full_name = serializers.CharField()
    email = serializers.EmailField()


class OrderInfoSerializer(serializers.Serializer):
    """Minimal order info for dispute context."""
    id = serializers.UUIDField()
    order_number = serializers.CharField()
    project_title = serializers.SerializerMethodField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()

    def get_project_title(self, obj):
        return obj.project.title if obj.project else None


class DisputeActivitySerializer(serializers.ModelSerializer):
    """Serializer for dispute activity logs."""
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = DisputeActivity
        fields = [
            'id',
            'activity_type',
            'description',
            'user_name',
            'metadata',
            'created_at',
        ]

    def get_user_name(self, obj):
        return obj.user.full_name if obj.user else None


class DisputeEvidenceSerializer(serializers.ModelSerializer):
    """Serializer for dispute evidence files."""
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DisputeEvidence
        fields = [
            'id',
            'file',
            'original_filename',
            'file_size',
            'file_type',
            'description',
            'uploaded_by',
            'uploaded_by_name',
            'created_at',
        ]

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.full_name if obj.uploaded_by else None


class DisputeEvidenceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating dispute evidence."""
    class Meta:
        model = DisputeEvidence
        fields = ['file', 'description']

    def validate_file(self, value):
        # Max file size: 10MB
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError('File size must be less than 10MB')
        return value


class DisputeMessageSerializer(serializers.ModelSerializer):
    """Serializer for dispute messages."""
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.SerializerMethodField()

    class Meta:
        model = DisputeMessage
        fields = [
            'id',
            'message',
            'sender',
            'sender_name',
            'sender_role',
            'is_admin_message',
            'is_internal_note',
            'created_at',
        ]

    def get_sender_name(self, obj):
        return obj.sender.full_name if obj.sender else None

    def get_sender_role(self, obj):
        if obj.sender:
            return obj.sender.role
        return None


class DisputeMessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating dispute messages."""
    class Meta:
        model = DisputeMessage
        fields = ['message', 'is_internal_note']

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError('Message cannot be empty')
        return value


class DisputeListSerializer(serializers.ModelSerializer):
    """Serializer for listing disputes."""
    order_number = serializers.CharField(source='order.order_number')
    project_title = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    consultant_name = serializers.SerializerMethodField()
    initiated_by_name = serializers.SerializerMethodField()
    reason_display = serializers.CharField(source='get_reason_display')
    status_display = serializers.CharField(source='get_status_display')

    class Meta:
        model = Dispute
        fields = [
            'id',
            'dispute_number',
            'order_number',
            'project_title',
            'client_name',
            'consultant_name',
            'initiated_by',
            'initiated_by_name',
            'reason',
            'reason_display',
            'status',
            'status_display',
            'disputed_amount',
            'created_at',
            'response_deadline',
        ]

    def get_project_title(self, obj):
        return obj.order.project.title if obj.order.project else None

    def get_client_name(self, obj):
        return obj.client.full_name if obj.client else None

    def get_consultant_name(self, obj):
        return obj.consultant.full_name if obj.consultant else None

    def get_initiated_by_name(self, obj):
        return obj.initiated_by.full_name if obj.initiated_by else None


class DisputeDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for dispute."""
    order = OrderInfoSerializer()
    client = UserInfoSerializer()
    consultant = UserInfoSerializer()
    initiated_by_info = UserInfoSerializer(source='initiated_by')
    assigned_admin_info = UserInfoSerializer(source='assigned_admin', allow_null=True)
    resolved_by_info = UserInfoSerializer(source='resolved_by', allow_null=True)
    reason_display = serializers.CharField(source='get_reason_display')
    status_display = serializers.CharField(source='get_status_display')
    resolution_type_display = serializers.SerializerMethodField()
    evidence = DisputeEvidenceSerializer(many=True, read_only=True)
    messages = serializers.SerializerMethodField()
    activities = DisputeActivitySerializer(many=True, read_only=True)
    is_initiator = serializers.SerializerMethodField()
    can_respond = serializers.BooleanField(read_only=True)
    can_resolve = serializers.BooleanField(read_only=True)
    is_open = serializers.BooleanField(read_only=True)

    class Meta:
        model = Dispute
        fields = [
            'id',
            'dispute_number',
            'order',
            'client',
            'consultant',
            'initiated_by',
            'initiated_by_info',
            'assigned_admin',
            'assigned_admin_info',
            'reason',
            'reason_display',
            'description',
            'desired_resolution',
            'status',
            'status_display',
            'disputed_amount',
            'resolution_type',
            'resolution_type_display',
            'resolution_amount',
            'resolution_notes',
            'resolved_by',
            'resolved_by_info',
            'resolved_at',
            'response_deadline',
            'evidence',
            'messages',
            'activities',
            'is_initiator',
            'can_respond',
            'can_resolve',
            'is_open',
            'created_at',
            'updated_at',
        ]

    def get_resolution_type_display(self, obj):
        return obj.get_resolution_type_display() if obj.resolution_type else None

    def get_messages(self, obj):
        """Return messages, filtering internal notes for non-admins."""
        request = self.context.get('request')
        messages = obj.messages.all()

        # Filter out internal notes for non-admin users
        if request and request.user.role != 'admin':
            messages = messages.filter(is_internal_note=False)

        return DisputeMessageSerializer(messages, many=True).data

    def get_is_initiator(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.initiated_by == request.user
        return False


class DisputeCreateSerializer(serializers.Serializer):
    """Serializer for creating a dispute."""
    order_id = serializers.UUIDField()
    reason = serializers.ChoiceField(choices=DisputeReason.choices)
    description = serializers.CharField(min_length=20)
    desired_resolution = serializers.CharField(required=False, allow_blank=True)

    def validate_order_id(self, value):
        from apps.orders.models import Order, OrderStatus

        try:
            order = Order.objects.get(id=value)
        except Order.DoesNotExist:
            raise serializers.ValidationError('Order not found')

        # Check if order is in a state that allows disputes
        allowed_statuses = [
            OrderStatus.IN_PROGRESS,
            OrderStatus.UNDER_REVIEW,
            OrderStatus.REVISION_REQUESTED,
        ]
        if order.status not in allowed_statuses:
            raise serializers.ValidationError(
                f'Cannot create dispute for order with status: {order.status}'
            )

        # Check if there's already an open dispute
        if order.disputes.filter(status__in=[
            DisputeStatus.OPEN,
            DisputeStatus.UNDER_REVIEW,
            DisputeStatus.AWAITING_RESPONSE,
            DisputeStatus.IN_MEDIATION,
            DisputeStatus.ESCALATED,
        ]).exists():
            raise serializers.ValidationError('Order already has an open dispute')

        return value

    def validate(self, data):
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError('Authentication required')

        from apps.orders.models import Order
        order = Order.objects.get(id=data['order_id'])

        # Verify user is client or consultant of the order
        if order.client != request.user and order.consultant != request.user:
            raise serializers.ValidationError('You are not a party to this order')

        return data


class DisputeResolutionSerializer(serializers.Serializer):
    """Serializer for resolving a dispute (admin only)."""
    resolution_type = serializers.ChoiceField(choices=ResolutionType.choices)
    resolution_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True
    )
    resolution_notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        resolution_type = data.get('resolution_type')
        resolution_amount = data.get('resolution_amount')

        # Partial refund/release requires an amount
        if resolution_type in [
            ResolutionType.PARTIAL_REFUND_CLIENT,
            ResolutionType.PARTIAL_RELEASE_CONSULTANT,
        ] and not resolution_amount:
            raise serializers.ValidationError({
                'resolution_amount': 'Amount is required for partial resolution'
            })

        return data


class DisputeAssignSerializer(serializers.Serializer):
    """Serializer for assigning admin to dispute."""
    admin_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_admin_id(self, value):
        if value:
            from apps.accounts.models import User
            try:
                admin = User.objects.get(id=value, role='admin')
            except User.DoesNotExist:
                raise serializers.ValidationError('Admin user not found')
        return value


class DisputeResponseSerializer(serializers.Serializer):
    """Serializer for responding to a dispute."""
    response = serializers.CharField(min_length=10)
    evidence = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        max_length=5
    )
