import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q

from apps.payments.models import Transaction, TransactionStatus, TransactionType
from apps.payments.serializers import (
    TransactionListSerializer,
    TransactionDetailSerializer,
)

logger = logging.getLogger(__name__)


class TransactionListView(APIView):
    """
    List transactions for the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get list of user's transactions (as payer or payee).

        Query parameters:
        - type: filter by transaction type (optional)
        - status: filter by status (optional)
        - project_id: filter by project (optional)
        - page: page number (default: 1)
        - page_size: items per page (default: 20, max: 50)
        """
        type_filter = request.query_params.get('type')
        status_filter = request.query_params.get('status')
        project_id = request.query_params.get('project_id')

        # Get transactions where user is payer or payee
        transactions = Transaction.objects.filter(
            Q(payer=request.user) | Q(payee=request.user)
        )

        # Apply filters
        if type_filter:
            transactions = transactions.filter(transaction_type=type_filter)
        if status_filter:
            transactions = transactions.filter(status=status_filter)
        if project_id:
            transactions = transactions.filter(project_id=project_id)

        transactions = transactions.order_by('-created_at')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 20)), 50)
        start = (page - 1) * page_size
        end = start + page_size

        total_count = transactions.count()
        transactions = transactions[start:end]

        serializer = TransactionListSerializer(transactions, many=True)

        return Response({
            'success': True,
            'data': {
                'transactions': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                }
            }
        }, status=status.HTTP_200_OK)


class TransactionDetailView(APIView):
    """
    Get transaction details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Get transaction details by ID."""
        transaction = get_object_or_404(
            Transaction.objects.filter(
                Q(payer=request.user) | Q(payee=request.user)
            ),
            pk=pk
        )

        serializer = TransactionDetailSerializer(transaction)

        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class TransactionSummaryView(APIView):
    """
    Get transaction summary for the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get financial summary for the user.

        Returns:
        - Total paid (as client)
        - Total received (as consultant)
        - Pending payments
        - Platform fees paid
        """
        from django.db.models import Sum

        # Total paid (as payer, completed escrow holds)
        total_paid = Transaction.objects.filter(
            payer=request.user,
            transaction_type=TransactionType.ESCROW_HOLD,
            status=TransactionStatus.COMPLETED
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Total received (as payee, completed escrow releases)
        total_received = Transaction.objects.filter(
            payee=request.user,
            transaction_type=TransactionType.ESCROW_RELEASE,
            status=TransactionStatus.COMPLETED
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Pending payments (as payer)
        pending_payments = Transaction.objects.filter(
            payer=request.user,
            status=TransactionStatus.PENDING
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Platform fees (as payer)
        platform_fees = Transaction.objects.filter(
            payer=request.user,
            transaction_type=TransactionType.PLATFORM_FEE,
            status=TransactionStatus.COMPLETED
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Refunds received
        refunds_received = Transaction.objects.filter(
            payee=request.user,
            transaction_type=TransactionType.REFUND,
            status=TransactionStatus.COMPLETED
        ).aggregate(total=Sum('amount'))['total'] or 0

        return Response({
            'success': True,
            'data': {
                'total_paid': str(total_paid),
                'total_received': str(total_received),
                'pending_payments': str(pending_payments),
                'platform_fees_paid': str(platform_fees),
                'refunds_received': str(refunds_received),
                'currency': 'SAR'
            }
        }, status=status.HTTP_200_OK)
