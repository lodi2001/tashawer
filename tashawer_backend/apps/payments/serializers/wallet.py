from rest_framework import serializers
from apps.payments.models import Wallet, WalletStatus, Deposit, DepositStatus


class WalletSerializer(serializers.ModelSerializer):
    """Serializer for wallet details"""

    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)
    available_balance = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = Wallet
        fields = [
            'id',
            'user_email',
            'user_name',
            'balance',
            'pending_balance',
            'available_balance',
            'currency',
            'status',
            'is_active',
            'total_deposited',
            'total_withdrawn',
            'total_earned',
            'total_spent',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'balance',
            'pending_balance',
            'currency',
            'total_deposited',
            'total_withdrawn',
            'total_earned',
            'total_spent',
            'created_at',
            'updated_at',
        ]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class WalletBalanceSerializer(serializers.Serializer):
    """Simple serializer for wallet balance only"""

    balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    available_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField()
    status = serializers.CharField()


class DepositListSerializer(serializers.ModelSerializer):
    """Serializer for deposit list"""

    class Meta:
        model = Deposit
        fields = [
            'id',
            'reference_number',
            'amount',
            'currency',
            'status',
            'payment_method',
            'created_at',
            'completed_at',
        ]


class DepositDetailSerializer(serializers.ModelSerializer):
    """Serializer for deposit details"""

    class Meta:
        model = Deposit
        fields = [
            'id',
            'reference_number',
            'amount',
            'currency',
            'status',
            'payment_method',
            'gateway_charge_id',
            'failure_reason',
            'created_at',
            'completed_at',
        ]


class DepositInitializeSerializer(serializers.Serializer):
    """Serializer for initializing a deposit"""

    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=10,  # Minimum deposit 10 SAR
        max_value=100000,  # Maximum deposit 100,000 SAR
    )
    payment_method = serializers.ChoiceField(
        choices=[
            ('credit_card', 'Credit Card'),
            ('debit_card', 'Debit Card'),
            ('mada', 'Mada'),
            ('apple_pay', 'Apple Pay'),
            ('stc_pay', 'STC Pay'),
        ],
        default='credit_card'
    )
    return_url = serializers.URLField(required=False)

    def validate_amount(self, value):
        """Validate deposit amount"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive")
        return value


class DepositResponseSerializer(serializers.Serializer):
    """Serializer for deposit initialization response"""

    deposit_reference = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField()
    payment_url = serializers.CharField()
    charge_id = serializers.CharField(required=False, allow_null=True)
    status = serializers.CharField()
    test_mode = serializers.BooleanField(required=False)
