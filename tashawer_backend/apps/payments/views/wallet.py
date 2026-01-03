"""
Wallet and Deposit views for balance management and funding.
"""

import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from apps.payments.models import (
    Wallet,
    Deposit,
    DepositStatus,
    Transaction,
    TransactionType,
    TransactionStatus,
    WebhookLog,
    WebhookSource,
    WebhookEventType,
    WebhookStatus,
)
from apps.payments.serializers.wallet import (
    WalletSerializer,
    WalletBalanceSerializer,
    DepositListSerializer,
    DepositDetailSerializer,
    DepositInitializeSerializer,
)
from apps.payments.services import TapPaymentGateway
from apps.payments.services.tap_gateway import TapCustomer

logger = logging.getLogger(__name__)


class WalletView(APIView):
    """
    Get wallet details for the authenticated user.
    Creates a wallet if it doesn't exist.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get user's wallet details"""
        wallet = Wallet.get_or_create_wallet(request.user)
        serializer = WalletSerializer(wallet)

        return Response({
            'success': True,
            'data': serializer.data
        })


class WalletBalanceView(APIView):
    """
    Get wallet balance only (lightweight endpoint).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get user's wallet balance"""
        wallet = Wallet.get_or_create_wallet(request.user)

        return Response({
            'success': True,
            'data': {
                'balance': str(wallet.balance),
                'pending_balance': str(wallet.pending_balance),
                'available_balance': str(wallet.available_balance),
                'currency': wallet.currency,
                'status': wallet.status,
            }
        })


class DepositListView(ListAPIView):
    """
    List deposits for the authenticated user.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = DepositListSerializer

    def get_queryset(self):
        return Deposit.objects.filter(
            user=self.request.user
        ).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            return Response({
                'success': True,
                'data': response.data
            })

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': {
                'results': serializer.data,
                'count': queryset.count()
            }
        })


class DepositDetailView(APIView):
    """
    Get deposit details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, reference_number):
        """Get deposit details by reference number"""
        try:
            deposit = Deposit.objects.get(
                reference_number=reference_number,
                user=request.user
            )
        except Deposit.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Deposit not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = DepositDetailSerializer(deposit)
        return Response({
            'success': True,
            'data': serializer.data
        })


class DepositInitializeView(APIView):
    """
    Initialize a deposit to add funds to wallet.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Initialize a deposit.

        Request body:
        - amount: decimal (required) - Amount to deposit (10-100000 SAR)
        - payment_method: string (optional) - Payment method (default: credit_card)
        - return_url: string (optional) - Override default return URL
        """
        serializer = DepositInitializeSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get or create wallet
        wallet = Wallet.get_or_create_wallet(request.user)

        # Check wallet status
        if not wallet.is_active:
            return Response({
                'success': False,
                'message': 'Your wallet is not active. Please contact support.'
            }, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data['amount']
        payment_method = serializer.validated_data.get('payment_method', 'credit_card')

        # Create deposit record
        deposit = Deposit.objects.create(
            wallet=wallet,
            user=request.user,
            amount=amount,
            currency='SAR',
            status=DepositStatus.PENDING,
            payment_method=payment_method,
        )

        logger.info(f"Deposit initialized: {deposit.reference_number} for user {request.user.email}")

        # Initialize Tap Payment Gateway
        gateway = TapPaymentGateway()

        # Check if gateway is configured
        if not gateway.is_configured:
            # Fallback to mock payment for testing
            logger.warning("Tap gateway not configured. Using mock deposit.")
            deposit.status = DepositStatus.PROCESSING
            deposit.save()

            return Response({
                'success': True,
                'message': 'Deposit initialized (test mode)',
                'data': {
                    'deposit_reference': deposit.reference_number,
                    'amount': str(deposit.amount),
                    'currency': deposit.currency,
                    'payment_url': f'/api/v1/payments/deposits/mock/{deposit.reference_number}/',
                    'status': 'processing',
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
        redirect_url = f"{return_url}?deposit={deposit.reference_number}"

        # Webhook URL
        webhook_url = getattr(settings, 'DEPOSIT_WEBHOOK_URL', None)
        if not webhook_url:
            webhook_url = request.build_absolute_uri('/api/v1/payments/deposits/webhook/')

        # Create charge with Tap
        charge_response = gateway.create_charge(
            amount=amount,
            currency='SAR',
            reference_id=deposit.reference_number,
            description=f"Tashawer Wallet Deposit",
            customer=customer,
            redirect_url=redirect_url,
            post_url=webhook_url,
            metadata={
                'deposit_id': str(deposit.id),
                'user_id': str(user.id),
                'type': 'deposit',
            }
        )

        if not charge_response.success:
            # Mark deposit as failed
            deposit.status = DepositStatus.FAILED
            deposit.failure_reason = charge_response.error_message
            deposit.save()

            logger.error(f"Tap charge creation failed for deposit: {charge_response.error_message}")
            return Response({
                'success': False,
                'message': charge_response.error_message or 'Failed to initialize deposit'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Update deposit with Tap charge ID
        deposit.gateway_charge_id = charge_response.charge_id
        deposit.gateway_response = charge_response.raw_response
        deposit.status = DepositStatus.PROCESSING
        deposit.save()

        logger.info(f"Tap charge created for deposit: {charge_response.charge_id}")

        return Response({
            'success': True,
            'message': 'Deposit initialized successfully',
            'data': {
                'deposit_reference': deposit.reference_number,
                'amount': str(deposit.amount),
                'currency': deposit.currency,
                'payment_url': charge_response.payment_url,
                'charge_id': charge_response.charge_id,
                'status': 'processing',
                'test_mode': gateway.is_test_mode
            }
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class DepositWebhookView(APIView):
    """
    Handle Tap Payment Gateway webhooks for deposits.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Handle webhook from Tap payment gateway for deposits.
        """
        gateway = TapPaymentGateway()

        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip_address = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')

        # Verify webhook signature if configured
        signature = request.headers.get('Tap-Signature', '')
        signature_valid = True
        if gateway.webhook_secret and signature:
            if not gateway.verify_webhook_signature(request.body, signature):
                logger.warning("Invalid deposit webhook signature")
                # Log failed signature attempt
                WebhookLog.log_webhook(
                    source=WebhookSource.TAP,
                    event_type=WebhookEventType.DEPOSIT,
                    payload=request.data,
                    headers=dict(request.headers),
                    ip_address=ip_address,
                    signature_valid=False,
                )
                return Response({
                    'success': False,
                    'message': 'Invalid signature'
                }, status=status.HTTP_401_UNAUTHORIZED)

        # Parse webhook data
        try:
            webhook_data = gateway.parse_webhook_data(request.data)
        except Exception as e:
            logger.error(f"Failed to parse deposit webhook data: {str(e)}")
            # Log parsing failure
            WebhookLog.log_webhook(
                source=WebhookSource.TAP,
                event_type=WebhookEventType.DEPOSIT,
                payload=request.data,
                headers=dict(request.headers),
                ip_address=ip_address,
                signature_valid=signature_valid,
            ).mark_failed(f"Failed to parse: {str(e)}")
            return Response({
                'success': False,
                'message': 'Invalid webhook data'
            }, status=status.HTTP_400_BAD_REQUEST)

        reference_id = webhook_data.reference_id
        charge_status = webhook_data.status
        charge_id = webhook_data.charge_id

        # Determine event type based on status
        event_type = WebhookEventType.DEPOSIT
        if gateway.is_successful_status(charge_status):
            event_type = WebhookEventType.CHARGE_CAPTURED
        elif gateway.is_failed_status(charge_status):
            event_type = WebhookEventType.CHARGE_FAILED
        elif gateway.is_cancelled_status(charge_status):
            event_type = WebhookEventType.CHARGE_CANCELLED

        # Log the webhook
        webhook_log = WebhookLog.log_webhook(
            source=WebhookSource.TAP,
            event_type=event_type,
            payload=request.data,
            headers=dict(request.headers),
            reference_number=reference_id,
            gateway_charge_id=charge_id,
            gateway_status=charge_status,
            ip_address=ip_address,
            signature_valid=signature_valid,
        )

        # Check for duplicates
        if webhook_log.is_duplicate:
            logger.info(f"Duplicate deposit webhook received for {reference_id}, attempt #{webhook_log.attempt_count}")
            webhook_log.mark_ignored("Duplicate webhook - already processed")
            return Response({
                'success': True,
                'message': 'Webhook already processed'
            }, status=status.HTTP_200_OK)

        # Find deposit
        deposit = None
        if reference_id and reference_id.startswith('DEP-'):
            try:
                deposit = Deposit.objects.get(reference_number=reference_id)
            except Deposit.DoesNotExist:
                pass

        if not deposit and charge_id:
            try:
                deposit = Deposit.objects.get(gateway_charge_id=charge_id)
                # Update reference number in log
                if deposit:
                    webhook_log.reference_number = deposit.reference_number
                    webhook_log.save(update_fields=['reference_number'])
            except Deposit.DoesNotExist:
                pass

        if not deposit:
            logger.warning(f"Deposit webhook received but deposit not found: {reference_id or charge_id}")
            webhook_log.mark_failed(f"Deposit not found: {reference_id or charge_id}")
            return Response({
                'success': False,
                'message': 'Deposit not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check idempotency - if deposit already completed, skip
        if deposit.status == DepositStatus.COMPLETED and gateway.is_successful_status(charge_status):
            logger.info(f"Deposit {deposit.reference_number} already completed, ignoring webhook")
            webhook_log.mark_ignored("Deposit already completed")
            return Response({
                'success': True,
                'message': 'Deposit already processed'
            }, status=status.HTTP_200_OK)

        # Update deposit based on Tap status
        try:
            if gateway.is_successful_status(charge_status):
                if deposit.status != DepositStatus.COMPLETED:
                    deposit.complete(gateway_response=webhook_data.raw_data)
                    logger.info(f"Deposit completed: {deposit.reference_number}")

            elif gateway.is_failed_status(charge_status):
                deposit.fail(
                    reason=f"Payment failed with status: {charge_status}",
                    gateway_response=webhook_data.raw_data
                )
                logger.warning(f"Deposit failed: {deposit.reference_number}")

            elif gateway.is_cancelled_status(charge_status):
                deposit.cancel()
                logger.info(f"Deposit cancelled: {deposit.reference_number}")

            else:
                # Other statuses
                deposit.gateway_response = webhook_data.raw_data
                deposit.save()
                logger.info(f"Deposit status update: {deposit.reference_number} - {charge_status}")

            # Mark webhook as processed
            webhook_log.response_status = 200
            webhook_log.response_body = {'success': True, 'message': 'Webhook processed successfully'}
            webhook_log.mark_processed()

        except Exception as e:
            logger.error(f"Error processing deposit webhook: {str(e)}")
            webhook_log.mark_failed(str(e))
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'success': True,
            'message': 'Webhook processed successfully'
        }, status=status.HTTP_200_OK)


class DepositStatusView(APIView):
    """
    Check deposit status.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, reference_number):
        """
        Get current deposit status.
        """
        try:
            deposit = Deposit.objects.get(
                reference_number=reference_number,
                user=request.user
            )
        except Deposit.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Deposit not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # If deposit is still processing, check with Tap
        gateway = TapPaymentGateway()
        if (
            gateway.is_configured and
            deposit.status == DepositStatus.PROCESSING and
            deposit.gateway_charge_id
        ):
            try:
                charge_data = gateway.retrieve_charge(deposit.gateway_charge_id)
                charge_status = charge_data.get('status', '')

                if gateway.is_successful_status(charge_status):
                    deposit.complete(gateway_response=charge_data)

                elif gateway.is_failed_status(charge_status):
                    deposit.fail(
                        reason=f"Payment failed with status: {charge_status}",
                        gateway_response=charge_data
                    )

                elif gateway.is_cancelled_status(charge_status):
                    deposit.cancel()

            except Exception as e:
                logger.error(f"Failed to check Tap charge status for deposit: {str(e)}")

        return Response({
            'success': True,
            'data': {
                'reference_number': deposit.reference_number,
                'status': deposit.status,
                'amount': str(deposit.amount),
                'currency': deposit.currency,
                'completed_at': deposit.completed_at,
                'wallet_balance': str(deposit.wallet.balance) if deposit.status == DepositStatus.COMPLETED else None
            }
        })


class MockDepositView(APIView):
    """
    Mock deposit endpoint for testing.
    Only available when Tap is not configured or in test mode.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, reference_number):
        """
        Simulate deposit completion.

        Request body:
        - action: 'complete' or 'fail' or 'cancel'
        """
        gateway = TapPaymentGateway()

        # Only allow mock deposits if Tap is not configured or in test mode
        if gateway.is_configured and not gateway.is_test_mode:
            return Response({
                'success': False,
                'message': 'Mock deposits not available in production'
            }, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action', 'complete')

        try:
            deposit = Deposit.objects.get(
                reference_number=reference_number,
                user=request.user
            )
        except Deposit.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Deposit not found'
            }, status=status.HTTP_404_NOT_FOUND)

        if deposit.status not in [DepositStatus.PENDING, DepositStatus.PROCESSING]:
            return Response({
                'success': False,
                'message': f'Deposit is already {deposit.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        if action == 'complete':
            # Update to processing first if pending
            if deposit.status == DepositStatus.PENDING:
                deposit.status = DepositStatus.PROCESSING
                deposit.save()

            # Complete the deposit
            deposit.gateway_charge_id = f"MOCK-{timezone.now().timestamp()}"
            deposit.complete(gateway_response={'mock': True, 'status': 'CAPTURED'})

            return Response({
                'success': True,
                'message': 'Deposit completed successfully',
                'data': {
                    'deposit_reference': deposit.reference_number,
                    'status': 'completed',
                    'wallet_balance': str(deposit.wallet.balance)
                }
            }, status=status.HTTP_200_OK)

        elif action == 'fail':
            deposit.fail(reason='Mock payment failed')

            return Response({
                'success': True,
                'message': 'Deposit failed',
                'data': {
                    'deposit_reference': deposit.reference_number,
                    'status': 'failed'
                }
            }, status=status.HTTP_200_OK)

        elif action == 'cancel':
            deposit.cancel()

            return Response({
                'success': True,
                'message': 'Deposit cancelled',
                'data': {
                    'deposit_reference': deposit.reference_number,
                    'status': 'cancelled'
                }
            }, status=status.HTTP_200_OK)

        return Response({
            'success': False,
            'message': 'Invalid action'
        }, status=status.HTTP_400_BAD_REQUEST)
