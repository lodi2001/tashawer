"""
Payment views for Tap Payment Gateway integration.
"""

import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
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
from apps.payments.services import TapPaymentGateway
from apps.payments.services.tap_gateway import TapCustomer, TapChargeStatus

logger = logging.getLogger(__name__)


class PaymentInitializeView(APIView):
    """
    Initialize a payment for an escrow using Tap Payment Gateway.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Initialize payment for an escrow.

        Request body:
        - escrow_id: uuid (required)
        - payment_method: string (required)
        - return_url: string (optional) - Override default return URL
        """
        serializer = PaymentInitializeSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        escrow = Escrow.objects.get(id=serializer.validated_data['escrow_id'])

        # Verify user is the client
        if escrow.client != request.user:
            return Response({
                'success': False,
                'message': 'Only the client can make payments for this escrow'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check escrow status
        if escrow.status != EscrowStatus.PENDING:
            return Response({
                'success': False,
                'message': f'Escrow is already {escrow.status}. Cannot initialize payment.'
            }, status=status.HTTP_400_BAD_REQUEST)

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

        # Initialize Tap Payment Gateway
        gateway = TapPaymentGateway()

        # Check if gateway is configured
        if not gateway.is_configured:
            # Fallback to mock payment for testing
            logger.warning("Tap gateway not configured. Using mock payment.")
            return Response({
                'success': True,
                'message': 'Payment initialized (test mode)',
                'data': {
                    'transaction_reference': transaction.reference_number,
                    'escrow_reference': escrow.escrow_reference,
                    'amount': str(escrow.amount),
                    'currency': escrow.currency,
                    'payment_url': f'/api/v1/payments/mock-payment/{transaction.reference_number}/',
                    'status': 'pending',
                    'test_mode': True
                }
            }, status=status.HTTP_201_CREATED)

        # Get user details for Tap customer
        user = request.user
        customer = TapCustomer(
            first_name=user.first_name or user.email.split('@')[0],
            last_name=user.last_name or '',
            email=user.email,
            phone_country_code='+966',
            phone_number=getattr(user, 'phone', '') or ''
        )

        # Get callback URLs
        return_url = serializer.validated_data.get('return_url') or settings.PAYMENT_SUCCESS_URL
        redirect_url = f"{return_url}?transaction={transaction.reference_number}"

        # Webhook URL for payment status updates
        webhook_url = settings.PAYMENT_WEBHOOK_URL
        if not webhook_url:
            # Construct webhook URL from request
            webhook_url = request.build_absolute_uri('/api/v1/payments/webhook/')

        # Create charge with Tap
        charge_response = gateway.create_charge(
            amount=escrow.amount,
            currency=escrow.currency,
            reference_id=transaction.reference_number,
            description=f"Tashawer - {escrow.project.title}",
            customer=customer,
            redirect_url=redirect_url,
            post_url=webhook_url,
            metadata={
                'escrow_id': str(escrow.id),
                'project_id': str(escrow.project.id),
                'client_id': str(escrow.client.id),
            }
        )

        if not charge_response.success:
            # Mark transaction as failed
            transaction.status = TransactionStatus.FAILED
            transaction.gateway_response = {'error': charge_response.error_message}
            transaction.save()

            logger.error(f"Tap charge creation failed: {charge_response.error_message}")
            return Response({
                'success': False,
                'message': charge_response.error_message or 'Failed to initialize payment'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Update transaction with Tap charge ID
        transaction.gateway_transaction_id = charge_response.charge_id
        transaction.gateway_response = charge_response.raw_response
        transaction.status = TransactionStatus.PROCESSING
        transaction.save()

        logger.info(f"Tap charge created: {charge_response.charge_id} for transaction {transaction.reference_number}")

        return Response({
            'success': True,
            'message': 'Payment initialized successfully',
            'data': {
                'transaction_reference': transaction.reference_number,
                'escrow_reference': escrow.escrow_reference,
                'amount': str(escrow.amount),
                'currency': escrow.currency,
                'payment_url': charge_response.payment_url,
                'charge_id': charge_response.charge_id,
                'status': 'processing',
                'test_mode': gateway.is_test_mode
            }
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class PaymentWebhookView(APIView):
    """
    Handle Tap Payment Gateway webhooks.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Handle webhook from Tap payment gateway.

        Tap sends webhooks when payment status changes.
        """
        gateway = TapPaymentGateway()

        # Verify webhook signature if configured
        signature = request.headers.get('Tap-Signature', '')
        if gateway.webhook_secret and signature:
            if not gateway.verify_webhook_signature(request.body, signature):
                logger.warning("Invalid webhook signature")
                return Response({
                    'success': False,
                    'message': 'Invalid signature'
                }, status=status.HTTP_401_UNAUTHORIZED)

        # Parse webhook data
        try:
            webhook_data = gateway.parse_webhook_data(request.data)
        except Exception as e:
            logger.error(f"Failed to parse webhook data: {str(e)}")
            return Response({
                'success': False,
                'message': 'Invalid webhook data'
            }, status=status.HTTP_400_BAD_REQUEST)

        reference_id = webhook_data.reference_id
        charge_status = webhook_data.status

        if not reference_id:
            # Try to get from charge ID
            charge_id = webhook_data.charge_id
            if charge_id:
                try:
                    transaction = Transaction.objects.get(gateway_transaction_id=charge_id)
                    reference_id = transaction.reference_number
                except Transaction.DoesNotExist:
                    pass

        if not reference_id:
            logger.warning(f"Webhook received without reference_id: {request.data}")
            return Response({
                'success': False,
                'message': 'Transaction reference not found'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            transaction = Transaction.objects.get(reference_number=reference_id)
        except Transaction.DoesNotExist:
            logger.warning(f"Transaction not found: {reference_id}")
            return Response({
                'success': False,
                'message': 'Transaction not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Update transaction based on Tap status
        if gateway.is_successful_status(charge_status):
            transaction.status = TransactionStatus.COMPLETED
            transaction.gateway_transaction_id = webhook_data.charge_id
            transaction.gateway_response = webhook_data.raw_data
            transaction.completed_at = timezone.now()
            transaction.save()

            # Update escrow status
            if transaction.escrow:
                transaction.escrow.fund()
                transaction.escrow.hold()

            logger.info(f"Payment completed: {transaction.reference_number} (Tap: {webhook_data.charge_id})")

        elif gateway.is_failed_status(charge_status):
            transaction.status = TransactionStatus.FAILED
            transaction.gateway_response = webhook_data.raw_data
            transaction.save()

            logger.warning(f"Payment failed: {transaction.reference_number} - Status: {charge_status}")

        elif gateway.is_cancelled_status(charge_status):
            transaction.status = TransactionStatus.CANCELLED
            transaction.gateway_response = webhook_data.raw_data
            transaction.save()

            logger.info(f"Payment cancelled: {transaction.reference_number}")

        else:
            # Other statuses (IN_PROGRESS, INITIATED, etc.)
            transaction.gateway_response = webhook_data.raw_data
            transaction.save()
            logger.info(f"Payment status update: {transaction.reference_number} - {charge_status}")

        return Response({
            'success': True,
            'message': 'Webhook processed successfully'
        }, status=status.HTTP_200_OK)


class PaymentStatusView(APIView):
    """
    Check payment status for a transaction.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, reference_number):
        """
        Get current payment status.

        This can be used to poll for payment completion.
        """
        try:
            transaction = Transaction.objects.get(reference_number=reference_number)
        except Transaction.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Transaction not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Verify user has access
        if transaction.payer != request.user and transaction.payee != request.user:
            return Response({
                'success': False,
                'message': 'Unauthorized'
            }, status=status.HTTP_403_FORBIDDEN)

        # If transaction is still processing, check with Tap
        gateway = TapPaymentGateway()
        if (
            gateway.is_configured and
            transaction.status == TransactionStatus.PROCESSING and
            transaction.gateway_transaction_id
        ):
            try:
                charge_data = gateway.retrieve_charge(transaction.gateway_transaction_id)
                charge_status = charge_data.get('status', '')

                # Update if status changed
                if gateway.is_successful_status(charge_status):
                    transaction.status = TransactionStatus.COMPLETED
                    transaction.gateway_response = charge_data
                    transaction.completed_at = timezone.now()
                    transaction.save()

                    if transaction.escrow:
                        transaction.escrow.fund()
                        transaction.escrow.hold()

                elif gateway.is_failed_status(charge_status):
                    transaction.status = TransactionStatus.FAILED
                    transaction.gateway_response = charge_data
                    transaction.save()

                elif gateway.is_cancelled_status(charge_status):
                    transaction.status = TransactionStatus.CANCELLED
                    transaction.gateway_response = charge_data
                    transaction.save()

            except Exception as e:
                logger.error(f"Failed to check Tap charge status: {str(e)}")

        return Response({
            'success': True,
            'data': {
                'reference_number': transaction.reference_number,
                'status': transaction.status,
                'amount': str(transaction.amount),
                'currency': transaction.currency,
                'completed_at': transaction.completed_at,
                'escrow_status': transaction.escrow.status if transaction.escrow else None
            }
        })


class MockPaymentView(APIView):
    """
    Mock payment endpoint for testing.
    Only available when Tap is not configured or in test mode.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, reference_number):
        """
        Simulate payment completion.

        Request body:
        - action: 'complete' or 'fail' or 'cancel'
        """
        gateway = TapPaymentGateway()

        # Only allow mock payments if Tap is not configured or in test mode
        if gateway.is_configured and not gateway.is_test_mode:
            return Response({
                'success': False,
                'message': 'Mock payments not available in production'
            }, status=status.HTTP_403_FORBIDDEN)

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

        if transaction.status not in [TransactionStatus.PENDING, TransactionStatus.PROCESSING]:
            return Response({
                'success': False,
                'message': f'Transaction is already {transaction.status}'
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


class PaymentCallbackView(APIView):
    """
    Handle redirect callback from Tap payment page.
    This is where users are redirected after completing payment.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Handle redirect from Tap after payment.

        Query params from Tap:
        - tap_id: Tap charge ID
        """
        tap_id = request.query_params.get('tap_id')
        transaction_ref = request.query_params.get('transaction')

        if not tap_id and not transaction_ref:
            return Response({
                'success': False,
                'message': 'Missing payment reference'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Find transaction
        try:
            if tap_id:
                transaction = Transaction.objects.get(gateway_transaction_id=tap_id)
            else:
                transaction = Transaction.objects.get(reference_number=transaction_ref)
        except Transaction.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Transaction not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check payment status with Tap
        gateway = TapPaymentGateway()
        if gateway.is_configured and transaction.gateway_transaction_id:
            try:
                charge_data = gateway.retrieve_charge(transaction.gateway_transaction_id)
                charge_status = charge_data.get('status', '')

                if gateway.is_successful_status(charge_status):
                    if transaction.status != TransactionStatus.COMPLETED:
                        transaction.status = TransactionStatus.COMPLETED
                        transaction.gateway_response = charge_data
                        transaction.completed_at = timezone.now()
                        transaction.save()

                        if transaction.escrow:
                            transaction.escrow.fund()
                            transaction.escrow.hold()

                elif gateway.is_failed_status(charge_status):
                    transaction.status = TransactionStatus.FAILED
                    transaction.gateway_response = charge_data
                    transaction.save()

                elif gateway.is_cancelled_status(charge_status):
                    transaction.status = TransactionStatus.CANCELLED
                    transaction.gateway_response = charge_data
                    transaction.save()

            except Exception as e:
                logger.error(f"Failed to verify payment on callback: {str(e)}")

        return Response({
            'success': True,
            'data': {
                'reference_number': transaction.reference_number,
                'status': transaction.status,
                'amount': str(transaction.amount),
                'currency': transaction.currency,
                'escrow_reference': transaction.escrow.escrow_reference if transaction.escrow else None
            }
        })
