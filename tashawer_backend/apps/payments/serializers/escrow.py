from rest_framework import serializers
from decimal import Decimal
from apps.payments.models import Escrow, EscrowStatus


# Platform fee percentage (e.g., 10%)
PLATFORM_FEE_PERCENTAGE = Decimal('10.00')


class EscrowListSerializer(serializers.ModelSerializer):
    """Serializer for listing escrows"""
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    consultant_name = serializers.CharField(source='consultant.get_full_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = Escrow
        fields = [
            'id',
            'escrow_reference',
            'status',
            'amount',
            'platform_fee',
            'consultant_amount',
            'currency',
            'client_name',
            'consultant_name',
            'project_title',
            'created_at',
            'funded_at',
            'released_at',
        ]


class EscrowDetailSerializer(serializers.ModelSerializer):
    """Detailed escrow serializer"""
    client = serializers.SerializerMethodField()
    consultant = serializers.SerializerMethodField()
    project = serializers.SerializerMethodField()
    proposal = serializers.SerializerMethodField()
    can_release = serializers.BooleanField(read_only=True)
    can_refund = serializers.BooleanField(read_only=True)

    class Meta:
        model = Escrow
        fields = [
            'id',
            'escrow_reference',
            'status',
            'amount',
            'platform_fee',
            'consultant_amount',
            'currency',
            'client',
            'consultant',
            'project',
            'proposal',
            'can_release',
            'can_refund',
            'created_at',
            'funded_at',
            'released_at',
            'refunded_at',
            'release_note',
            'refund_reason',
        ]

    def get_client(self, obj):
        return {
            'id': str(obj.client.id),
            'name': obj.client.get_full_name(),
            'email': obj.client.email,
        }

    def get_consultant(self, obj):
        return {
            'id': str(obj.consultant.id),
            'name': obj.consultant.get_full_name(),
            'email': obj.consultant.email,
        }

    def get_project(self, obj):
        return {
            'id': str(obj.project.id),
            'title': obj.project.title,
        }

    def get_proposal(self, obj):
        return {
            'id': str(obj.proposal.id),
            'proposed_amount': str(obj.proposal.proposed_amount),
        }


class EscrowCreateSerializer(serializers.Serializer):
    """Serializer for creating an escrow"""
    proposal_id = serializers.UUIDField(required=True)

    def validate_proposal_id(self, value):
        from apps.proposals.models import Proposal, ProposalStatus

        try:
            proposal = Proposal.objects.get(id=value)
        except Proposal.DoesNotExist:
            raise serializers.ValidationError("Proposal not found")

        if proposal.status != ProposalStatus.ACCEPTED:
            raise serializers.ValidationError("Proposal must be accepted to create escrow")

        # Check if escrow already exists
        if Escrow.objects.filter(proposal=proposal).exists():
            raise serializers.ValidationError("Escrow already exists for this proposal")

        return value

    def create(self, validated_data):
        from apps.proposals.models import Proposal

        proposal = Proposal.objects.get(id=validated_data['proposal_id'])
        amount = proposal.proposed_amount
        platform_fee = amount * (PLATFORM_FEE_PERCENTAGE / Decimal('100'))
        consultant_amount = amount - platform_fee

        escrow = Escrow.objects.create(
            client=proposal.project.client,
            consultant=proposal.consultant,
            project=proposal.project,
            proposal=proposal,
            amount=amount,
            platform_fee=platform_fee,
            consultant_amount=consultant_amount,
        )

        return escrow


class EscrowReleaseSerializer(serializers.Serializer):
    """Serializer for releasing escrow"""
    note = serializers.CharField(required=False, allow_blank=True)


class EscrowRefundSerializer(serializers.Serializer):
    """Serializer for refunding escrow"""
    reason = serializers.CharField(required=True, min_length=10)
