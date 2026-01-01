from rest_framework import serializers
from apps.payments.models import Invoice, InvoiceStatus, InvoiceType


class InvoiceListSerializer(serializers.ModelSerializer):
    """Serializer for listing invoices"""
    issued_to_name = serializers.CharField(source='issued_to.get_full_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True, allow_null=True)

    class Meta:
        model = Invoice
        fields = [
            'id',
            'invoice_number',
            'invoice_type',
            'status',
            'subtotal',
            'vat_rate',
            'vat_amount',
            'total',
            'currency',
            'issued_to_name',
            'issued_by',
            'project_title',
            'issue_date',
            'due_date',
            'paid_date',
            'created_at',
        ]


class InvoiceDetailSerializer(serializers.ModelSerializer):
    """Detailed invoice serializer"""
    issued_to = serializers.SerializerMethodField()
    project = serializers.SerializerMethodField()
    escrow = serializers.SerializerMethodField()
    transaction = serializers.SerializerMethodField()
    has_pdf = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id',
            'invoice_number',
            'invoice_type',
            'status',
            'subtotal',
            'vat_rate',
            'vat_amount',
            'total',
            'currency',
            'issued_to',
            'issued_by',
            'project',
            'escrow',
            'transaction',
            'description',
            'line_items',
            'issue_date',
            'due_date',
            'paid_date',
            'has_pdf',
            'created_at',
        ]

    def get_issued_to(self, obj):
        return {
            'id': str(obj.issued_to.id),
            'name': obj.issued_to.get_full_name(),
            'email': obj.issued_to.email,
        }

    def get_project(self, obj):
        if obj.project:
            return {
                'id': str(obj.project.id),
                'title': obj.project.title,
            }
        return None

    def get_escrow(self, obj):
        if obj.escrow:
            return {
                'id': str(obj.escrow.id),
                'reference': obj.escrow.escrow_reference,
            }
        return None

    def get_transaction(self, obj):
        if obj.transaction:
            return {
                'id': str(obj.transaction.id),
                'reference': obj.transaction.reference_number,
            }
        return None

    def get_has_pdf(self, obj):
        return bool(obj.pdf_file)


class InvoiceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating invoices (admin use)"""

    class Meta:
        model = Invoice
        fields = [
            'issued_to',
            'invoice_type',
            'subtotal',
            'vat_rate',
            'project',
            'escrow',
            'transaction',
            'description',
            'line_items',
            'issue_date',
            'due_date',
        ]

    def create(self, validated_data):
        from decimal import Decimal

        subtotal = validated_data.get('subtotal')
        vat_rate = validated_data.get('vat_rate', Decimal('15.00'))
        vat_amount = subtotal * (vat_rate / Decimal('100'))
        total = subtotal + vat_amount

        validated_data['vat_amount'] = vat_amount
        validated_data['total'] = total

        return super().create(validated_data)
