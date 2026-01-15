from django.urls import path
from .views import (
    ScopeGenerateView,
    ScopeRefineView,
    DeliverablesGenerateView,
    ProposalGenerateView,
    ProposalPDFView,
    AIUsageStatsView,
)

app_name = 'ai'

urlpatterns = [
    # Scope generation
    path('scope/generate/', ScopeGenerateView.as_view(), name='scope-generate'),
    path('scope/refine/', ScopeRefineView.as_view(), name='scope-refine'),
    path('scope/deliverables/', DeliverablesGenerateView.as_view(), name='deliverables-generate'),

    # Proposal generation
    path('proposal/generate/', ProposalGenerateView.as_view(), name='proposal-generate'),
    path('proposal/pdf/', ProposalPDFView.as_view(), name='proposal-pdf'),

    # Usage stats
    path('usage/', AIUsageStatsView.as_view(), name='usage-stats'),
]
