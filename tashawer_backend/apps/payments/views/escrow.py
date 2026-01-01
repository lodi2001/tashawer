import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q

from apps.payments.models import Escrow, EscrowStatus
from apps.payments.serializers import (
    EscrowListSerializer,
    EscrowDetailSerializer,
    EscrowCreateSerializer,
    EscrowReleaseSerializer,
    EscrowRefundSerializer,
)

logger = logging.getLogger(__name__)


class EscrowListView(APIView):
    """
    List escrows for the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get list of user's escrows (as client or consultant).

        Query parameters:
        - role: 'client' or 'consultant' (optional)
        - status: filter by status (optional)
        - page: page number (default: 1)
        - page_size: items per page (default: 20, max: 50)
        """
        role = request.query_params.get('role')
        status_filter = request.query_params.get('status')

        # Build query
        if role == 'client':
            escrows = Escrow.objects.filter(client=request.user)
        elif role == 'consultant':
            escrows = Escrow.objects.filter(consultant=request.user)
        else:
            escrows = Escrow.objects.filter(
                Q(client=request.user) | Q(consultant=request.user)
            )

        # Filter by status
        if status_filter:
            escrows = escrows.filter(status=status_filter)

        escrows = escrows.order_by('-created_at')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 20)), 50)
        start = (page - 1) * page_size
        end = start + page_size

        total_count = escrows.count()
        escrows = escrows[start:end]

        serializer = EscrowListSerializer(escrows, many=True)

        return Response({
            'success': True,
            'data': {
                'escrows': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                }
            }
        }, status=status.HTTP_200_OK)


class EscrowCreateView(APIView):
    """
    Create a new escrow for an accepted proposal.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Create escrow for an accepted proposal.

        Request body:
        - proposal_id: uuid (required)
        """
        serializer = EscrowCreateSerializer(data=request.data)

        if serializer.is_valid():
            from apps.proposals.models import Proposal

            proposal = Proposal.objects.get(id=serializer.validated_data['proposal_id'])

            # Verify user is the project client
            if proposal.project.client != request.user:
                return Response({
                    'success': False,
                    'message': 'Only the project client can create escrow'
                }, status=status.HTTP_403_FORBIDDEN)

            escrow = serializer.save()
            logger.info(f"Escrow created: {escrow.escrow_reference} by user {request.user.id}")

            detail_serializer = EscrowDetailSerializer(escrow)

            return Response({
                'success': True,
                'message': 'Escrow created successfully',
                'data': detail_serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'success': False,
            'message': 'Validation error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class EscrowDetailView(APIView):
    """
    Get escrow details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Get escrow details by ID."""
        escrow = get_object_or_404(
            Escrow.objects.filter(
                Q(client=request.user) | Q(consultant=request.user)
            ),
            pk=pk
        )

        serializer = EscrowDetailSerializer(escrow)

        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class EscrowReleaseView(APIView):
    """
    Release escrow funds to consultant.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """
        Release escrowed funds to consultant.

        Request body:
        - note: string (optional)
        """
        escrow = get_object_or_404(Escrow, pk=pk)

        # Only client can release funds
        if escrow.client != request.user:
            return Response({
                'success': False,
                'message': 'Only the client can release escrow funds'
            }, status=status.HTTP_403_FORBIDDEN)

        if not escrow.can_release:
            return Response({
                'success': False,
                'message': f'Cannot release escrow in {escrow.status} status'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = EscrowReleaseSerializer(data=request.data)

        if serializer.is_valid():
            note = serializer.validated_data.get('note')
            escrow.release(note=note)

            logger.info(f"Escrow released: {escrow.escrow_reference} by user {request.user.id}")

            # Update project status to completed
            from apps.projects.models import ProjectStatus
            escrow.project.status = ProjectStatus.COMPLETED
            escrow.project.save(update_fields=['status', 'updated_at'])

            return Response({
                'success': True,
                'message': 'Payment released to consultant successfully',
                'data': {
                    'escrow_reference': escrow.escrow_reference,
                    'amount_released': str(escrow.consultant_amount),
                    'status': escrow.status
                }
            }, status=status.HTTP_200_OK)

        return Response({
            'success': False,
            'message': 'Validation error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class EscrowRefundView(APIView):
    """
    Refund escrow funds to client.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """
        Refund escrowed funds to client.

        Request body:
        - reason: string (required, min 10 chars)
        """
        escrow = get_object_or_404(Escrow, pk=pk)

        # Only client can request refund (in real world, might need admin approval)
        if escrow.client != request.user:
            return Response({
                'success': False,
                'message': 'Only the client can request a refund'
            }, status=status.HTTP_403_FORBIDDEN)

        if not escrow.can_refund:
            return Response({
                'success': False,
                'message': f'Cannot refund escrow in {escrow.status} status'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = EscrowRefundSerializer(data=request.data)

        if serializer.is_valid():
            reason = serializer.validated_data['reason']
            escrow.refund(reason=reason)

            logger.info(f"Escrow refunded: {escrow.escrow_reference} by user {request.user.id}")

            # Update project status to cancelled
            from apps.projects.models import ProjectStatus
            escrow.project.status = ProjectStatus.CANCELLED
            escrow.project.save(update_fields=['status', 'updated_at'])

            return Response({
                'success': True,
                'message': 'Escrow refunded to client successfully',
                'data': {
                    'escrow_reference': escrow.escrow_reference,
                    'amount_refunded': str(escrow.amount),
                    'status': escrow.status
                }
            }, status=status.HTTP_200_OK)

        return Response({
            'success': False,
            'message': 'Validation error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
