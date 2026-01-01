"""
Profile views.
"""
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.accounts.serializers.profile import (
    UserSerializer,
    IndividualProfileSerializer,
    OrganizationProfileSerializer,
    ConsultantProfileSerializer,
)


class ProfileView(APIView):
    """
    GET: Get current user profile.
    PUT/PATCH: Update current user profile.
    Implements NUW-20: User Profile Management
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self, user):
        """Get appropriate serializer based on user type."""
        if user.user_type == User.UserType.INDIVIDUAL:
            return IndividualProfileSerializer
        elif user.user_type == User.UserType.ORGANIZATION:
            return OrganizationProfileSerializer
        elif user.user_type == User.UserType.CONSULTANT:
            return ConsultantProfileSerializer
        return UserSerializer

    def get_profile(self, user):
        """Get user profile based on type."""
        if user.user_type == User.UserType.INDIVIDUAL:
            return getattr(user, 'individual_profile', None)
        elif user.user_type == User.UserType.ORGANIZATION:
            return getattr(user, 'organization_profile', None)
        elif user.user_type == User.UserType.CONSULTANT:
            return getattr(user, 'consultant_profile', None)
        return None

    def get(self, request):
        user = request.user
        profile = self.get_profile(user)

        if profile:
            serializer_class = self.get_serializer_class(user)
            serializer = serializer_class(profile)
            data = serializer.data
        else:
            serializer = UserSerializer(user)
            data = serializer.data

        return Response({
            'success': True,
            'data': data
        })

    def put(self, request):
        return self._update_profile(request, partial=False)

    def patch(self, request):
        return self._update_profile(request, partial=True)

    def _update_profile(self, request, partial=False):
        user = request.user
        profile = self.get_profile(user)

        if not profile:
            return Response({
                'success': False,
                'error': {
                    'message': 'Profile not found.'
                }
            }, status=status.HTTP_404_NOT_FOUND)

        serializer_class = self.get_serializer_class(user)
        serializer = serializer_class(profile, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Update user fields if provided
        user_fields = ['mobile', 'preferred_language']
        user_data = {k: v for k, v in request.data.items() if k in user_fields}
        if user_data:
            for key, value in user_data.items():
                setattr(user, key, value)
            user.save(update_fields=list(user_data.keys()) + ['updated_at'])

        return Response({
            'success': True,
            'message': 'Profile updated successfully.',
            'data': serializer.data
        })
