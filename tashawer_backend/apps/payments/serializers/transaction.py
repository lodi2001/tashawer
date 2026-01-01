from rest_framework import serializers
from apps.payments.models import Transaction, TransactionType, TransactionStatus, PaymentMethod


class TransactionListSerializer(serializers.ModelSerializer):
    """Serializer for listing transactions"""
    payer_name = serializers.CharField(source='payer.get_full_name', read_only=True)
    payee_name = serializers.SerializerMethodField()
    project_title = serializers.CharField(source='project.title', read_only=True, allow_null=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'reference_number',
            'transaction_type',
            'status',
            'amount',
            'currency',
            'payment_method',
            'payer_name',
            'payee_name',
            'project_title',
            'description',
            'created_at',
            'completed_at',
        ]

    def get_payee_name(self, obj):
        if obj.payee:
            return obj.payee.get_full_name()
        return 'Tashawer Platform'


class TransactionDetailSerializer(serializers.ModelSerializer):
    """Detailed transaction serializer"""
    payer = serializers.SerializerMethodField()
    payee = serializers.SerializerMethodField()
    project = serializers.SerializerMethodField()
    proposal = serializers.SerializerMethodField()
    escrow = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id',
            'reference_number',
            'transaction_type',
            'status',
            'amount',
            'currency',
            'payment_method',
            'payer',
            'payee',
            'project',
            'proposal',
            'escrow',
            'gateway_transaction_id',
            'description',
            'created_at',
            'completed_at',
        ]

    def get_payer(self, obj):
        return {
            'id': str(obj.payer.id),
            'name': obj.payer.get_full_name(),
            'email': obj.payer.email,
        }

    def get_payee(self, obj):
        if obj.payee:
            return {
                'id': str(obj.payee.id),
                'name': obj.payee.get_full_name(),
                'email': obj.payee.email,
            }
        return {'name': 'Tashawer Platform'}

    def get_project(self, obj):
        if obj.project:
            return {
                'id': str(obj.project.id),
                'title': obj.project.title,
            }
        return None

    def get_proposal(self, obj):
        if obj.proposal:
            return {
                'id': str(obj.proposal.id),
            }
        return None

    def get_escrow(self, obj):
        if obj.escrow:
            return {
                'id': str(obj.escrow.id),
                'reference': obj.escrow.escrow_reference,
            }
        return None


class PaymentInitializeSerializer(serializers.Serializer):
    """Serializer for initializing a payment"""
    escrow_id = serializers.UUIDField(required=True)
    payment_method = serializers.ChoiceField(choices=PaymentMethod.choices, required=True)
    return_url = serializers.URLField(required=False)

    def validate_escrow_id(self, value):
        from apps.payments.models import Escrow, EscrowStatus
        try:
            escrow = Escrow.objects.get(id=value)
            if escrow.status != EscrowStatus.PENDING:
                raise serializers.ValidationError("Escrow is not in pending status")
            return value
        except Escrow.DoesNotExist:
            raise serializers.ValidationError("Escrow not found")
