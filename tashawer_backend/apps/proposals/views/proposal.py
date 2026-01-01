import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from apps.core.permissions import IsConsultant, IsClient
from apps.proposals.models import Proposal, ProposalStatus
from apps.proposals.serializers import (
    ProposalListSerializer,
    ProposalDetailSerializer,
    ProposalCreateSerializer,
    ProposalUpdateSerializer,
)
from apps.projects.models import Project

logger = logging.getLogger(__name__)


class ProposalCreateView(APIView):
    """
    Submit a new proposal to a project.
    Only consultants can submit proposals.
    """
    permission_classes = [IsAuthenticated, IsConsultant]

    def post(self, request):
        """
        Submit a new proposal.

        Request body:
        - project_id: uuid (required)
        - cover_letter: string (required, min 100 chars)
        - proposed_amount: decimal (required)
        - estimated_duration: integer (required, days)
        - delivery_date: date (required)
        """
        serializer = ProposalCreateSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            proposal = serializer.save()
            logger.info(f"Proposal submitted: {proposal.id} by consultant {request.user.id}")

            detail_serializer = ProposalDetailSerializer(
                proposal,
                context={'request': request}
            )

            return Response({
                'success': True,
                'message': 'Proposal submitted successfully',
                'data': detail_serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'success': False,
            'message': 'Validation error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class ProposalDetailView(APIView):
    """
    Retrieve proposal details.
    Only the proposal owner or project owner can view proposal details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Get proposal details by ID."""
        proposal = get_object_or_404(Proposal, pk=pk)

        # Check access: proposal owner or project owner
        is_proposal_owner = proposal.consultant_id == request.user.id
        is_project_owner = proposal.project.client_id == request.user.id
        is_admin = request.user.role == 'admin'

        if not is_proposal_owner and not is_project_owner and not is_admin:
            return Response({
                'success': False,
                'message': 'Proposal not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = ProposalDetailSerializer(proposal, context={'request': request})

        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class ProposalUpdateView(APIView):
    """
    Update a proposal.
    Only the proposal owner can update their proposal.
    """
    permission_classes = [IsAuthenticated, IsConsultant]

    def patch(self, request, pk):
        """Update proposal details."""
        proposal = get_object_or_404(Proposal, pk=pk, consultant=request.user)

        if not proposal.is_editable:
            return Response({
                'success': False,
                'message': 'This proposal cannot be edited in its current status'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = ProposalUpdateSerializer(
            proposal,
            data=request.data,
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():
            proposal = serializer.save()
            logger.info(f"Proposal updated: {proposal.id} by consultant {request.user.id}")

            detail_serializer = ProposalDetailSerializer(
                proposal,
                context={'request': request}
            )

            return Response({
                'success': True,
                'message': 'Proposal updated successfully',
                'data': detail_serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            'success': False,
            'message': 'Validation error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class ProposalAcceptView(APIView):
    """
    Accept a proposal.
    Only the project owner can accept proposals on their project.
    """
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request, pk):
        """Accept a proposal."""
        proposal = get_object_or_404(Proposal, pk=pk)

        # Check if user is the project owner
        if proposal.project.client_id != request.user.id:
            return Response({
                'success': False,
                'message': 'You can only accept proposals on your own projects'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check if proposal can be accepted
        if proposal.status not in [ProposalStatus.SUBMITTED, ProposalStatus.UNDER_REVIEW]:
            return Response({
                'success': False,
                'message': 'This proposal cannot be accepted in its current status'
            }, status=status.HTTP_400_BAD_REQUEST)

        proposal.accept()
        logger.info(f"Proposal accepted: {proposal.id} by client {request.user.id}")

        serializer = ProposalDetailSerializer(proposal, context={'request': request})

        return Response({
            'success': True,
            'message': 'Proposal accepted successfully. Project is now in progress.',
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class ProposalRejectView(APIView):
    """
    Reject a proposal.
    Only the project owner can reject proposals on their project.
    """
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request, pk):
        """Reject a proposal."""
        proposal = get_object_or_404(Proposal, pk=pk)

        # Check if user is the project owner
        if proposal.project.client_id != request.user.id:
            return Response({
                'success': False,
                'message': 'You can only reject proposals on your own projects'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check if proposal can be rejected
        if proposal.status not in [ProposalStatus.SUBMITTED, ProposalStatus.UNDER_REVIEW]:
            return Response({
                'success': False,
                'message': 'This proposal cannot be rejected in its current status'
            }, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason')
        proposal.reject(reason=reason)
        logger.info(f"Proposal rejected: {proposal.id} by client {request.user.id}")

        serializer = ProposalDetailSerializer(proposal, context={'request': request})

        return Response({
            'success': True,
            'message': 'Proposal rejected',
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class ProposalWithdrawView(APIView):
    """
    Withdraw a proposal.
    Only the proposal owner can withdraw their proposal.
    """
    permission_classes = [IsAuthenticated, IsConsultant]

    def post(self, request, pk):
        """Withdraw a proposal."""
        proposal = get_object_or_404(Proposal, pk=pk, consultant=request.user)

        if not proposal.can_withdraw:
            return Response({
                'success': False,
                'message': 'This proposal cannot be withdrawn in its current status'
            }, status=status.HTTP_400_BAD_REQUEST)

        proposal.withdraw()
        logger.info(f"Proposal withdrawn: {proposal.id} by consultant {request.user.id}")

        serializer = ProposalDetailSerializer(proposal, context={'request': request})

        return Response({
            'success': True,
            'message': 'Proposal withdrawn successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class MyProposalsView(APIView):
    """
    List proposals submitted by the current consultant.
    """
    permission_classes = [IsAuthenticated, IsConsultant]

    def get(self, request):
        """
        Get list of consultant's proposals.

        Query parameters:
        - status: filter by status
        - page: page number (default: 1)
        - page_size: items per page (default: 10, max: 50)
        """
        proposals = Proposal.objects.filter(consultant=request.user)

        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter and status_filter in ProposalStatus.values:
            proposals = proposals.filter(status=status_filter)

        # Order by created date (newest first)
        proposals = proposals.order_by('-created_at')

        # Get stats
        all_proposals = Proposal.objects.filter(consultant=request.user)
        stats = {
            'total': all_proposals.count(),
            'submitted': all_proposals.filter(status=ProposalStatus.SUBMITTED).count(),
            'accepted': all_proposals.filter(status=ProposalStatus.ACCEPTED).count(),
            'rejected': all_proposals.filter(status=ProposalStatus.REJECTED).count(),
        }

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 10)), 50)
        start = (page - 1) * page_size
        end = start + page_size

        total_count = proposals.count()
        proposals = proposals[start:end]

        serializer = ProposalListSerializer(
            proposals,
            many=True,
            context={'request': request}
        )

        return Response({
            'success': True,
            'data': {
                'proposals': serializer.data,
                'stats': stats,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                }
            }
        }, status=status.HTTP_200_OK)


class ProjectProposalsView(APIView):
    """
    List all proposals for a specific project.
    Only the project owner can view proposals on their project.
    """
    permission_classes = [IsAuthenticated, IsClient]

    def get(self, request, project_id):
        """
        Get list of proposals for a project.

        Query parameters:
        - sort: sort by (amount_low, amount_high, newest, oldest)
        - page: page number (default: 1)
        - page_size: items per page (default: 10, max: 50)
        """
        project = get_object_or_404(Project, pk=project_id, client=request.user)

        proposals = Proposal.objects.filter(project=project)

        # Sorting
        sort = request.query_params.get('sort', 'newest')
        if sort == 'amount_low':
            proposals = proposals.order_by('proposed_amount')
        elif sort == 'amount_high':
            proposals = proposals.order_by('-proposed_amount')
        elif sort == 'oldest':
            proposals = proposals.order_by('submitted_at')
        else:  # newest
            proposals = proposals.order_by('-submitted_at')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 10)), 50)
        start = (page - 1) * page_size
        end = start + page_size

        total_count = proposals.count()
        proposals = proposals[start:end]

        serializer = ProposalListSerializer(
            proposals,
            many=True,
            context={'request': request}
        )

        return Response({
            'success': True,
            'data': {
                'proposals': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                }
            }
        }, status=status.HTTP_200_OK)
