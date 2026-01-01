"""
Authentication views.
"""
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.accounts.serializers.auth import (
    LoginSerializer,
    TokenRefreshSerializer,
    EmailVerificationSerializer,
    ResendVerificationSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from apps.accounts.services.email_service import EmailService


class UserTypesView(APIView):
    """
    GET: Return available user types for registration (legacy endpoint).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # Legacy format for backwards compatibility
        user_types = [
            {
                'value': 'individual',
                'label': 'Individual User',
                'label_ar': 'مستخدم فردي',
                'description': 'Register as an individual client to post projects and hire consultants.',
                'description_ar': 'التسجيل كعميل فردي لنشر المشاريع وتوظيف الاستشاريين.'
            },
            {
                'value': 'organization',
                'label': 'Organization',
                'label_ar': 'منظمة',
                'description': 'Register your company or engineering office to access the platform.',
                'description_ar': 'تسجيل شركتك أو مكتبك الهندسي للوصول إلى المنصة.'
            },
            {
                'value': 'consultant',
                'label': 'Consultant',
                'label_ar': 'استشاري',
                'description': 'Register as a consultant to offer your engineering services.',
                'description_ar': 'التسجيل كاستشاري لتقديم خدماتك الهندسية.'
            },
        ]

        return Response({
            'success': True,
            'data': user_types
        })


class UserRolesView(APIView):
    """
    GET: Return available user roles and types for registration.
    New 2-step registration flow: Role (Client/Consultant) + Type (Individual/Organization)
    """
    permission_classes = [AllowAny]

    def get(self, request):
        roles = [
            {
                'value': 'client',
                'label': 'Client',
                'label_ar': 'عميل',
                'description': 'Post projects and hire consultants.',
                'description_ar': 'نشر المشاريع وتوظيف الاستشاريين.'
            },
            {
                'value': 'consultant',
                'label': 'Consultant',
                'label_ar': 'استشاري',
                'description': 'Offer your engineering services.',
                'description_ar': 'تقديم خدماتك الهندسية.'
            },
        ]

        types = [
            {
                'value': 'individual',
                'label': 'Individual',
                'label_ar': 'فرد',
                'description': 'Register as yourself.',
                'description_ar': 'التسجيل كفرد.'
            },
            {
                'value': 'organization',
                'label': 'Organization',
                'label_ar': 'منظمة',
                'description': 'Register as a company or office.',
                'description_ar': 'التسجيل كشركة أو مكتب.'
            },
        ]

        return Response({
            'success': True,
            'data': {
                'roles': roles,
                'types': types
            }
        })


class LoginView(APIView):
    """
    POST: User login with email and password.
    Implements NUW-17: User Login
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        result = serializer.save()
        user = result['user']

        # Update last login
        user.last_login_at = timezone.now()
        user.save(update_fields=['last_login_at'])

        return Response({
            'success': True,
            'message': 'Login successful.',
            'data': {
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'role': user.role,
                    'user_type': user.user_type,
                    'full_name': user.get_full_name(),
                    'is_verified': user.is_verified,
                    'is_approved': user.is_approved,
                },
                'tokens': result['tokens']
            }
        })


class LogoutView(APIView):
    """
    POST: User logout - blacklist refresh token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            return Response({
                'success': True,
                'message': 'Logout successful.'
            })
        except Exception:
            return Response({
                'success': True,
                'message': 'Logout successful.'
            })


class TokenRefreshView(APIView):
    """
    POST: Refresh access token using refresh token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TokenRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        return Response({
            'success': True,
            'data': {
                'access': serializer.validated_data['access']
            }
        })


class EmailVerificationView(APIView):
    """
    POST: Verify email with token.
    Implements NUW-16: Email Verification After Registration
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']

        try:
            user = User.objects.get(
                email_verification_token=token,
                is_verified=False
            )
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'message': 'Invalid or expired verification token.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if token is expired (24 hours)
        if user.email_verification_sent_at:
            expiry_time = user.email_verification_sent_at + timezone.timedelta(hours=24)
            if timezone.now() > expiry_time:
                return Response({
                    'success': False,
                    'error': {
                        'message': 'Verification token has expired. Please request a new one.'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

        # Verify email
        user.verify_email()

        return Response({
            'success': True,
            'message': 'Email verified successfully.'
        })


class ResendVerificationView(APIView):
    """
    POST: Resend email verification.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email, is_verified=False)
            EmailService.send_verification_email(user)
        except User.DoesNotExist:
            pass  # Don't reveal if email exists

        return Response({
            'success': True,
            'message': 'If an unverified account exists with this email, a verification link has been sent.'
        })


class ForgotPasswordView(APIView):
    """
    POST: Request password reset.
    Implements NUW-18: Forgot Password & Reset Password (Part 1)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
            EmailService.send_password_reset_email(user)
        except User.DoesNotExist:
            pass  # Don't reveal if email exists

        return Response({
            'success': True,
            'message': 'If an account exists with this email, a password reset link has been sent.'
        })


class ResetPasswordView(APIView):
    """
    POST: Reset password with token.
    Implements NUW-18: Forgot Password & Reset Password (Part 2)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            user = User.objects.get(
                password_reset_token=token
            )
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'message': 'Invalid or expired reset token.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if token is expired (2 hours)
        if user.password_reset_sent_at:
            expiry_time = user.password_reset_sent_at + timezone.timedelta(hours=2)
            if timezone.now() > expiry_time:
                return Response({
                    'success': False,
                    'error': {
                        'message': 'Reset token has expired. Please request a new one.'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

        # Reset password
        user.set_password(new_password)
        user.password_reset_token = None
        user.password_reset_sent_at = None
        user.save(update_fields=['password', 'password_reset_token', 'password_reset_sent_at', 'updated_at'])

        return Response({
            'success': True,
            'message': 'Password reset successful. You can now login with your new password.'
        })
