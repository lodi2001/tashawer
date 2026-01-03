"""
Milestone and Deliverable views for order progress tracking.
"""

import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from apps.orders.models import Order, Milestone, MilestoneStatus, Deliverable, OrderActivity
from apps.orders.serializers import (
    MilestoneListSerializer,
    MilestoneDetailSerializer,
    MilestoneCreateSerializer,
    MilestoneUpdateSerializer,
    MilestoneSubmitSerializer,
    MilestoneRevisionSerializer,
    MilestoneApproveSerializer,
    DeliverableSerializer,
    DeliverableCreateSerializer,
)

logger = logging.getLogger(__name__)


class MilestoneListView(APIView):
    """
    List milestones for an order.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, order_number):
        """Get milestones for an order"""
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Verify user has access
        if order.client != request.user and order.consultant != request.user:
            return Response({
                'success': False,
                'message': 'Unauthorized'
            }, status=status.HTTP_403_FORBIDDEN)

        milestones = order.milestones.all().order_by('sequence')
        serializer = MilestoneListSerializer(milestones, many=True)

        return Response({
            'success': True,
            'data': serializer.data
        })


class MilestoneCreateView(APIView):
    """
    Create a new milestone for an order.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_number):
        """Create a milestone"""
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Only consultant can create milestones
        if order.consultant != request.user:
            return Response({
                'success': False,
                'message': 'Only the consultant can create milestones'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = MilestoneCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Auto-set sequence if not provided
        if 'sequence' not in serializer.validated_data:
            max_sequence = order.milestones.aggregate(
                max_seq=models.Max('sequence')
            )['max_seq'] or 0
            serializer.validated_data['sequence'] = max_sequence + 1

        milestone = Milestone.objects.create(
            order=order,
            **serializer.validated_data
        )

        OrderActivity.log(
            order=order,
            activity_type='milestone_created',
            user=request.user,
            description=f'Milestone created: {milestone.title}'
        )

        return Response({
            'success': True,
            'message': 'Milestone created',
            'data': MilestoneDetailSerializer(milestone, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


class MilestoneDetailView(APIView):
    """
    Get, update, or delete a milestone.
    """
    permission_classes = [IsAuthenticated]

    def get_milestone(self, milestone_id, user):
        """Get milestone with access check"""
        try:
            milestone = Milestone.objects.select_related('order').get(id=milestone_id)
        except Milestone.DoesNotExist:
            return None, Response({
                'success': False,
                'message': 'Milestone not found'
            }, status=status.HTTP_404_NOT_FOUND)

        order = milestone.order
        if order.client != user and order.consultant != user:
            return None, Response({
                'success': False,
                'message': 'Unauthorized'
            }, status=status.HTTP_403_FORBIDDEN)

        return milestone, None

    def get(self, request, milestone_id):
        """Get milestone details"""
        milestone, error = self.get_milestone(milestone_id, request.user)
        if error:
            return error

        serializer = MilestoneDetailSerializer(milestone, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data
        })

    def patch(self, request, milestone_id):
        """Update milestone"""
        milestone, error = self.get_milestone(milestone_id, request.user)
        if error:
            return error

        # Only consultant can update milestones
        if milestone.order.consultant != request.user:
            return Response({
                'success': False,
                'message': 'Only the consultant can update milestones'
            }, status=status.HTTP_403_FORBIDDEN)

        if milestone.status in [MilestoneStatus.COMPLETED, MilestoneStatus.CANCELLED]:
            return Response({
                'success': False,
                'message': 'Cannot update completed or cancelled milestone'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = MilestoneUpdateSerializer(milestone, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        return Response({
            'success': True,
            'message': 'Milestone updated',
            'data': MilestoneDetailSerializer(milestone, context={'request': request}).data
        })

    def delete(self, request, milestone_id):
        """Delete milestone"""
        milestone, error = self.get_milestone(milestone_id, request.user)
        if error:
            return error

        # Only consultant can delete milestones
        if milestone.order.consultant != request.user:
            return Response({
                'success': False,
                'message': 'Only the consultant can delete milestones'
            }, status=status.HTTP_403_FORBIDDEN)

        if milestone.status not in [MilestoneStatus.PENDING]:
            return Response({
                'success': False,
                'message': 'Can only delete pending milestones'
            }, status=status.HTTP_400_BAD_REQUEST)

        milestone.delete()

        return Response({
            'success': True,
            'message': 'Milestone deleted'
        })


class MilestoneStartView(APIView):
    """
    Start working on a milestone.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, milestone_id):
        """Start milestone"""
        try:
            milestone = Milestone.objects.select_related('order').get(id=milestone_id)
        except Milestone.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Milestone not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Only consultant can start milestones
        if milestone.order.consultant != request.user:
            return Response({
                'success': False,
                'message': 'Only the consultant can start milestones'
            }, status=status.HTTP_403_FORBIDDEN)

        if not milestone.can_start:
            return Response({
                'success': False,
                'message': f'Cannot start milestone with status: {milestone.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        milestone.start()

        OrderActivity.log(
            order=milestone.order,
            activity_type='milestone_started',
            user=request.user,
            description=f'Started milestone: {milestone.title}'
        )

        return Response({
            'success': True,
            'message': 'Milestone started',
            'data': {'status': milestone.status}
        })


class MilestoneSubmitView(APIView):
    """
    Submit a milestone for client review.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, milestone_id):
        """Submit milestone for review"""
        try:
            milestone = Milestone.objects.select_related('order').get(id=milestone_id)
        except Milestone.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Milestone not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Only consultant can submit milestones
        if milestone.order.consultant != request.user:
            return Response({
                'success': False,
                'message': 'Only the consultant can submit milestones'
            }, status=status.HTTP_403_FORBIDDEN)

        if not milestone.can_submit:
            return Response({
                'success': False,
                'message': f'Cannot submit milestone with status: {milestone.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = MilestoneSubmitSerializer(data=request.data)
        if serializer.is_valid():
            notes = serializer.validated_data.get('notes')
            milestone.submit(notes=notes)
        else:
            milestone.submit()

        OrderActivity.log(
            order=milestone.order,
            activity_type='milestone_submitted',
            user=request.user,
            description=f'Submitted milestone for review: {milestone.title}'
        )

        return Response({
            'success': True,
            'message': 'Milestone submitted for review',
            'data': {'status': milestone.status}
        })


class MilestoneApproveView(APIView):
    """
    Approve a milestone (client only).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, milestone_id):
        """Approve milestone"""
        try:
            milestone = Milestone.objects.select_related('order').get(id=milestone_id)
        except Milestone.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Milestone not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Only client can approve milestones
        if milestone.order.client != request.user:
            return Response({
                'success': False,
                'message': 'Only the client can approve milestones'
            }, status=status.HTTP_403_FORBIDDEN)

        if not milestone.can_approve:
            return Response({
                'success': False,
                'message': f'Cannot approve milestone with status: {milestone.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = MilestoneApproveSerializer(data=request.data)
        if serializer.is_valid():
            feedback = serializer.validated_data.get('feedback')
            if feedback:
                milestone.client_feedback = feedback
                milestone.save(update_fields=['client_feedback'])

        milestone.approve(request.user)
        milestone.complete(request.user)

        OrderActivity.log(
            order=milestone.order,
            activity_type='milestone_approved',
            user=request.user,
            description=f'Approved milestone: {milestone.title}'
        )

        return Response({
            'success': True,
            'message': 'Milestone approved',
            'data': {
                'status': milestone.status,
                'order_progress': milestone.order.progress_percentage
            }
        })


class MilestoneRevisionView(APIView):
    """
    Request revision on a milestone (client only).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, milestone_id):
        """Request revision"""
        try:
            milestone = Milestone.objects.select_related('order').get(id=milestone_id)
        except Milestone.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Milestone not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Only client can request revisions
        if milestone.order.client != request.user:
            return Response({
                'success': False,
                'message': 'Only the client can request revisions'
            }, status=status.HTTP_403_FORBIDDEN)

        if not milestone.can_request_revision:
            return Response({
                'success': False,
                'message': f'Cannot request revision for milestone with status: {milestone.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = MilestoneRevisionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        feedback = serializer.validated_data['feedback']
        milestone.request_revision(feedback=feedback)

        OrderActivity.log(
            order=milestone.order,
            activity_type='milestone_revision',
            user=request.user,
            description=f'Requested revision on milestone: {milestone.title}'
        )

        return Response({
            'success': True,
            'message': 'Revision requested',
            'data': {'status': milestone.status}
        })


class DeliverableUploadView(APIView):
    """
    Upload a deliverable file to a milestone.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, milestone_id):
        """Upload deliverable"""
        try:
            milestone = Milestone.objects.select_related('order').get(id=milestone_id)
        except Milestone.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Milestone not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Only consultant can upload deliverables
        if milestone.order.consultant != request.user:
            return Response({
                'success': False,
                'message': 'Only the consultant can upload deliverables'
            }, status=status.HTTP_403_FORBIDDEN)

        if milestone.status in [MilestoneStatus.COMPLETED, MilestoneStatus.CANCELLED]:
            return Response({
                'success': False,
                'message': 'Cannot upload to completed or cancelled milestone'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = DeliverableCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Set additional fields
        serializer.validated_data['milestone'] = milestone
        serializer.validated_data['uploaded_by'] = request.user

        deliverable = serializer.save()

        OrderActivity.log(
            order=milestone.order,
            activity_type='deliverable_uploaded',
            user=request.user,
            description=f'Uploaded deliverable: {deliverable.original_filename}'
        )

        return Response({
            'success': True,
            'message': 'Deliverable uploaded',
            'data': DeliverableSerializer(deliverable, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


class DeliverableListView(APIView):
    """
    List deliverables for a milestone.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, milestone_id):
        """Get deliverables for a milestone"""
        try:
            milestone = Milestone.objects.select_related('order').get(id=milestone_id)
        except Milestone.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Milestone not found'
            }, status=status.HTTP_404_NOT_FOUND)

        order = milestone.order
        if order.client != request.user and order.consultant != request.user:
            return Response({
                'success': False,
                'message': 'Unauthorized'
            }, status=status.HTTP_403_FORBIDDEN)

        deliverables = milestone.deliverables.all().order_by('-created_at')
        serializer = DeliverableSerializer(deliverables, many=True, context={'request': request})

        return Response({
            'success': True,
            'data': serializer.data
        })


class DeliverableDeleteView(APIView):
    """
    Delete a deliverable.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, deliverable_id):
        """Delete deliverable"""
        try:
            deliverable = Deliverable.objects.select_related(
                'milestone__order'
            ).get(id=deliverable_id)
        except Deliverable.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Deliverable not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Only uploader can delete
        if deliverable.uploaded_by != request.user:
            return Response({
                'success': False,
                'message': 'Only the uploader can delete deliverables'
            }, status=status.HTTP_403_FORBIDDEN)

        milestone = deliverable.milestone
        if milestone.status in [MilestoneStatus.COMPLETED, MilestoneStatus.CANCELLED]:
            return Response({
                'success': False,
                'message': 'Cannot delete deliverables from completed milestones'
            }, status=status.HTTP_400_BAD_REQUEST)

        filename = deliverable.original_filename
        deliverable.delete()

        return Response({
            'success': True,
            'message': f'Deliverable "{filename}" deleted'
        })
