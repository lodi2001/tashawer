"""
Dispute views for clients and consultants.
"""

import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q

from apps.disputes.models import (
    Dispute,
    DisputeEvidence,
    DisputeMessage,
    DisputeActivity,
    DisputeStatus,
)
from apps.disputes.serializers import (
    DisputeListSerializer,
    DisputeDetailSerializer,
    DisputeCreateSerializer,
    DisputeEvidenceSerializer,
    DisputeEvidenceCreateSerializer,
    DisputeMessageSerializer,
    DisputeMessageCreateSerializer,
    DisputeResponseSerializer,
)
from apps.orders.models import Order

logger = logging.getLogger(__name__)


class DisputeListView(APIView):
    """
    List disputes for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get user's disputes."""
        user = request.user

        # Get disputes where user is client or consultant
        disputes = Dispute.objects.filter(
            Q(order__client=user) | Q(order__consultant=user)
        ).select_related(
            'order', 'order__project', 'initiated_by'
        ).order_by('-created_at')

        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter:
            disputes = disputes.filter(status=status_filter)

        serializer = DisputeListSerializer(disputes, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


class DisputeDetailView(APIView):
    """
    Get dispute details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, dispute_number):
        """Get dispute details."""
        user = request.user

        try:
            dispute = Dispute.objects.select_related(
                'order', 'order__project', 'initiated_by',
                'assigned_admin', 'resolved_by'
            ).prefetch_related(
                'evidence', 'messages', 'activities'
            ).get(dispute_number=dispute_number)
        except Dispute.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Dispute not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check access (client, consultant, or admin)
        if (dispute.client != user and
            dispute.consultant != user and
            user.role != 'admin'):
            return Response({
                'success': False,
                'message': 'Unauthorized'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = DisputeDetailSerializer(dispute, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data
        })


class DisputeCreateView(APIView):
    """
    Create a new dispute.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Create a dispute."""
        serializer = DisputeCreateSerializer(
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.get(id=serializer.validated_data['order_id'])

        # Create dispute
        dispute = Dispute.objects.create(
            order=order,
            initiated_by=request.user,
            reason=serializer.validated_data['reason'],
            description=serializer.validated_data['description'],
            desired_resolution=serializer.validated_data.get('desired_resolution', ''),
            disputed_amount=order.total_amount,
        )

        # Open the dispute (updates order status and escrow)
        dispute.open_dispute()

        # Log activity
        DisputeActivity.log(
            dispute=dispute,
            activity_type='created',
            description=f'Dispute created by {request.user.full_name}',
            user=request.user,
            metadata={'reason': dispute.reason}
        )

        logger.info(f"Dispute created: {dispute.dispute_number} by {request.user.email}")

        return Response({
            'success': True,
            'message': 'Dispute created successfully',
            'data': DisputeDetailSerializer(dispute, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


class DisputeRespondView(APIView):
    """
    Respond to a dispute (for the other party).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, dispute_number):
        """Submit response to dispute."""
        user = request.user

        try:
            dispute = Dispute.objects.select_related('order').get(
                dispute_number=dispute_number
            )
        except Dispute.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Dispute not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Verify user is the other party (not initiator)
        if dispute.other_party != user:
            return Response({
                'success': False,
                'message': 'Only the other party can respond to this dispute'
            }, status=status.HTTP_403_FORBIDDEN)

        # Verify dispute is awaiting response
        if dispute.status != DisputeStatus.AWAITING_RESPONSE:
            return Response({
                'success': False,
                'message': f'Cannot respond to dispute with status: {dispute.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = DisputeResponseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create response message
        DisputeMessage.objects.create(
            dispute=dispute,
            sender=user,
            message=serializer.validated_data['response'],
        )

        # Update status to under review
        dispute.status = DisputeStatus.UNDER_REVIEW
        dispute.save(update_fields=['status', 'updated_at'])

        # Log activity
        DisputeActivity.log(
            dispute=dispute,
            activity_type='response_submitted',
            description=f'Response submitted by {user.full_name}',
            user=user,
        )

        return Response({
            'success': True,
            'message': 'Response submitted',
            'data': {'status': dispute.status}
        })


class DisputeEvidenceUploadView(APIView):
    """
    Upload evidence for a dispute.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, dispute_number):
        """Upload evidence."""
        user = request.user

        try:
            dispute = Dispute.objects.select_related('order').get(
                dispute_number=dispute_number
            )
        except Dispute.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Dispute not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check access
        if dispute.client != user and dispute.consultant != user:
            return Response({
                'success': False,
                'message': 'Unauthorized'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check if dispute is still open
        if not dispute.is_open:
            return Response({
                'success': False,
                'message': 'Cannot add evidence to closed dispute'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = DisputeEvidenceCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        evidence = DisputeEvidence.objects.create(
            dispute=dispute,
            uploaded_by=user,
            file=serializer.validated_data['file'],
            description=serializer.validated_data.get('description', ''),
            file_type=serializer.validated_data['file'].content_type,
        )

        # Log activity
        DisputeActivity.log(
            dispute=dispute,
            activity_type='evidence_uploaded',
            description=f'Evidence uploaded by {user.full_name}: {evidence.original_filename}',
            user=user,
        )

        return Response({
            'success': True,
            'message': 'Evidence uploaded',
            'data': DisputeEvidenceSerializer(evidence).data
        }, status=status.HTTP_201_CREATED)


class DisputeMessageView(APIView):
    """
    Add message to dispute thread.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, dispute_number):
        """Get dispute messages."""
        user = request.user

        try:
            dispute = Dispute.objects.select_related('order').get(
                dispute_number=dispute_number
            )
        except Dispute.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Dispute not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check access
        if (dispute.client != user and
            dispute.consultant != user and
            user.role != 'admin'):
            return Response({
                'success': False,
                'message': 'Unauthorized'
            }, status=status.HTTP_403_FORBIDDEN)

        messages = dispute.messages.all()

        # Filter internal notes for non-admins
        if user.role != 'admin':
            messages = messages.filter(is_internal_note=False)

        serializer = DisputeMessageSerializer(messages, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def post(self, request, dispute_number):
        """Add message to dispute."""
        user = request.user

        try:
            dispute = Dispute.objects.select_related('order').get(
                dispute_number=dispute_number
            )
        except Dispute.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Dispute not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check access
        if (dispute.client != user and
            dispute.consultant != user and
            user.role != 'admin'):
            return Response({
                'success': False,
                'message': 'Unauthorized'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check if dispute is still open
        if not dispute.is_open:
            return Response({
                'success': False,
                'message': 'Cannot add messages to closed dispute'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = DisputeMessageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Only admins can create internal notes
        is_internal_note = serializer.validated_data.get('is_internal_note', False)
        if is_internal_note and user.role != 'admin':
            is_internal_note = False

        message = DisputeMessage.objects.create(
            dispute=dispute,
            sender=user,
            message=serializer.validated_data['message'],
            is_admin_message=(user.role == 'admin'),
            is_internal_note=is_internal_note,
        )

        return Response({
            'success': True,
            'message': 'Message added',
            'data': DisputeMessageSerializer(message).data
        }, status=status.HTTP_201_CREATED)
