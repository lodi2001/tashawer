"""
URL configuration for core app (analytics, reports, and settings).
"""
from django.urls import path

from .analytics import (
    PlatformOverviewView,
    UserGrowthView,
    ProjectAnalyticsView,
    RevenueAnalyticsView,
    ConsultantDashboardView,
    ClientDashboardView,
)
from .views import (
    PlatformSettingsView,
    TestAIConnectionView,
)

urlpatterns = [
    # Admin Analytics
    path('admin/overview/', PlatformOverviewView.as_view(), name='platform-overview'),
    path('admin/users/growth/', UserGrowthView.as_view(), name='user-growth'),
    path('admin/projects/analytics/', ProjectAnalyticsView.as_view(), name='project-analytics'),
    path('admin/revenue/', RevenueAnalyticsView.as_view(), name='revenue-analytics'),

    # Admin Settings
    path('admin/settings/', PlatformSettingsView.as_view(), name='platform-settings'),
    path('admin/settings/test-ai/', TestAIConnectionView.as_view(), name='test-ai-connection'),

    # User Dashboards
    path('dashboard/consultant/', ConsultantDashboardView.as_view(), name='consultant-dashboard'),
    path('dashboard/client/', ClientDashboardView.as_view(), name='client-dashboard'),
]
