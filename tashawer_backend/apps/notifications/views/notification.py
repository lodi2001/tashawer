"""
Notification views for API endpoints.
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from apps.notifications.models import Notification, NotificationPreference, DeviceToken
from apps.notifications.serializers import (
    NotificationSerializer,
    NotificationListSerializer,
    NotificationPreferenceSerializer,
    DeviceTokenSerializer,
)


class NotificationListView(APIView):
    """
    List user's notifications with optional filters.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get notifications for the current user."""
        user = request.user
        notifications = Notification.objects.filter(user=user)

        # Filter by read status
        is_read = request.query_params.get('is_read')
        if is_read is not None:
            notifications = notifications.filter(is_read=is_read.lower() == 'true')

        # Filter by category
        category = request.query_params.get('category')
        if category:
            notifications = notifications.filter(category=category)

        # Filter by type
        notification_type = request.query_params.get('type')
        if notification_type:
            notifications = notifications.filter(notification_type=notification_type)

        # Pagination
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))

        total_count = notifications.count()
        notifications = notifications[offset:offset + limit]

        serializer = NotificationListSerializer(notifications, many=True)

        return Response({
            'success': True,
            'data': serializer.data,
            'meta': {
                'total': total_count,
                'limit': limit,
                'offset': offset,
            }
        })


class NotificationDetailView(APIView):
    """
    Get notification details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, notification_id):
        """Get a specific notification."""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=request.user
            )
        except Notification.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Notification not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = NotificationSerializer(notification)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def delete(self, request, notification_id):
        """Delete a notification."""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=request.user
            )
        except Notification.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Notification not found'
            }, status=status.HTTP_404_NOT_FOUND)

        notification.delete()

        return Response({
            'success': True,
            'message': 'Notification deleted'
        })


class NotificationMarkReadView(APIView):
    """
    Mark a notification as read.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        """Mark notification as read."""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=request.user
            )
        except Notification.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Notification not found'
            }, status=status.HTTP_404_NOT_FOUND)

        notification.mark_as_read()

        return Response({
            'success': True,
            'message': 'Notification marked as read'
        })


class NotificationMarkAllReadView(APIView):
    """
    Mark all notifications as read.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Mark all notifications as read."""
        user = request.user

        # Filter by category if provided
        category = request.data.get('category')

        notifications = Notification.objects.filter(
            user=user,
            is_read=False
        )

        if category:
            notifications = notifications.filter(category=category)

        count = notifications.update(
            is_read=True,
            read_at=timezone.now()
        )

        return Response({
            'success': True,
            'message': f'{count} notifications marked as read'
        })


class NotificationUnreadCountView(APIView):
    """
    Get count of unread notifications.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get unread notification count."""
        user = request.user

        total_count = Notification.objects.filter(
            user=user,
            is_read=False
        ).count()

        # Count by category
        from django.db.models import Count
        by_category = Notification.objects.filter(
            user=user,
            is_read=False
        ).values('category').annotate(
            count=Count('id')
        )

        category_counts = {
            item['category']: item['count']
            for item in by_category
        }

        return Response({
            'success': True,
            'data': {
                'total': total_count,
                'by_category': category_counts,
            }
        })


class NotificationPreferenceView(APIView):
    """
    Get and update notification preferences.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get notification preferences."""
        preferences, created = NotificationPreference.objects.get_or_create(
            user=request.user,
            defaults={'preferred_language': 'en'}
        )

        serializer = NotificationPreferenceSerializer(preferences)

        return Response({
            'success': True,
            'data': serializer.data
        })

    def put(self, request):
        """Update notification preferences."""
        preferences, created = NotificationPreference.objects.get_or_create(
            user=request.user,
            defaults={'preferred_language': 'en'}
        )

        serializer = NotificationPreferenceSerializer(
            preferences,
            data=request.data,
            partial=True
        )

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        return Response({
            'success': True,
            'message': 'Preferences updated',
            'data': serializer.data
        })


class DeviceTokenListCreateView(APIView):
    """
    List and register device tokens for push notifications.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List all device tokens for the current user."""
        tokens = DeviceToken.objects.filter(user=request.user, is_active=True)
        serializer = DeviceTokenSerializer(tokens, many=True)

        return Response({
            'success': True,
            'data': serializer.data
        })

    def post(self, request):
        """Register a device token for push notifications."""
        serializer = DeviceTokenSerializer(
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        return Response({
            'success': True,
            'message': 'Device registered for push notifications',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)


class DeviceTokenDeleteView(APIView):
    """
    Delete a device token (unregister from push notifications).
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, token):
        """Delete a device token."""
        try:
            device_token = DeviceToken.objects.get(
                token=token,
                user=request.user
            )
        except DeviceToken.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Device token not found'
            }, status=status.HTTP_404_NOT_FOUND)

        device_token.delete()

        return Response({
            'success': True,
            'message': 'Device unregistered'
        })
