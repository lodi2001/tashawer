from rest_framework import serializers
from django.core.validators import RegexValidator
from apps.payments.models import Withdrawal, WithdrawalStatus, BankAccount


class BankAccountSerializer(serializers.ModelSerializer):
    """Serializer for bank account details"""

    masked_iban = serializers.SerializerMethodField()

    class Meta:
        model = BankAccount
        fields = [
            'id',
            'bank_name',
            'bank_name_ar',
            'account_holder_name',
            'iban',
            'masked_iban',
            'swift_code',
            'is_verified',
            'is_primary',
            'created_at',
        ]
        read_only_fields = ['id', 'is_verified', 'created_at']

    def get_masked_iban(self, obj):
        """Return masked IBAN for display"""
        if obj.iban:
            return f"{obj.iban[:4]}****{obj.iban[-4:]}"
        return None


class BankAccountCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bank accounts"""

    iban = serializers.CharField(
        max_length=34,
        validators=[
            RegexValidator(
                regex=r'^SA\d{22}$',
                message='IBAN must be a valid Saudi IBAN (SA followed by 22 digits)'
            )
        ]
    )

    class Meta:
        model = BankAccount
        fields = [
            'bank_name',
            'bank_name_ar',
            'account_holder_name',
            'iban',
            'swift_code',
            'is_primary',
        ]

    def validate_iban(self, value):
        """Validate and normalize IBAN"""
        iban = value.replace(' ', '').upper()

        # Check for duplicate IBAN for this user
        user = self.context['request'].user
        if BankAccount.objects.filter(user=user, iban=iban).exists():
            raise serializers.ValidationError("This IBAN is already registered")

        return iban

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class WithdrawalListSerializer(serializers.ModelSerializer):
    """Serializer for withdrawal list"""

    bank_account_display = serializers.SerializerMethodField()

    class Meta:
        model = Withdrawal
        fields = [
            'id',
            'reference_number',
            'amount',
            'fee',
            'net_amount',
            'currency',
            'status',
            'bank_account_display',
            'created_at',
            'completed_at',
        ]

    def get_bank_account_display(self, obj):
        return f"{obj.bank_account.bank_name} - ****{obj.bank_account.iban[-4:]}"


class WithdrawalDetailSerializer(serializers.ModelSerializer):
    """Serializer for withdrawal details"""

    bank_account = BankAccountSerializer(read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Withdrawal
        fields = [
            'id',
            'reference_number',
            'amount',
            'fee',
            'net_amount',
            'currency',
            'status',
            'bank_account',
            'bank_reference',
            'reviewed_by_name',
            'reviewed_at',
            'rejection_reason',
            'approved_at',
            'processed_at',
            'completed_at',
            'user_note',
            'created_at',
        ]

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.email
        return None


class WithdrawalCreateSerializer(serializers.Serializer):
    """Serializer for creating withdrawal request"""

    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=100,  # Minimum withdrawal 100 SAR
        max_value=50000,  # Maximum withdrawal 50,000 SAR per request
    )
    bank_account_id = serializers.UUIDField()
    note = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate_bank_account_id(self, value):
        """Validate bank account belongs to user"""
        user = self.context['request'].user
        try:
            bank_account = BankAccount.objects.get(id=value, user=user)
            if not bank_account.is_verified:
                raise serializers.ValidationError("Bank account must be verified before withdrawal")
            return bank_account
        except BankAccount.DoesNotExist:
            raise serializers.ValidationError("Bank account not found")

    def validate_amount(self, value):
        """Validate withdrawal amount"""
        user = self.context['request'].user
        wallet = getattr(user, 'wallet', None)

        if not wallet:
            raise serializers.ValidationError("No wallet found")

        if value > wallet.balance:
            raise serializers.ValidationError(
                f"Insufficient balance. Available: {wallet.balance} SAR"
            )

        return value


class WithdrawalAdminSerializer(serializers.ModelSerializer):
    """Serializer for admin withdrawal management"""

    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    bank_account = BankAccountSerializer(read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Withdrawal
        fields = [
            'id',
            'reference_number',
            'user_email',
            'user_name',
            'amount',
            'fee',
            'net_amount',
            'currency',
            'status',
            'bank_account',
            'bank_reference',
            'reviewed_by_name',
            'reviewed_at',
            'rejection_reason',
            'approved_at',
            'processed_at',
            'completed_at',
            'user_note',
            'admin_note',
            'created_at',
        ]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.email
        return None


class WithdrawalApproveSerializer(serializers.Serializer):
    """Serializer for approving withdrawal"""

    note = serializers.CharField(max_length=500, required=False, allow_blank=True)


class WithdrawalRejectSerializer(serializers.Serializer):
    """Serializer for rejecting withdrawal"""

    reason = serializers.CharField(max_length=500)


class WithdrawalCompleteSerializer(serializers.Serializer):
    """Serializer for completing withdrawal"""

    bank_reference = serializers.CharField(max_length=100)
    receipt = serializers.FileField(required=False)
