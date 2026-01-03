"""
URL configuration for disputes app.
"""

from django.urls import path
from apps.disputes.views import (
    # User views
    DisputeListView,
    DisputeDetailView,
    DisputeCreateView,
    DisputeRespondView,
    DisputeEvidenceUploadView,
    DisputeMessageView,
    # Admin views
    AdminDisputeListView,
    AdminDisputeDetailView,
    AdminDisputeAssignView,
    AdminDisputeResolveView,
    AdminDisputeEscalateView,
    AdminDisputeRequestResponseView,
    AdminDisputeCloseView,
    AdminDisputeInternalNoteView,
)

app_name = 'disputes'

urlpatterns = [
    # User dispute endpoints
    path('', DisputeListView.as_view(), name='list'),
    path('create/', DisputeCreateView.as_view(), name='create'),
    path('<str:dispute_number>/', DisputeDetailView.as_view(), name='detail'),
    path('<str:dispute_number>/respond/', DisputeRespondView.as_view(), name='respond'),
    path('<str:dispute_number>/evidence/', DisputeEvidenceUploadView.as_view(), name='evidence'),
    path('<str:dispute_number>/messages/', DisputeMessageView.as_view(), name='messages'),

    # Admin dispute endpoints
    path('admin/list/', AdminDisputeListView.as_view(), name='admin-list'),
    path('admin/<str:dispute_number>/', AdminDisputeDetailView.as_view(), name='admin-detail'),
    path('admin/<str:dispute_number>/assign/', AdminDisputeAssignView.as_view(), name='admin-assign'),
    path('admin/<str:dispute_number>/resolve/', AdminDisputeResolveView.as_view(), name='admin-resolve'),
    path('admin/<str:dispute_number>/escalate/', AdminDisputeEscalateView.as_view(), name='admin-escalate'),
    path('admin/<str:dispute_number>/request-response/', AdminDisputeRequestResponseView.as_view(), name='admin-request-response'),
    path('admin/<str:dispute_number>/close/', AdminDisputeCloseView.as_view(), name='admin-close'),
    path('admin/<str:dispute_number>/internal-notes/', AdminDisputeInternalNoteView.as_view(), name='admin-internal-notes'),
]
