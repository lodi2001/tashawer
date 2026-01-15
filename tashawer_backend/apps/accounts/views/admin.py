"""
Admin views for user management.
Implements NUW-21: Admin – Manage Users (View, Approve, Suspend, Edit Basic Info)
"""
from django.db.models import Q
from django_filters import rest_framework as filters
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User, AuditLog
from apps.accounts.serializers.admin import (
    AdminUserListSerializer,
    AdminUserDetailSerializer,
    AdminUserEditSerializer,
    AdminSuspendSerializer,
    AuditLogSerializer,
)
from apps.accounts.services.email_service import EmailService
from apps.core.permissions import IsAdmin


class UserFilter(filters.FilterSet):
    """
    Filter for user list (AC3).
    Supports filtering by user_type, account_status, created_at range, and search.
    """
    user_type = filters.ChoiceFilter(choices=User.UserType.choices)
    account_status = filters.ChoiceFilter(choices=User.AccountStatus.choices)
    is_verified = filters.BooleanFilter()
    is_approved = filters.BooleanFilter()
    created_at_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_at_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    search = filters.CharFilter(method='filter_search')

    class Meta:
        model = User
        fields = ['user_type', 'account_status', 'is_verified', 'is_approved']

    def filter_search(self, queryset, name, value):
        """Search by name, email, or mobile."""
        if not value:
            return queryset

        return queryset.filter(
            Q(email__icontains=value) |
            Q(mobile__icontains=value) |
            Q(registration_no__icontains=value) |
            Q(individual_profile__full_name__icontains=value) |
            Q(organization_profile__company_name__icontains=value) |
            Q(organization_profile__representative_name__icontains=value) |
            Q(consultant_profile__full_name__icontains=value)
        ).distinct()


class AdminUserListView(ListAPIView):
    """
    GET: List all users with filters (AC1, AC2, AC3).

    Filters:
    - user_type: individual, organization, consultant, admin
    - account_status: pending, active, suspended, deactivated
    - is_verified: true/false
    - is_approved: true/false
    - created_at_after: ISO date
    - created_at_before: ISO date
    - search: search in name, email, mobile

    Ordering:
    - created_at (default, descending)
    - email
    - user_type
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = AdminUserListSerializer
    filterset_class = UserFilter
    search_fields = ['email', 'mobile', 'registration_no']
    ordering_fields = ['created_at', 'email', 'user_type', 'account_status']
    ordering = ['-created_at']

    def get_queryset(self):
        return User.objects.select_related(
            'individual_profile',
            'organization_profile',
            'consultant_profile',
        ).exclude(
            role='admin'  # Don't show other admins
        )

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({
            'success': True,
            'data': response.data
        })


class AdminUserDetailView(RetrieveAPIView):
    """
    GET: View detailed user profile (AC4).
    Returns full profile based on user type.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = AdminUserDetailSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return User.objects.select_related(
            'individual_profile',
            'organization_profile',
            'consultant_profile',
            'approved_by',
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        })


class AdminApproveUserView(APIView):
    """
    POST: Approve user account (AC5).
    Changes status to Active and sends email notification.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, id):
        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': {'message': 'User not found.'}
            }, status=status.HTTP_404_NOT_FOUND)

        if user.is_approved:
            return Response({
                'success': False,
                'error': {'message': 'User is already approved.'}
            }, status=status.HTTP_400_BAD_REQUEST)

        # Approve user
        user.approve(approved_by=request.user)

        # Log action
        AuditLog.log_action(
            admin=request.user,
            target_user=user,
            action=AuditLog.ActionType.APPROVE,
            details={'previous_status': 'pending'},
            request=request,
        )

        # Send email notification (handled by signal, but we can also call directly)
        try:
            EmailService.send_account_approved_email(user)
        except Exception:
            pass  # Don't fail if email fails

        return Response({
            'success': True,
            'message': 'User approved successfully.',
            'data': {
                'user_id': str(user.id),
                'email': user.email,
                'account_status': user.account_status,
            }
        })


class AdminSuspendUserView(APIView):
    """
    POST: Suspend user account (AC6).
    Blocks login and changes status to Suspended.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, id):
        serializer = AdminSuspendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': {'message': 'User not found.'}
            }, status=status.HTTP_404_NOT_FOUND)

        # Prevent admin from suspending themselves
        if user.id == request.user.id:
            return Response({
                'success': False,
                'error': {'message': 'You cannot suspend your own account.'}
            }, status=status.HTTP_400_BAD_REQUEST)

        # Prevent suspending other admins
        if user.role == 'admin':
            return Response({
                'success': False,
                'error': {'message': 'Cannot suspend admin accounts.'}
            }, status=status.HTTP_400_BAD_REQUEST)

        if user.account_status == User.AccountStatus.SUSPENDED:
            return Response({
                'success': False,
                'error': {'message': 'User is already suspended.'}
            }, status=status.HTTP_400_BAD_REQUEST)

        previous_status = user.account_status

        # Suspend user
        user.suspend()

        # Log action
        AuditLog.log_action(
            admin=request.user,
            target_user=user,
            action=AuditLog.ActionType.SUSPEND,
            details={
                'previous_status': previous_status,
                'reason': serializer.validated_data.get('reason', ''),
            },
            request=request,
        )

        return Response({
            'success': True,
            'message': 'User suspended successfully.',
            'data': {
                'user_id': str(user.id),
                'email': user.email,
                'account_status': user.account_status,
            }
        })


class AdminActivateUserView(APIView):
    """
    POST: Activate suspended user account (AC7).
    Restores account to Active status.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, id):
        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': {'message': 'User not found.'}
            }, status=status.HTTP_404_NOT_FOUND)

        if user.account_status == User.AccountStatus.ACTIVE:
            return Response({
                'success': False,
                'error': {'message': 'User is already active.'}
            }, status=status.HTTP_400_BAD_REQUEST)

        previous_status = user.account_status

        # Activate user
        user.activate()

        # Log action
        AuditLog.log_action(
            admin=request.user,
            target_user=user,
            action=AuditLog.ActionType.ACTIVATE,
            details={'previous_status': previous_status},
            request=request,
        )

        return Response({
            'success': True,
            'message': 'User activated successfully.',
            'data': {
                'user_id': str(user.id),
                'email': user.email,
                'account_status': user.account_status,
            }
        })


class AdminEditUserView(APIView):
    """
    PATCH: Edit basic user info (AC8).
    Limited fields only based on user type.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, id):
        serializer = AdminUserEditSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.select_related(
                'individual_profile',
                'organization_profile',
                'consultant_profile',
            ).get(id=id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': {'message': 'User not found.'}
            }, status=status.HTTP_404_NOT_FOUND)

        data = serializer.validated_data
        changes = {}

        # Update user fields
        if 'mobile' in data:
            changes['mobile'] = {'old': user.mobile, 'new': data['mobile']}
            user.mobile = data['mobile']

        if 'account_status' in data:
            changes['account_status'] = {'old': user.account_status, 'new': data['account_status']}
            user.account_status = data['account_status']
            if data['account_status'] == User.AccountStatus.SUSPENDED:
                user.is_active = False
            elif data['account_status'] == User.AccountStatus.ACTIVE:
                user.is_active = True

        user.save()

        # Update profile fields based on user type
        if user.user_type == User.UserType.INDIVIDUAL:
            profile = getattr(user, 'individual_profile', None)
            if profile and 'full_name' in data:
                changes['full_name'] = {'old': profile.full_name, 'new': data['full_name']}
                profile.full_name = data['full_name']
                profile.save()

        elif user.user_type == User.UserType.ORGANIZATION:
            profile = getattr(user, 'organization_profile', None)
            if profile:
                if 'representative_name' in data:
                    changes['representative_name'] = {
                        'old': profile.representative_name,
                        'new': data['representative_name']
                    }
                    profile.representative_name = data['representative_name']
                if 'address' in data:
                    changes['address'] = {'old': profile.address, 'new': data['address']}
                    profile.address = data['address']
                profile.save()

        elif user.role == 'consultant':
            profile = getattr(user, 'consultant_profile', None)
            if profile:
                if 'full_name' in data:
                    changes['full_name'] = {'old': profile.full_name, 'new': data['full_name']}
                    profile.full_name = data['full_name']
                if 'specialization' in data:
                    changes['specialization'] = {
                        'old': profile.specialization,
                        'new': data['specialization']
                    }
                    profile.specialization = data['specialization']
                if 'skills' in data:
                    changes['skills'] = {'old': profile.skills, 'new': data['skills']}
                    profile.skills = data['skills']
                profile.save()

        # Log action
        if changes:
            AuditLog.log_action(
                admin=request.user,
                target_user=user,
                action=AuditLog.ActionType.EDIT,
                details={'changes': changes},
                request=request,
            )

        return Response({
            'success': True,
            'message': 'User updated successfully.',
            'data': AdminUserDetailSerializer(user).data
        })


class AdminAuditLogListView(ListAPIView):
    """
    GET: List audit logs for admin actions.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = AuditLogSerializer
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = AuditLog.objects.select_related('admin', 'target_user')

        # Filter by target user if provided
        target_user_id = self.request.query_params.get('target_user')
        if target_user_id:
            queryset = queryset.filter(target_user_id=target_user_id)

        # Filter by action type if provided
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)

        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({
            'success': True,
            'data': response.data
        })
