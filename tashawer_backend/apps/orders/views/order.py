"""
Order views for managing work engagements.
"""

import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from django.db.models import Q

from apps.orders.models import Order, OrderStatus, OrderActivity
from apps.orders.serializers import (
    OrderListSerializer,
    OrderDetailSerializer,
    OrderCreateSerializer,
    OrderStartWorkSerializer,
    OrderDeliverSerializer,
    OrderRevisionSerializer,
    OrderCompleteSerializer,
    OrderCancelSerializer,
    OrderExtendDeadlineSerializer,
)
from apps.proposals.models import Proposal

logger = logging.getLogger(__name__)


class OrderListView(ListAPIView):
    """
    List orders for the authenticated user.
    Shows orders where user is either client or consultant.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = OrderListSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.filter(
            Q(client=user) | Q(consultant=user)
        ).select_related('client', 'consultant', 'project')

        # Filter by status
        order_status = self.request.query_params.get('status')
        if order_status:
            queryset = queryset.filter(status=order_status)

        # Filter by role
        role = self.request.query_params.get('role')
        if role == 'client':
            queryset = queryset.filter(client=user)
        elif role == 'consultant':
            queryset = queryset.filter(consultant=user)

        return queryset.order_by('-created_at')

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


class OrderDetailView(APIView):
    """
    Get order details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, order_number):
        """Get order details by order number"""
        try:
            order = Order.objects.select_related(
                'client', 'consultant', 'project', 'proposal', 'escrow'
            ).prefetch_related(
                'milestones', 'activities'
            ).get(order_number=order_number)
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

        serializer = OrderDetailSerializer(order, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data
        })


class OrderCreateView(APIView):
    """
    Create an order from an accepted proposal.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Create order from proposal"""
        serializer = OrderCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        proposal_id = serializer.validated_data['proposal_id']
        proposal = Proposal.objects.get(id=proposal_id)

        # Verify user is the client
        if proposal.project.client != request.user:
            return Response({
                'success': False,
                'message': 'Only the client can create orders'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check for existing escrow
        escrow = None
        if hasattr(proposal, 'escrows'):
            escrow = proposal.escrows.filter(status='held').first()

        # Create order
        order = Order.create_from_proposal(proposal, escrow=escrow)

        # Log activity
        OrderActivity.log(
            order=order,
            activity_type='created',
            user=request.user,
            description=f'Order created from proposal'
        )

        logger.info(f"Order created: {order.order_number} by {request.user.email}")

        return Response({
            'success': True,
            'message': 'Order created successfully',
            'data': OrderDetailSerializer(order, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


class OrderStartWorkView(APIView):
    """
    Start work on an order (consultant only).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_number):
        """Mark order as in progress"""
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Verify user is the consultant
        if order.consultant != request.user:
            return Response({
                'success': False,
                'message': 'Only the consultant can start work'
            }, status=status.HTTP_403_FORBIDDEN)

        if order.status != OrderStatus.CONFIRMED:
            return Response({
                'success': False,
                'message': f'Cannot start work on order with status: {order.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderStartWorkSerializer(data=request.data)
        if serializer.is_valid():
            notes = serializer.validated_data.get('notes')
            if notes:
                order.consultant_notes = notes

        order.start_work()

        OrderActivity.log(
            order=order,
            activity_type='started',
            user=request.user,
            description='Work started on order'
        )

        return Response({
            'success': True,
            'message': 'Work started successfully',
            'data': {'status': order.status}
        })


class OrderDeliverView(APIView):
    """
    Deliver order for client review (consultant only).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_number):
        """Submit order for review"""
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Verify user is the consultant
        if order.consultant != request.user:
            return Response({
                'success': False,
                'message': 'Only the consultant can deliver the order'
            }, status=status.HTTP_403_FORBIDDEN)

        if not order.can_deliver:
            return Response({
                'success': False,
                'message': f'Cannot deliver order with status: {order.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderDeliverSerializer(data=request.data)
        if serializer.is_valid():
            notes = serializer.validated_data.get('notes')
            if notes:
                order.consultant_notes = notes
                order.save(update_fields=['consultant_notes'])

        order.deliver()

        OrderActivity.log(
            order=order,
            activity_type='delivered',
            user=request.user,
            description='Order delivered for review'
        )

        return Response({
            'success': True,
            'message': 'Order delivered for review',
            'data': {'status': order.status}
        })


class OrderRevisionView(APIView):
    """
    Request revision on order (client only).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_number):
        """Request revision"""
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Verify user is the client
        if order.client != request.user:
            return Response({
                'success': False,
                'message': 'Only the client can request revisions'
            }, status=status.HTTP_403_FORBIDDEN)

        if not order.can_request_revision:
            if order.revisions_used >= order.max_revisions:
                return Response({
                    'success': False,
                    'message': f'Maximum revisions ({order.max_revisions}) reached'
                }, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                'success': False,
                'message': f'Cannot request revision for order with status: {order.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderRevisionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        feedback = serializer.validated_data['feedback']
        order.request_revision(notes=feedback)

        OrderActivity.log(
            order=order,
            activity_type='revision_requested',
            user=request.user,
            description=f'Revision requested: {feedback[:100]}...' if len(feedback) > 100 else f'Revision requested: {feedback}'
        )

        return Response({
            'success': True,
            'message': 'Revision requested',
            'data': {
                'status': order.status,
                'revisions_used': order.revisions_used,
                'revisions_remaining': order.max_revisions - order.revisions_used
            }
        })


class OrderCompleteView(APIView):
    """
    Complete order and release payment (client only).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_number):
        """Complete the order"""
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Verify user is the client
        if order.client != request.user:
            return Response({
                'success': False,
                'message': 'Only the client can complete the order'
            }, status=status.HTTP_403_FORBIDDEN)

        if order.status != OrderStatus.UNDER_REVIEW:
            return Response({
                'success': False,
                'message': f'Cannot complete order with status: {order.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        order.complete()

        OrderActivity.log(
            order=order,
            activity_type='completed',
            user=request.user,
            description='Order completed and payment released'
        )

        # Update project status
        from apps.projects.models import ProjectStatus
        order.project.status = ProjectStatus.COMPLETED
        order.project.completed_at = order.completed_at
        order.project.save(update_fields=['status', 'completed_at', 'updated_at'])

        return Response({
            'success': True,
            'message': 'Order completed successfully',
            'data': {'status': order.status}
        })


class OrderCancelView(APIView):
    """
    Cancel an order.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_number):
        """Cancel the order"""
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Verify user is client or consultant
        if order.client != request.user and order.consultant != request.user:
            return Response({
                'success': False,
                'message': 'Unauthorized'
            }, status=status.HTTP_403_FORBIDDEN)

        if not order.can_cancel:
            return Response({
                'success': False,
                'message': f'Cannot cancel order with status: {order.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderCancelSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        reason = serializer.validated_data['reason']
        order.cancel(user=request.user, reason=reason)

        role = 'client' if order.client == request.user else 'consultant'
        OrderActivity.log(
            order=order,
            activity_type='cancelled',
            user=request.user,
            description=f'Order cancelled by {role}: {reason[:100]}...' if len(reason) > 100 else f'Order cancelled by {role}: {reason}'
        )

        return Response({
            'success': True,
            'message': 'Order cancelled',
            'data': {'status': order.status}
        })


class OrderExtendDeadlineView(APIView):
    """
    Extend order deadline (requires mutual agreement or admin).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_number):
        """Extend the delivery deadline"""
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Verify user is client or consultant
        if order.client != request.user and order.consultant != request.user:
            return Response({
                'success': False,
                'message': 'Unauthorized'
            }, status=status.HTTP_403_FORBIDDEN)

        if not order.is_active:
            return Response({
                'success': False,
                'message': 'Cannot extend deadline for inactive order'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderExtendDeadlineSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        new_deadline = serializer.validated_data['new_deadline']
        reason = serializer.validated_data.get('reason', '')

        old_deadline = order.expected_delivery_date
        order.extend_deadline(new_deadline, reason)

        OrderActivity.log(
            order=order,
            activity_type='deadline_extended',
            user=request.user,
            description=f'Deadline extended from {old_deadline} to {new_deadline}',
            metadata={'old_deadline': str(old_deadline), 'new_deadline': str(new_deadline), 'reason': reason}
        )

        return Response({
            'success': True,
            'message': 'Deadline extended',
            'data': {
                'expected_delivery_date': str(order.expected_delivery_date),
                'original_delivery_date': str(order.original_delivery_date) if order.original_delivery_date else None
            }
        })
