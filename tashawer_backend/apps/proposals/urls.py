from django.urls import path
from .views import (
    ProposalCreateView,
    ProposalDetailView,
    ProposalUpdateView,
    ProposalAcceptView,
    ProposalRejectView,
    ProposalWithdrawView,
    MyProposalsView,
    ProjectProposalsView,
)

app_name = 'proposals'

urlpatterns = [
    # Proposals - List views
    path('my-proposals/', MyProposalsView.as_view(), name='my-proposals'),

    # Proposals - CRUD
    path('', ProposalCreateView.as_view(), name='proposal-create'),
    path('<uuid:pk>/', ProposalDetailView.as_view(), name='proposal-detail'),
    path('<uuid:pk>/update/', ProposalUpdateView.as_view(), name='proposal-update'),

    # Proposals - Actions
    path('<uuid:pk>/accept/', ProposalAcceptView.as_view(), name='proposal-accept'),
    path('<uuid:pk>/reject/', ProposalRejectView.as_view(), name='proposal-reject'),
    path('<uuid:pk>/withdraw/', ProposalWithdrawView.as_view(), name='proposal-withdraw'),

    # Project proposals (for clients)
    path('project/<uuid:project_id>/', ProjectProposalsView.as_view(), name='project-proposals'),
]
