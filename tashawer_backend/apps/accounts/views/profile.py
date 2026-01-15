"""
Profile views.
"""
import logging
import os

from django.conf import settings
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
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

logger = logging.getLogger(__name__)

# Allowed image types for avatars
ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5MB


class ProfileView(APIView):
    """
    GET: Get current user profile.
    PUT/PATCH: Update current user profile.
    Implements NUW-20: User Profile Management
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self, user):
        """Get appropriate serializer based on user role/type."""
        # Check role first for consultants
        if user.role == 'consultant':
            return ConsultantProfileSerializer
        # Then check user_type for clients
        if user.user_type == User.UserType.INDIVIDUAL:
            return IndividualProfileSerializer
        elif user.user_type == User.UserType.ORGANIZATION:
            return OrganizationProfileSerializer
        return UserSerializer

    def get_profile(self, user):
        """Get user profile based on role/type."""
        # Check role first for consultants
        if user.role == 'consultant':
            return getattr(user, 'consultant_profile', None)
        # Then check user_type for clients
        if user.user_type == User.UserType.INDIVIDUAL:
            return getattr(user, 'individual_profile', None)
        elif user.user_type == User.UserType.ORGANIZATION:
            return getattr(user, 'organization_profile', None)
        return None

    def get(self, request):
        user = request.user
        profile = self.get_profile(user)

        if profile:
            serializer_class = self.get_serializer_class(user)
            serializer = serializer_class(profile, context={'request': request})
            data = serializer.data
        else:
            serializer = UserSerializer(user, context={'request': request})
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
        serializer = serializer_class(profile, data=request.data, partial=partial, context={'request': request})
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


class AvatarUploadView(APIView):
    """
    Upload or delete profile picture (avatar/logo).
    POST: Upload new avatar
    DELETE: Remove current avatar
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_profile(self, user):
        """Get user profile based on role and type."""
        if user.role == 'consultant':
            return getattr(user, 'consultant_profile', None), 'avatar'
        elif user.user_type == User.UserType.ORGANIZATION:
            return getattr(user, 'organization_profile', None), 'logo'
        else:
            return getattr(user, 'individual_profile', None), 'avatar'

    def post(self, request):
        """Upload a new avatar/logo."""
        user = request.user
        profile, field_name = self.get_profile(user)

        if not profile:
            return Response({
                'success': False,
                'message': 'Profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if file was provided
        if 'file' not in request.FILES:
            return Response({
                'success': False,
                'message': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']

        # Validate file type
        if file.content_type not in ALLOWED_AVATAR_TYPES:
            return Response({
                'success': False,
                'message': f'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate file size
        if file.size > MAX_AVATAR_SIZE:
            return Response({
                'success': False,
                'message': f'File too large. Maximum size is 5MB'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Delete old avatar if exists
        old_file = getattr(profile, field_name)
        if old_file:
            try:
                old_file.delete(save=False)
            except Exception as e:
                logger.warning(f"Failed to delete old avatar: {e}")

        # Save new avatar
        setattr(profile, field_name, file)
        profile.save()

        # Get the URL of the uploaded file (absolute URL)
        new_file = getattr(profile, field_name)
        if new_file:
            avatar_url = request.build_absolute_uri(new_file.url)
        else:
            avatar_url = None

        logger.info(f"Avatar uploaded for user {user.id}")

        return Response({
            'success': True,
            'message': 'Profile picture uploaded successfully',
            'data': {
                'avatar_url': avatar_url
            }
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        """Delete current avatar/logo."""
        user = request.user
        profile, field_name = self.get_profile(user)

        if not profile:
            return Response({
                'success': False,
                'message': 'Profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Delete avatar if exists
        current_file = getattr(profile, field_name)
        if current_file:
            try:
                current_file.delete(save=False)
            except Exception as e:
                logger.warning(f"Failed to delete avatar file: {e}")

            setattr(profile, field_name, None)
            profile.save()

            logger.info(f"Avatar deleted for user {user.id}")

            return Response({
                'success': True,
                'message': 'Profile picture removed successfully'
            }, status=status.HTTP_200_OK)

        return Response({
            'success': False,
            'message': 'No profile picture to remove'
        }, status=status.HTTP_400_BAD_REQUEST)
