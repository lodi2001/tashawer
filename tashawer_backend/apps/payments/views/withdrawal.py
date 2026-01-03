"""
Withdrawal views for consultant payout requests.
"""

import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from django.db import transaction as db_transaction

from apps.payments.models import (
    Withdrawal,
    WithdrawalStatus,
    BankAccount,
    Wallet,
)
from apps.payments.serializers.withdrawal import (
    BankAccountSerializer,
    BankAccountCreateSerializer,
    WithdrawalListSerializer,
    WithdrawalDetailSerializer,
    WithdrawalCreateSerializer,
    WithdrawalAdminSerializer,
    WithdrawalApproveSerializer,
    WithdrawalRejectSerializer,
    WithdrawalCompleteSerializer,
)

logger = logging.getLogger(__name__)


# ============ Bank Account Views ============

class BankAccountListView(ListAPIView):
    """
    List user's bank accounts.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BankAccountSerializer

    def get_queryset(self):
        return BankAccount.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


class BankAccountCreateView(APIView):
    """
    Add a new bank account.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BankAccountCreateSerializer(
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        bank_account = serializer.save()
        logger.info(f"Bank account created: {bank_account.id} for user {request.user.email}")

        return Response({
            'success': True,
            'message': 'Bank account added successfully',
            'data': BankAccountSerializer(bank_account).data
        }, status=status.HTTP_201_CREATED)


class BankAccountDetailView(APIView):
    """
    Get, update, or delete a bank account.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            bank_account = BankAccount.objects.get(id=pk, user=request.user)
        except BankAccount.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Bank account not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = BankAccountSerializer(bank_account)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def delete(self, request, pk):
        try:
            bank_account = BankAccount.objects.get(id=pk, user=request.user)
        except BankAccount.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Bank account not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if there are pending withdrawals
        pending_withdrawals = Withdrawal.objects.filter(
            bank_account=bank_account,
            status__in=[WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED, WithdrawalStatus.PROCESSING]
        ).exists()

        if pending_withdrawals:
            return Response({
                'success': False,
                'message': 'Cannot delete bank account with pending withdrawals'
            }, status=status.HTTP_400_BAD_REQUEST)

        bank_account.delete()
        logger.info(f"Bank account deleted: {pk} by user {request.user.email}")

        return Response({
            'success': True,
            'message': 'Bank account deleted successfully'
        })


class BankAccountSetPrimaryView(APIView):
    """
    Set a bank account as primary.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            bank_account = BankAccount.objects.get(id=pk, user=request.user)
        except BankAccount.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Bank account not found'
            }, status=status.HTTP_404_NOT_FOUND)

        bank_account.is_primary = True
        bank_account.save()

        return Response({
            'success': True,
            'message': 'Bank account set as primary'
        })


# ============ Withdrawal Views ============

class WithdrawalListView(ListAPIView):
    """
    List user's withdrawal requests.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = WithdrawalListSerializer

    def get_queryset(self):
        return Withdrawal.objects.filter(user=self.request.user).order_by('-created_at')

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


class WithdrawalDetailView(APIView):
    """
    Get withdrawal details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, reference_number):
        try:
            withdrawal = Withdrawal.objects.get(
                reference_number=reference_number,
                user=request.user
            )
        except Withdrawal.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Withdrawal not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = WithdrawalDetailSerializer(withdrawal)
        return Response({
            'success': True,
            'data': serializer.data
        })


class WithdrawalCreateView(APIView):
    """
    Create a new withdrawal request.
    """
    permission_classes = [IsAuthenticated]

    @db_transaction.atomic
    def post(self, request):
        serializer = WithdrawalCreateSerializer(
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get or create wallet
        wallet = Wallet.get_or_create_wallet(request.user)

        # Check if user is a consultant
        if request.user.role != 'consultant':
            return Response({
                'success': False,
                'message': 'Only consultants can request withdrawals'
            }, status=status.HTTP_403_FORBIDDEN)

        amount = serializer.validated_data['amount']
        bank_account = serializer.validated_data['bank_account_id']
        note = serializer.validated_data.get('note', '')

        # Check for pending withdrawals
        pending_count = Withdrawal.objects.filter(
            user=request.user,
            status__in=[WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED, WithdrawalStatus.PROCESSING]
        ).count()

        if pending_count >= 3:
            return Response({
                'success': False,
                'message': 'You have too many pending withdrawal requests. Please wait for them to be processed.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create withdrawal
        withdrawal = Withdrawal.objects.create(
            user=request.user,
            wallet=wallet,
            bank_account=bank_account,
            amount=amount,
            fee=0,  # No fee for now
            net_amount=amount,
            user_note=note,
        )

        logger.info(f"Withdrawal request created: {withdrawal.reference_number} for {amount} SAR")

        return Response({
            'success': True,
            'message': 'Withdrawal request submitted successfully',
            'data': WithdrawalDetailSerializer(withdrawal).data
        }, status=status.HTTP_201_CREATED)


class WithdrawalCancelView(APIView):
    """
    Cancel a pending withdrawal request.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, reference_number):
        try:
            withdrawal = Withdrawal.objects.get(
                reference_number=reference_number,
                user=request.user
            )
        except Withdrawal.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Withdrawal not found'
            }, status=status.HTTP_404_NOT_FOUND)

        if withdrawal.status != WithdrawalStatus.PENDING:
            return Response({
                'success': False,
                'message': f'Cannot cancel withdrawal in {withdrawal.status} status'
            }, status=status.HTTP_400_BAD_REQUEST)

        withdrawal.cancel()
        logger.info(f"Withdrawal cancelled: {withdrawal.reference_number}")

        return Response({
            'success': True,
            'message': 'Withdrawal request cancelled'
        })


# ============ Admin Withdrawal Views ============

class AdminWithdrawalListView(ListAPIView):
    """
    List all withdrawal requests (admin only).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = WithdrawalAdminSerializer

    def get_queryset(self):
        queryset = Withdrawal.objects.all().order_by('-created_at')

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        # Get counts by status
        status_counts = {
            'pending': Withdrawal.objects.filter(status=WithdrawalStatus.PENDING).count(),
            'approved': Withdrawal.objects.filter(status=WithdrawalStatus.APPROVED).count(),
            'processing': Withdrawal.objects.filter(status=WithdrawalStatus.PROCESSING).count(),
            'completed': Withdrawal.objects.filter(status=WithdrawalStatus.COMPLETED).count(),
            'rejected': Withdrawal.objects.filter(status=WithdrawalStatus.REJECTED).count(),
        }

        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            return Response({
                'success': True,
                'data': {
                    **response.data,
                    'status_counts': status_counts
                }
            })

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': {
                'results': serializer.data,
                'count': queryset.count(),
                'status_counts': status_counts
            }
        })


class AdminWithdrawalDetailView(APIView):
    """
    Get withdrawal details (admin only).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, reference_number):
        try:
            withdrawal = Withdrawal.objects.get(reference_number=reference_number)
        except Withdrawal.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Withdrawal not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = WithdrawalAdminSerializer(withdrawal)
        return Response({
            'success': True,
            'data': serializer.data
        })


class AdminWithdrawalApproveView(APIView):
    """
    Approve a withdrawal request (admin only).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, reference_number):
        try:
            withdrawal = Withdrawal.objects.get(reference_number=reference_number)
        except Withdrawal.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Withdrawal not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = WithdrawalApproveSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            note = serializer.validated_data.get('note')
            withdrawal.approve(request.user, note)
            logger.info(f"Withdrawal approved: {withdrawal.reference_number} by {request.user.email}")

            return Response({
                'success': True,
                'message': 'Withdrawal approved successfully',
                'data': WithdrawalAdminSerializer(withdrawal).data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class AdminWithdrawalRejectView(APIView):
    """
    Reject a withdrawal request (admin only).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, reference_number):
        try:
            withdrawal = Withdrawal.objects.get(reference_number=reference_number)
        except Withdrawal.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Withdrawal not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = WithdrawalRejectSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            reason = serializer.validated_data['reason']
            withdrawal.reject(request.user, reason)
            logger.info(f"Withdrawal rejected: {withdrawal.reference_number} by {request.user.email}")

            return Response({
                'success': True,
                'message': 'Withdrawal rejected',
                'data': WithdrawalAdminSerializer(withdrawal).data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class AdminWithdrawalProcessView(APIView):
    """
    Start processing a withdrawal (admin only).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, reference_number):
        try:
            withdrawal = Withdrawal.objects.get(reference_number=reference_number)
        except Withdrawal.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Withdrawal not found'
            }, status=status.HTTP_404_NOT_FOUND)

        try:
            withdrawal.start_processing()
            logger.info(f"Withdrawal processing started: {withdrawal.reference_number}")

            return Response({
                'success': True,
                'message': 'Withdrawal processing started',
                'data': WithdrawalAdminSerializer(withdrawal).data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class AdminWithdrawalCompleteView(APIView):
    """
    Complete a withdrawal (admin only).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, reference_number):
        try:
            withdrawal = Withdrawal.objects.get(reference_number=reference_number)
        except Withdrawal.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Withdrawal not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = WithdrawalCompleteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            bank_reference = serializer.validated_data['bank_reference']
            receipt = serializer.validated_data.get('receipt')
            withdrawal.complete(bank_reference, receipt)
            logger.info(f"Withdrawal completed: {withdrawal.reference_number}")

            return Response({
                'success': True,
                'message': 'Withdrawal completed successfully',
                'data': WithdrawalAdminSerializer(withdrawal).data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class AdminBankAccountVerifyView(APIView):
    """
    Verify a bank account (admin only).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            bank_account = BankAccount.objects.get(id=pk)
        except BankAccount.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Bank account not found'
            }, status=status.HTTP_404_NOT_FOUND)

        bank_account.verify(request.user)
        logger.info(f"Bank account verified: {pk} by {request.user.email}")

        return Response({
            'success': True,
            'message': 'Bank account verified successfully',
            'data': BankAccountSerializer(bank_account).data
        })
