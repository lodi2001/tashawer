"""
URL configuration for notifications app.
"""

from django.urls import path
from apps.notifications.views import (
    NotificationListView,
    NotificationDetailView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,
    NotificationUnreadCountView,
    NotificationPreferenceView,
    DeviceTokenListCreateView,
    DeviceTokenDeleteView,
)

app_name = 'notifications'

urlpatterns = [
    # Notification endpoints
    path('', NotificationListView.as_view(), name='list'),
    path('unread-count/', NotificationUnreadCountView.as_view(), name='unread-count'),
    path('mark-all-read/', NotificationMarkAllReadView.as_view(), name='mark-all-read'),
    path('preferences/', NotificationPreferenceView.as_view(), name='preferences'),
    path('<uuid:notification_id>/', NotificationDetailView.as_view(), name='detail'),
    path('<uuid:notification_id>/mark-read/', NotificationMarkReadView.as_view(), name='mark-read'),

    # Device token endpoints for push notifications
    path('devices/', DeviceTokenListCreateView.as_view(), name='devices-list'),
    path('devices/<str:token>/', DeviceTokenDeleteView.as_view(), name='devices-delete'),
]
