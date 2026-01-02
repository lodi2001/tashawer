"""
Tap Payment Gateway Integration Service.

Tap Payments (https://www.tap.company/) is a leading payment gateway
for the Middle East region supporting credit/debit cards, mada, Apple Pay, etc.

API Documentation: https://developers.tap.company/reference
"""

import hashlib
import hmac
import json
import logging
from dataclasses import dataclass
from decimal import Decimal
from enum import Enum
from typing import Any, Optional

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class TapEnvironment(Enum):
    """Tap API environments."""
    TEST = 'test'
    PRODUCTION = 'production'


class TapPaymentMethod(Enum):
    """Supported payment methods in Tap."""
    CREDIT_CARD = 'CREDIT_CARD'
    DEBIT_CARD = 'DEBIT_CARD'
    MADA = 'MADA'
    APPLE_PAY = 'APPLEPAY'
    STC_PAY = 'STC_PAY'
    KNET = 'KNET'
    BENEFIT = 'BENEFIT'


class TapChargeStatus(Enum):
    """Tap charge statuses."""
    INITIATED = 'INITIATED'
    IN_PROGRESS = 'IN_PROGRESS'
    ABANDONED = 'ABANDONED'
    CANCELLED = 'CANCELLED'
    FAILED = 'FAILED'
    DECLINED = 'DECLINED'
    RESTRICTED = 'RESTRICTED'
    CAPTURED = 'CAPTURED'
    VOID = 'VOID'
    TIMEDOUT = 'TIMEDOUT'
    UNKNOWN = 'UNKNOWN'


@dataclass
class TapCustomer:
    """Customer data for Tap payments."""
    first_name: str
    last_name: str
    email: str
    phone_country_code: str = '+966'  # Saudi Arabia default
    phone_number: str = ''


@dataclass
class TapChargeResponse:
    """Response from Tap charge creation."""
    success: bool
    charge_id: Optional[str] = None
    status: Optional[str] = None
    payment_url: Optional[str] = None
    error_message: Optional[str] = None
    raw_response: Optional[dict] = None


@dataclass
class TapWebhookData:
    """Parsed webhook data from Tap."""
    charge_id: str
    status: str
    amount: Decimal
    currency: str
    reference_id: str
    gateway_transaction_id: Optional[str] = None
    card_last_four: Optional[str] = None
    card_brand: Optional[str] = None
    raw_data: Optional[dict] = None


class TapPaymentGatewayError(Exception):
    """Exception for Tap payment gateway errors."""
    pass


class TapPaymentGateway:
    """
    Tap Payment Gateway integration service.

    Usage:
        gateway = TapPaymentGateway()

        # Create a charge
        response = gateway.create_charge(
            amount=Decimal('100.00'),
            currency='SAR',
            reference_id='TXN-123',
            description='Payment for project',
            customer=TapCustomer(
                first_name='Ahmed',
                last_name='Mohammed',
                email='ahmed@example.com',
                phone_number='501234567'
            ),
            redirect_url='https://yoursite.com/payment/callback',
            post_url='https://yoursite.com/api/v1/payments/webhook/'
        )

        if response.success:
            # Redirect user to response.payment_url
            pass
    """

    # API endpoints
    TEST_BASE_URL = 'https://api.tap.company/v2'
    PRODUCTION_BASE_URL = 'https://api.tap.company/v2'

    def __init__(self):
        """Initialize Tap gateway with settings."""
        self.secret_key = getattr(settings, 'TAP_SECRET_KEY', '')
        self.public_key = getattr(settings, 'TAP_PUBLIC_KEY', '')
        self.webhook_secret = getattr(settings, 'TAP_WEBHOOK_SECRET', '')
        self.merchant_id = getattr(settings, 'TAP_MERCHANT_ID', '')

        # Environment (test or production)
        env = getattr(settings, 'TAP_ENVIRONMENT', 'test')
        self.environment = TapEnvironment(env)

        # Set base URL based on environment
        self.base_url = self.PRODUCTION_BASE_URL if self.environment == TapEnvironment.PRODUCTION else self.TEST_BASE_URL

        # Validate configuration
        if not self.secret_key:
            logger.warning("TAP_SECRET_KEY not configured. Payment gateway will not work.")

    @property
    def is_configured(self) -> bool:
        """Check if the gateway is properly configured."""
        return bool(self.secret_key)

    @property
    def is_test_mode(self) -> bool:
        """Check if running in test mode."""
        return self.environment == TapEnvironment.TEST

    def _get_headers(self) -> dict:
        """Get headers for API requests."""
        return {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[dict] = None
    ) -> dict:
        """Make an API request to Tap."""
        url = f"{self.base_url}/{endpoint}"

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self._get_headers(),
                json=data,
                timeout=30
            )

            response_data = response.json()

            if response.status_code >= 400:
                error_msg = response_data.get('errors', [{}])[0].get('description', 'Unknown error')
                logger.error(f"Tap API error: {error_msg} - {response_data}")
                raise TapPaymentGatewayError(error_msg)

            return response_data

        except requests.exceptions.Timeout:
            logger.error("Tap API timeout")
            raise TapPaymentGatewayError("Payment gateway timeout. Please try again.")
        except requests.exceptions.RequestException as e:
            logger.error(f"Tap API request error: {str(e)}")
            raise TapPaymentGatewayError("Payment gateway connection error. Please try again.")

    def create_charge(
        self,
        amount: Decimal,
        currency: str,
        reference_id: str,
        description: str,
        customer: TapCustomer,
        redirect_url: str,
        post_url: str,
        payment_methods: Optional[list] = None,
        metadata: Optional[dict] = None,
        three_d_secure: bool = True,
        save_card: bool = False,
    ) -> TapChargeResponse:
        """
        Create a charge (payment) in Tap.

        Args:
            amount: Payment amount
            currency: Currency code (SAR, AED, KWD, etc.)
            reference_id: Your internal reference ID
            description: Payment description
            customer: Customer details
            redirect_url: URL to redirect after payment
            post_url: Webhook URL for payment status updates
            payment_methods: List of allowed payment methods
            metadata: Additional metadata to store
            three_d_secure: Enable 3D Secure authentication
            save_card: Whether to save card for future payments

        Returns:
            TapChargeResponse with payment URL if successful
        """
        if not self.is_configured:
            return TapChargeResponse(
                success=False,
                error_message="Payment gateway not configured"
            )

        # Default payment methods for Saudi Arabia
        if payment_methods is None:
            payment_methods = ['src_all']  # Accept all payment methods

        # Build charge request
        charge_data = {
            'amount': float(amount),
            'currency': currency,
            'threeDSecure': three_d_secure,
            'save_card': save_card,
            'description': description,
            'statement_descriptor': 'Tashawer',
            'metadata': {
                'reference_id': reference_id,
                **(metadata or {})
            },
            'reference': {
                'transaction': reference_id,
                'order': reference_id
            },
            'receipt': {
                'email': True,
                'sms': True
            },
            'customer': {
                'first_name': customer.first_name,
                'last_name': customer.last_name,
                'email': customer.email,
                'phone': {
                    'country_code': customer.phone_country_code,
                    'number': customer.phone_number
                }
            },
            'source': {
                'id': 'src_all'  # Accept all payment sources
            },
            'post': {
                'url': post_url
            },
            'redirect': {
                'url': redirect_url
            }
        }

        # Add merchant info if configured
        if self.merchant_id:
            charge_data['merchant'] = {
                'id': self.merchant_id
            }

        try:
            response = self._make_request('POST', 'charges', charge_data)

            return TapChargeResponse(
                success=True,
                charge_id=response.get('id'),
                status=response.get('status'),
                payment_url=response.get('transaction', {}).get('url'),
                raw_response=response
            )

        except TapPaymentGatewayError as e:
            return TapChargeResponse(
                success=False,
                error_message=str(e)
            )

    def retrieve_charge(self, charge_id: str) -> dict:
        """
        Retrieve a charge by ID.

        Args:
            charge_id: The Tap charge ID

        Returns:
            Charge details
        """
        return self._make_request('GET', f'charges/{charge_id}')

    def refund_charge(
        self,
        charge_id: str,
        amount: Optional[Decimal] = None,
        reason: str = '',
        metadata: Optional[dict] = None
    ) -> dict:
        """
        Refund a charge (full or partial).

        Args:
            charge_id: The Tap charge ID to refund
            amount: Amount to refund (None for full refund)
            reason: Reason for refund
            metadata: Additional metadata

        Returns:
            Refund details
        """
        refund_data = {
            'charge_id': charge_id,
            'reason': reason,
            'metadata': metadata or {}
        }

        if amount is not None:
            refund_data['amount'] = float(amount)

        return self._make_request('POST', 'refunds', refund_data)

    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str
    ) -> bool:
        """
        Verify webhook signature from Tap.

        Args:
            payload: Raw request body as bytes
            signature: Signature from 'Tap-Signature' header

        Returns:
            True if signature is valid
        """
        if not self.webhook_secret:
            logger.warning("TAP_WEBHOOK_SECRET not configured. Webhook verification disabled.")
            return True  # Skip verification if not configured

        try:
            # Tap uses HMAC-SHA256 for webhook signatures
            expected_signature = hmac.new(
                key=self.webhook_secret.encode('utf-8'),
                msg=payload,
                digestmod=hashlib.sha256
            ).hexdigest()

            return hmac.compare_digest(expected_signature, signature)

        except Exception as e:
            logger.error(f"Webhook signature verification error: {str(e)}")
            return False

    def parse_webhook_data(self, data: dict) -> TapWebhookData:
        """
        Parse webhook data from Tap.

        Args:
            data: Webhook payload

        Returns:
            Parsed webhook data
        """
        charge_data = data.get('object', data)

        # Extract card details if available
        card_info = charge_data.get('source', {})
        card_last_four = card_info.get('payment_method', {}).get('last_four')
        card_brand = card_info.get('payment_method', {}).get('brand')

        return TapWebhookData(
            charge_id=charge_data.get('id', ''),
            status=charge_data.get('status', 'UNKNOWN'),
            amount=Decimal(str(charge_data.get('amount', 0))),
            currency=charge_data.get('currency', 'SAR'),
            reference_id=charge_data.get('reference', {}).get('transaction', ''),
            gateway_transaction_id=charge_data.get('id'),
            card_last_four=card_last_four,
            card_brand=card_brand,
            raw_data=data
        )

    def is_successful_status(self, status: str) -> bool:
        """Check if a charge status indicates successful payment."""
        return status.upper() == TapChargeStatus.CAPTURED.value

    def is_failed_status(self, status: str) -> bool:
        """Check if a charge status indicates failed payment."""
        failed_statuses = [
            TapChargeStatus.FAILED.value,
            TapChargeStatus.DECLINED.value,
            TapChargeStatus.RESTRICTED.value,
            TapChargeStatus.TIMEDOUT.value,
        ]
        return status.upper() in failed_statuses

    def is_cancelled_status(self, status: str) -> bool:
        """Check if a charge status indicates cancelled payment."""
        cancelled_statuses = [
            TapChargeStatus.CANCELLED.value,
            TapChargeStatus.ABANDONED.value,
            TapChargeStatus.VOID.value,
        ]
        return status.upper() in cancelled_statuses


# Singleton instance for convenience
tap_gateway = TapPaymentGateway()
