"""
URL configuration for consultant discovery and portfolio features.
"""
from django.urls import path

from apps.accounts.views import (
    ConsultantListView,
    ConsultantPublicProfileView,
    PortfolioListView,
    PortfolioDetailView,
    PortfolioImageUploadView,
    PortfolioImageDeleteView,
    SkillListView,
    SkillDetailView,
    CertificationListView,
    CertificationDetailView,
    AvailabilityStatusView,
    ProjectInvitationListView,
    ProjectInvitationResponseView,
    ConsultantDashboardView,
)

app_name = 'consultants'

urlpatterns = [
    # Browse Consultants (public)
    path('', ConsultantListView.as_view(), name='consultant-list'),
    path('<uuid:user_id>/', ConsultantPublicProfileView.as_view(), name='consultant-public-profile'),

    # Dashboard (authenticated consultant)
    path('dashboard/', ConsultantDashboardView.as_view(), name='consultant-dashboard'),

    # Portfolio Management
    path('portfolio/', PortfolioListView.as_view(), name='portfolio-list'),
    path('portfolio/<uuid:pk>/', PortfolioDetailView.as_view(), name='portfolio-detail'),
    path('portfolio/<uuid:pk>/images/', PortfolioImageUploadView.as_view(), name='portfolio-images-upload'),
    path('portfolio/<uuid:portfolio_id>/images/<uuid:image_id>/', PortfolioImageDeleteView.as_view(), name='portfolio-image-delete'),

    # Skills Management
    path('skills/', SkillListView.as_view(), name='skill-list'),
    path('skills/<uuid:pk>/', SkillDetailView.as_view(), name='skill-detail'),

    # Certifications Management
    path('certifications/', CertificationListView.as_view(), name='certification-list'),
    path('certifications/<uuid:pk>/', CertificationDetailView.as_view(), name='certification-detail'),

    # Availability Status
    path('availability/', AvailabilityStatusView.as_view(), name='availability-status'),

    # Invitations (consultant receiving)
    path('invitations/', ProjectInvitationListView.as_view(), name='invitation-list'),
    path('invitations/<uuid:pk>/accept/', ProjectInvitationResponseView.as_view(), {'action': 'accept'}, name='invitation-accept'),
    path('invitations/<uuid:pk>/decline/', ProjectInvitationResponseView.as_view(), {'action': 'decline'}, name='invitation-decline'),
]
