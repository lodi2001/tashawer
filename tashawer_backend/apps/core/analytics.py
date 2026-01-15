"""
Analytics and reporting utilities for Tashawer platform.
Provides aggregated statistics for admin dashboard and user dashboards.
"""
import logging
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Sum, Avg, Q, F
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsAdmin
from apps.accounts.models import User
from apps.projects.models import Project, ProjectStatus
from apps.orders.models import Order, OrderStatus
from apps.proposals.models import Proposal

logger = logging.getLogger(__name__)


class PlatformOverviewView(APIView):
    """
    Get platform-wide statistics overview.
    Admin only endpoint.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        """
        Get overall platform statistics.

        Returns:
        - total_users: Total registered users
        - total_clients: Total clients
        - total_consultants: Total consultants
        - total_projects: Total projects
        - active_projects: Projects in open or in_progress status
        - completed_projects: Successfully completed projects
        - total_orders: Total orders
        - total_revenue: Total platform revenue (fees collected)
        """
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        # User statistics
        users = User.objects.all()
        total_users = users.count()
        total_clients = users.filter(role='client').count()
        total_consultants = users.filter(role='consultant').count()
        new_users_30d = users.filter(created_at__gte=thirty_days_ago).count()

        # Project statistics
        projects = Project.objects.all()
        total_projects = projects.count()
        active_projects = projects.filter(
            status__in=[ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS]
        ).count()
        completed_projects = projects.filter(status=ProjectStatus.COMPLETED).count()
        new_projects_30d = projects.filter(created_at__gte=thirty_days_ago).count()

        # Order statistics
        orders = Order.objects.all()
        total_orders = orders.count()
        active_orders = orders.filter(
            status__in=[OrderStatus.PENDING_PAYMENT, OrderStatus.CONFIRMED, OrderStatus.IN_PROGRESS]
        ).count()
        completed_orders = orders.filter(status=OrderStatus.COMPLETED).count()

        # Revenue statistics (platform fees from completed orders)
        revenue_data = orders.filter(
            status=OrderStatus.COMPLETED
        ).aggregate(
            total_revenue=Sum('escrow__platform_fee'),
            total_order_value=Sum('amount')
        )

        return Response({
            'success': True,
            'data': {
                'users': {
                    'total': total_users,
                    'clients': total_clients,
                    'consultants': total_consultants,
                    'new_last_30_days': new_users_30d,
                },
                'projects': {
                    'total': total_projects,
                    'active': active_projects,
                    'completed': completed_projects,
                    'new_last_30_days': new_projects_30d,
                    'completion_rate': round(
                        (completed_projects / total_projects * 100) if total_projects > 0 else 0, 1
                    ),
                },
                'orders': {
                    'total': total_orders,
                    'active': active_orders,
                    'completed': completed_orders,
                },
                'revenue': {
                    'total_platform_fees': str(revenue_data['total_revenue'] or Decimal('0.00')),
                    'total_order_value': str(revenue_data['total_order_value'] or Decimal('0.00')),
                },
            }
        }, status=status.HTTP_200_OK)


class UserGrowthView(APIView):
    """
    Get user registration trends over time.
    Admin only endpoint.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        """
        Get user registration trends.

        Query parameters:
        - period: daily, weekly, monthly (default: daily)
        - days: Number of days to look back (default: 30)
        """
        period = request.query_params.get('period', 'daily')
        days = min(int(request.query_params.get('days', 30)), 365)

        start_date = timezone.now() - timedelta(days=days)

        # Select truncation function based on period
        if period == 'monthly':
            trunc_func = TruncMonth('created_at')
        elif period == 'weekly':
            trunc_func = TruncWeek('created_at')
        else:
            trunc_func = TruncDate('created_at')

        # Get user registrations over time
        user_growth = User.objects.filter(
            created_at__gte=start_date
        ).annotate(
            date=trunc_func
        ).values('date').annotate(
            total=Count('id'),
            clients=Count('id', filter=Q(role='client')),
            consultants=Count('id', filter=Q(role='consultant')),
        ).order_by('date')

        return Response({
            'success': True,
            'data': {
                'period': period,
                'days': days,
                'growth': list(user_growth),
            }
        }, status=status.HTTP_200_OK)


class ProjectAnalyticsView(APIView):
    """
    Get project analytics and trends.
    Admin only endpoint.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        """
        Get project analytics.

        Query parameters:
        - days: Number of days to look back (default: 30)
        """
        days = min(int(request.query_params.get('days', 30)), 365)
        start_date = timezone.now() - timedelta(days=days)

        # Projects by status
        status_distribution = Project.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status')

        # Projects over time
        projects_over_time = Project.objects.filter(
            created_at__gte=start_date
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            created=Count('id'),
            published=Count('id', filter=Q(status__in=[
                ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS,
                ProjectStatus.COMPLETED
            ])),
        ).order_by('date')

        # Projects by category
        category_distribution = Project.objects.values(
            'category__name'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:10]

        # Average proposals per project
        avg_proposals = Project.objects.filter(
            status__in=[ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED]
        ).annotate(
            proposal_count=Count('proposals')
        ).aggregate(
            avg=Avg('proposal_count')
        )

        # Budget distribution
        budget_stats = Project.objects.aggregate(
            avg_min=Avg('budget_min'),
            avg_max=Avg('budget_max'),
            total_value=Sum('budget_max'),
        )

        return Response({
            'success': True,
            'data': {
                'days': days,
                'status_distribution': list(status_distribution),
                'projects_over_time': list(projects_over_time),
                'category_distribution': list(category_distribution),
                'average_proposals_per_project': round(avg_proposals['avg'] or 0, 1),
                'budget_stats': {
                    'average_min': str(budget_stats['avg_min'] or Decimal('0.00')),
                    'average_max': str(budget_stats['avg_max'] or Decimal('0.00')),
                    'total_value': str(budget_stats['total_value'] or Decimal('0.00')),
                },
            }
        }, status=status.HTTP_200_OK)


class RevenueAnalyticsView(APIView):
    """
    Get revenue analytics.
    Admin only endpoint.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        """
        Get revenue analytics.

        Query parameters:
        - period: daily, weekly, monthly (default: daily)
        - days: Number of days to look back (default: 30)
        """
        period = request.query_params.get('period', 'daily')
        days = min(int(request.query_params.get('days', 30)), 365)

        start_date = timezone.now() - timedelta(days=days)

        # Select truncation function based on period
        if period == 'monthly':
            trunc_func = TruncMonth('completed_at')
        elif period == 'weekly':
            trunc_func = TruncWeek('completed_at')
        else:
            trunc_func = TruncDate('completed_at')

        # Revenue over time (from completed orders)
        revenue_over_time = Order.objects.filter(
            status=OrderStatus.COMPLETED,
            completed_at__gte=start_date
        ).annotate(
            date=trunc_func
        ).values('date').annotate(
            order_count=Count('id'),
            total_value=Sum('amount'),
            platform_fees=Sum('escrow__platform_fee'),
        ).order_by('date')

        # Revenue by category
        revenue_by_category = Order.objects.filter(
            status=OrderStatus.COMPLETED
        ).values(
            category_name=F('project__category__name')
        ).annotate(
            total_value=Sum('amount'),
            platform_fees=Sum('escrow__platform_fee'),
            order_count=Count('id'),
        ).order_by('-total_value')[:10]

        # Summary stats
        summary = Order.objects.filter(
            status=OrderStatus.COMPLETED,
            completed_at__gte=start_date
        ).aggregate(
            total_orders=Count('id'),
            total_value=Sum('amount'),
            total_fees=Sum('escrow__platform_fee'),
            avg_order_value=Avg('amount'),
        )

        return Response({
            'success': True,
            'data': {
                'period': period,
                'days': days,
                'revenue_over_time': list(revenue_over_time),
                'revenue_by_category': list(revenue_by_category),
                'summary': {
                    'total_orders': summary['total_orders'] or 0,
                    'total_value': str(summary['total_value'] or Decimal('0.00')),
                    'total_fees': str(summary['total_fees'] or Decimal('0.00')),
                    'average_order_value': str(summary['avg_order_value'] or Decimal('0.00')),
                },
            }
        }, status=status.HTTP_200_OK)


class ConsultantDashboardView(APIView):
    """
    Get consultant-specific analytics for their dashboard.
    Consultant only endpoint.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get consultant dashboard statistics.
        """
        if request.user.role != 'consultant':
            return Response({
                'success': False,
                'message': 'Only consultants can access this endpoint'
            }, status=status.HTTP_403_FORBIDDEN)

        user = request.user
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        # Proposal statistics
        proposals = Proposal.objects.filter(consultant=user)
        total_proposals = proposals.count()
        pending_proposals = proposals.filter(status='pending').count()
        accepted_proposals = proposals.filter(status='accepted').count()

        # Calculate success rate
        decided_proposals = proposals.filter(status__in=['accepted', 'rejected']).count()
        success_rate = round(
            (accepted_proposals / decided_proposals * 100) if decided_proposals > 0 else 0, 1
        )

        # Order statistics
        orders = Order.objects.filter(consultant=user)
        active_orders = orders.filter(
            status__in=[OrderStatus.PENDING_PAYMENT, OrderStatus.CONFIRMED, OrderStatus.IN_PROGRESS]
        ).count()
        completed_orders = orders.filter(status=OrderStatus.COMPLETED).count()

        # Earnings
        earnings = orders.filter(
            status=OrderStatus.COMPLETED
        ).aggregate(
            total=Sum('escrow__consultant_amount'),
            last_30_days=Sum('escrow__consultant_amount', filter=Q(completed_at__gte=thirty_days_ago)),
        )

        # Recent activity (proposals and orders in last 30 days)
        recent_proposals = proposals.filter(created_at__gte=thirty_days_ago).count()
        recent_orders = orders.filter(created_at__gte=thirty_days_ago).count()

        return Response({
            'success': True,
            'data': {
                'proposals': {
                    'total': total_proposals,
                    'pending': pending_proposals,
                    'accepted': accepted_proposals,
                    'success_rate': success_rate,
                    'last_30_days': recent_proposals,
                },
                'orders': {
                    'active': active_orders,
                    'completed': completed_orders,
                    'last_30_days': recent_orders,
                },
                'earnings': {
                    'total': str(earnings['total'] or Decimal('0.00')),
                    'last_30_days': str(earnings['last_30_days'] or Decimal('0.00')),
                },
            }
        }, status=status.HTTP_200_OK)


class ClientDashboardView(APIView):
    """
    Get client-specific analytics for their dashboard.
    Client only endpoint.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get client dashboard statistics.
        """
        if request.user.role != 'client':
            return Response({
                'success': False,
                'message': 'Only clients can access this endpoint'
            }, status=status.HTTP_403_FORBIDDEN)

        user = request.user
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        # Project statistics
        projects = Project.objects.filter(client=user)
        total_projects = projects.count()
        active_projects = projects.filter(
            status__in=[ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS]
        ).count()
        completed_projects = projects.filter(status=ProjectStatus.COMPLETED).count()
        draft_projects = projects.filter(status=ProjectStatus.DRAFT).count()

        # Proposals received
        total_proposals = Proposal.objects.filter(project__client=user).count()
        pending_proposals = Proposal.objects.filter(
            project__client=user,
            status='pending'
        ).count()

        # Order statistics
        orders = Order.objects.filter(client=user)
        active_orders = orders.filter(
            status__in=[OrderStatus.PENDING_PAYMENT, OrderStatus.CONFIRMED, OrderStatus.IN_PROGRESS]
        ).count()
        completed_orders = orders.filter(status=OrderStatus.COMPLETED).count()

        # Spending
        spending = orders.filter(
            status=OrderStatus.COMPLETED
        ).aggregate(
            total=Sum('amount'),
            last_30_days=Sum('amount', filter=Q(completed_at__gte=thirty_days_ago)),
        )

        return Response({
            'success': True,
            'data': {
                'projects': {
                    'total': total_projects,
                    'draft': draft_projects,
                    'active': active_projects,
                    'completed': completed_projects,
                },
                'proposals': {
                    'total_received': total_proposals,
                    'pending_review': pending_proposals,
                },
                'orders': {
                    'active': active_orders,
                    'completed': completed_orders,
                },
                'spending': {
                    'total': str(spending['total'] or Decimal('0.00')),
                    'last_30_days': str(spending['last_30_days'] or Decimal('0.00')),
                },
            }
        }, status=status.HTTP_200_OK)
