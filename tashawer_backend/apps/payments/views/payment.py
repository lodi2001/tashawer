import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from apps.payments.models import (
    Transaction,
    TransactionType,
    TransactionStatus,
    Escrow,
    EscrowStatus,
)
from apps.payments.serializers import PaymentInitializeSerializer

logger = logging.getLogger(__name__)


class PaymentInitializeView(APIView):
    """
    Initialize a payment for an escrow.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Initialize payment for an escrow.

        Request body:
        - escrow_id: uuid (required)
        - payment_method: string (required)
        - return_url: string (optional)
        """
        serializer = PaymentInitializeSerializer(data=request.data)

        if serializer.is_valid():
            escrow = Escrow.objects.get(id=serializer.validated_data['escrow_id'])

            # Verify user is the client
            if escrow.client != request.user:
                return Response({
                    'success': False,
                    'message': 'Only the client can make payments for this escrow'
                }, status=status.HTTP_403_FORBIDDEN)

            # Create payment transaction
            transaction = Transaction.objects.create(
                payer=escrow.client,
                payee=None,  # Platform holds the money
                transaction_type=TransactionType.ESCROW_HOLD,
                status=TransactionStatus.PENDING,
                amount=escrow.amount,
                currency=escrow.currency,
                payment_method=serializer.validated_data['payment_method'],
                project=escrow.project,
                proposal=escrow.proposal,
                escrow=escrow,
                description=f"Payment for project: {escrow.project.title}"
            )

            logger.info(f"Payment initialized: {transaction.reference_number} for escrow {escrow.escrow_reference}")

            # In a real implementation, you would:
            # 1. Call the payment gateway API to create a payment session
            # 2. Return the payment URL for the client to complete payment
            # For now, we return a mock response

            return Response({
                'success': True,
                'message': 'Payment initialized successfully',
                'data': {
                    'transaction_reference': transaction.reference_number,
                    'escrow_reference': escrow.escrow_reference,
                    'amount': str(escrow.amount),
                    'currency': escrow.currency,
                    # In production, this would be the actual payment gateway URL
                    'payment_url': f'/api/v1/payments/mock-payment/{transaction.reference_number}/',
                    'status': 'pending'
                }
            }, status=status.HTTP_201_CREATED)

        return Response({
            'success': False,
            'message': 'Validation error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class PaymentWebhookView(APIView):
    """
    Handle payment gateway webhooks.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Handle webhook from payment gateway.

        This endpoint would be called by the payment gateway
        when payment status changes.
        """
        # In production, you would:
        # 1. Verify the webhook signature
        # 2. Parse the gateway-specific payload
        # 3. Update transaction and escrow status accordingly

        transaction_reference = request.data.get('transaction_reference')
        payment_status = request.data.get('status')
        gateway_transaction_id = request.data.get('gateway_transaction_id')

        if not transaction_reference:
            return Response({
                'success': False,
                'message': 'Transaction reference is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            transaction = Transaction.objects.get(reference_number=transaction_reference)
        except Transaction.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Transaction not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Update transaction based on payment status
        if payment_status == 'success':
            transaction.status = TransactionStatus.COMPLETED
            transaction.gateway_transaction_id = gateway_transaction_id
            transaction.gateway_response = request.data
            transaction.completed_at = timezone.now()
            transaction.save()

            # Update escrow status
            if transaction.escrow:
                transaction.escrow.fund()
                transaction.escrow.hold()

            logger.info(f"Payment completed: {transaction.reference_number}")

        elif payment_status == 'failed':
            transaction.status = TransactionStatus.FAILED
            transaction.gateway_response = request.data
            transaction.save()

            logger.warning(f"Payment failed: {transaction.reference_number}")

        elif payment_status == 'cancelled':
            transaction.status = TransactionStatus.CANCELLED
            transaction.gateway_response = request.data
            transaction.save()

            logger.info(f"Payment cancelled: {transaction.reference_number}")

        return Response({
            'success': True,
            'message': 'Webhook processed successfully'
        }, status=status.HTTP_200_OK)


class MockPaymentView(APIView):
    """
    Mock payment endpoint for testing.
    In production, this would be handled by the actual payment gateway.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, reference_number):
        """
        Simulate payment completion.

        Request body:
        - action: 'complete' or 'fail' or 'cancel'
        """
        action = request.data.get('action', 'complete')

        try:
            transaction = Transaction.objects.get(reference_number=reference_number)
        except Transaction.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Transaction not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Verify user is the payer
        if transaction.payer != request.user:
            return Response({
                'success': False,
                'message': 'Unauthorized'
            }, status=status.HTTP_403_FORBIDDEN)

        if transaction.status != TransactionStatus.PENDING:
            return Response({
                'success': False,
                'message': 'Transaction is not in pending status'
            }, status=status.HTTP_400_BAD_REQUEST)

        if action == 'complete':
            transaction.status = TransactionStatus.COMPLETED
            transaction.gateway_transaction_id = f"MOCK-{timezone.now().timestamp()}"
            transaction.completed_at = timezone.now()
            transaction.save()

            # Update escrow status
            if transaction.escrow:
                transaction.escrow.fund()
                transaction.escrow.hold()

            return Response({
                'success': True,
                'message': 'Payment completed successfully',
                'data': {
                    'transaction_reference': transaction.reference_number,
                    'status': 'completed'
                }
            }, status=status.HTTP_200_OK)

        elif action == 'fail':
            transaction.status = TransactionStatus.FAILED
            transaction.save()

            return Response({
                'success': True,
                'message': 'Payment failed',
                'data': {
                    'transaction_reference': transaction.reference_number,
                    'status': 'failed'
                }
            }, status=status.HTTP_200_OK)

        elif action == 'cancel':
            transaction.status = TransactionStatus.CANCELLED
            transaction.save()

            return Response({
                'success': True,
                'message': 'Payment cancelled',
                'data': {
                    'transaction_reference': transaction.reference_number,
                    'status': 'cancelled'
                }
            }, status=status.HTTP_200_OK)

        return Response({
            'success': False,
            'message': 'Invalid action'
        }, status=status.HTTP_400_BAD_REQUEST)
