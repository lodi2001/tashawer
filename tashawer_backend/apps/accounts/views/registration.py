"""
Registration views for different user types.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.serializers.registration import (
    IndividualRegistrationSerializer,
    OrganizationRegistrationSerializer,
    ConsultantRegistrationSerializer,
)
from apps.accounts.services.email_service import EmailService


class IndividualRegistrationView(APIView):
    """
    POST: Register as individual user.
    Implements NUW-13: Register as Individual User
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = IndividualRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        # Send verification email
        EmailService.send_verification_email(user)

        return Response({
            'success': True,
            'message': 'Registration successful. Please check your email to verify your account.',
            'data': {
                'user_id': str(user.id),
                'email': user.email,
                'registration_no': user.registration_no,
                'user_type': user.user_type,
            }
        }, status=status.HTTP_201_CREATED)


class OrganizationRegistrationView(APIView):
    """
    POST: Register as organization.
    Implements NUW-14: Register as Organization (Company / Office)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OrganizationRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        # Send verification email
        EmailService.send_verification_email(user)

        return Response({
            'success': True,
            'message': 'Registration successful. Please check your email to verify your account.',
            'data': {
                'user_id': str(user.id),
                'email': user.email,
                'registration_no': user.registration_no,
                'user_type': user.user_type,
            }
        }, status=status.HTTP_201_CREATED)


class ConsultantRegistrationView(APIView):
    """
    POST: Register as consultant.
    Implements NUW-15: Register as Consultant (Individual or Office)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConsultantRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        # Send verification email
        EmailService.send_verification_email(user)

        return Response({
            'success': True,
            'message': 'Registration successful. Please check your email to verify your account. Your account will be reviewed by our team.',
            'data': {
                'user_id': str(user.id),
                'email': user.email,
                'registration_no': user.registration_no,
                'user_type': user.user_type,
            }
        }, status=status.HTTP_201_CREATED)
