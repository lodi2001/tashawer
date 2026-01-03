"""
Admin dispute views for managing and resolving disputes.
"""

import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q

from apps.disputes.models import (
    Dispute,
    DisputeMessage,
    DisputeActivity,
    DisputeStatus,
)
from apps.disputes.serializers import (
    DisputeListSerializer,
    DisputeDetailSerializer,
    DisputeResolutionSerializer,
    DisputeAssignSerializer,
    DisputeMessageSerializer,
    DisputeMessageCreateSerializer,
)
from apps.accounts.permissions import IsAdmin

logger = logging.getLogger(__name__)


class AdminDisputeListView(APIView):
    """
    List all disputes for admin management.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        """Get all disputes with optional filters."""
        disputes = Dispute.objects.select_related(
            'order', 'order__project', 'initiated_by', 'assigned_admin'
        ).order_by('-created_at')

        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter:
            disputes = disputes.filter(status=status_filter)

        # Filter by assigned admin
        assigned_to = request.query_params.get('assigned_to')
        if assigned_to == 'me':
            disputes = disputes.filter(assigned_admin=request.user)
        elif assigned_to == 'unassigned':
            disputes = disputes.filter(assigned_admin__isnull=True)
        elif assigned_to:
            disputes = disputes.filter(assigned_admin_id=assigned_to)

        # Filter by date range
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            disputes = disputes.filter(created_at__gte=date_from)
        if date_to:
            disputes = disputes.filter(created_at__lte=date_to)

        # Search by dispute number or order number
        search = request.query_params.get('search')
        if search:
            disputes = disputes.filter(
                Q(dispute_number__icontains=search) |
                Q(order__order_number__icontains=search)
            )

        serializer = DisputeListSerializer(disputes, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


class AdminDisputeDetailView(APIView):
    """
    Get detailed dispute information for admin.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, dispute_number):
        """Get full dispute details including internal notes."""
        try:
            dispute = Dispute.objects.select_related(
                'order', 'order__project', 'order__client', 'order__consultant',
                'initiated_by', 'assigned_admin', 'resolved_by'
            ).prefetch_related(
                'evidence', 'messages', 'activities'
            ).get(dispute_number=dispute_number)
        except Dispute.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Dispute not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = DisputeDetailSerializer(dispute, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data
        })


class AdminDisputeAssignView(APIView):
    """
    Assign an admin to handle a dispute.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, dispute_number):
        """Assign admin to dispute."""
        try:
            dispute = Dispute.objects.get(dispute_number=dispute_number)
        except Dispute.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Dispute not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = DisputeAssignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        admin_id = serializer.validated_data.get('admin_id')

        # If no admin_id provided, assign to current user
        if admin_id:
            from apps.accounts.models import User
            admin = User.objects.get(id=admin_id)
        else:
            admin = request.user

        dispute.assign_admin(admin)

        # Log activity
        DisputeActivity.log(
            dispute=dispute,
            activity_type='admin_assigned',
            description=f'Dispute assigned to {admin.full_name}',
            user=request.user,
            metadata={'admin_id': str(admin.id)}
        )

        logger.info(f"Dispute {dispute.dispute_number} assigned to {admin.email}")

        return Response({
            'success': True,
            'message': f'Dispute assigned to {admin.full_name}',
            'data': {'assigned_admin': admin.full_name}
        })


class AdminDisputeResolveView(APIView):
    """
    Resolve a dispute with specified resolution type.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, dispute_number):
        """Resolve the dispute."""
        try:
            dispute = Dispute.objects.select_related('order').get(
                dispute_number=dispute_number
            )
        except Dispute.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Dispute not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if dispute can be resolved
        if not dispute.can_resolve:
            return Response({
                'success': False,
                'message': f'Cannot resolve dispute with status: {dispute.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = DisputeResolutionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        resolution_type = serializer.validated_data['resolution_type']
        resolution_amount = serializer.validated_data.get('resolution_amount')
        resolution_notes = serializer.validated_data.get('resolution_notes', '')

        # Resolve the dispute
        dispute.resolve(
            admin=request.user,
            resolution_type=resolution_type,
            resolution_amount=resolution_amount,
            resolution_notes=resolution_notes,
        )

        # Log activity
        DisputeActivity.log(
            dispute=dispute,
            activity_type='resolved',
            description=f'Dispute resolved by {request.user.full_name}: {resolution_type}',
            user=request.user,
            metadata={
                'resolution_type': resolution_type,
                'resolution_amount': str(resolution_amount) if resolution_amount else None,
            }
        )

        logger.info(f"Dispute {dispute.dispute_number} resolved: {resolution_type}")

        return Response({
            'success': True,
            'message': 'Dispute resolved successfully',
            'data': DisputeDetailSerializer(dispute, context={'request': request}).data
        })


class AdminDisputeEscalateView(APIView):
    """
    Escalate a dispute for higher-level review.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, dispute_number):
        """Escalate the dispute."""
        try:
            dispute = Dispute.objects.get(dispute_number=dispute_number)
        except Dispute.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Dispute not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if dispute can be escalated
        if dispute.status in [DisputeStatus.RESOLVED, DisputeStatus.CLOSED]:
            return Response({
                'success': False,
                'message': 'Cannot escalate closed or resolved dispute'
            }, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', '')

        dispute.escalate(reason)

        # Log activity
        DisputeActivity.log(
            dispute=dispute,
            activity_type='escalated',
            description=f'Dispute escalated by {request.user.full_name}',
            user=request.user,
            metadata={'reason': reason}
        )

        logger.info(f"Dispute {dispute.dispute_number} escalated")

        return Response({
            'success': True,
            'message': 'Dispute escalated',
            'data': {'status': dispute.status}
        })


class AdminDisputeRequestResponseView(APIView):
    """
    Request response from one of the parties.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, dispute_number):
        """Request response from a party."""
        try:
            dispute = Dispute.objects.select_related('order').get(
                dispute_number=dispute_number
            )
        except Dispute.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Dispute not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if dispute is still open
        if not dispute.is_open:
            return Response({
                'success': False,
                'message': 'Cannot request response for closed dispute'
            }, status=status.HTTP_400_BAD_REQUEST)

        party = request.data.get('party')  # 'client' or 'consultant'
        message = request.data.get('message', '')

        if party not in ['client', 'consultant']:
            return Response({
                'success': False,
                'message': 'Invalid party. Must be "client" or "consultant"'
            }, status=status.HTTP_400_BAD_REQUEST)

        deadline_days = request.data.get('deadline_days', 3)

        dispute.request_response(deadline_days=deadline_days)

        # Add admin message requesting response
        if message:
            DisputeMessage.objects.create(
                dispute=dispute,
                sender=request.user,
                message=message,
                is_admin_message=True,
            )

        # Log activity
        target_user = dispute.client if party == 'client' else dispute.consultant
        DisputeActivity.log(
            dispute=dispute,
            activity_type='response_requested',
            description=f'Response requested from {target_user.full_name}',
            user=request.user,
            metadata={
                'party': party,
                'deadline_days': deadline_days
            }
        )

        return Response({
            'success': True,
            'message': f'Response requested from {party}',
            'data': {
                'status': dispute.status,
                'response_deadline': dispute.response_deadline
            }
        })


class AdminDisputeCloseView(APIView):
    """
    Close a dispute without resolution (e.g., withdrawn, invalid).
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, dispute_number):
        """Close the dispute."""
        try:
            dispute = Dispute.objects.get(dispute_number=dispute_number)
        except Dispute.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Dispute not found'
            }, status=status.HTTP_404_NOT_FOUND)

        if dispute.status in [DisputeStatus.RESOLVED, DisputeStatus.CLOSED]:
            return Response({
                'success': False,
                'message': 'Dispute is already closed'
            }, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', '')

        dispute.close(reason)

        # Log activity
        DisputeActivity.log(
            dispute=dispute,
            activity_type='closed',
            description=f'Dispute closed by {request.user.full_name}: {reason}',
            user=request.user,
            metadata={'reason': reason}
        )

        logger.info(f"Dispute {dispute.dispute_number} closed: {reason}")

        return Response({
            'success': True,
            'message': 'Dispute closed',
            'data': {'status': dispute.status}
        })


class AdminDisputeInternalNoteView(APIView):
    """
    Add internal admin notes to a dispute.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, dispute_number):
        """Get internal notes for a dispute."""
        try:
            dispute = Dispute.objects.get(dispute_number=dispute_number)
        except Dispute.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Dispute not found'
            }, status=status.HTTP_404_NOT_FOUND)

        internal_notes = dispute.messages.filter(is_internal_note=True)
        serializer = DisputeMessageSerializer(internal_notes, many=True)

        return Response({
            'success': True,
            'data': serializer.data
        })

    def post(self, request, dispute_number):
        """Add internal note to dispute."""
        try:
            dispute = Dispute.objects.get(dispute_number=dispute_number)
        except Dispute.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Dispute not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = DisputeMessageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        note = DisputeMessage.objects.create(
            dispute=dispute,
            sender=request.user,
            message=serializer.validated_data['message'],
            is_admin_message=True,
            is_internal_note=True,
        )

        return Response({
            'success': True,
            'message': 'Internal note added',
            'data': DisputeMessageSerializer(note).data
        }, status=status.HTTP_201_CREATED)
