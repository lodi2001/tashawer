"""
Email service for sending verification and password reset emails.
"""
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from apps.core.utils import generate_token

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails related to user accounts."""

    @staticmethod
    def send_verification_email(user):
        """
        Send email verification to user.

        Args:
            user: User instance
        """
        # Generate token
        token = generate_token(32)
        user.email_verification_token = token
        user.email_verification_sent_at = timezone.now()
        user.save(update_fields=['email_verification_token', 'email_verification_sent_at'])

        # Build verification URL
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

        # Prepare email content
        context = {
            'user': user,
            'verification_url': verification_url,
            'expiry_hours': settings.TASHAWER_SETTINGS.get('EMAIL_VERIFICATION_EXPIRY_HOURS', 24),
        }

        try:
            html_message = render_to_string('emails/verification.html', context)
            plain_message = strip_tags(html_message)
        except Exception:
            # Fallback if template doesn't exist
            plain_message = f"""
مرحباً،

شكراً لتسجيلك في منصة تشاور.

يرجى تأكيد بريدك الإلكتروني بالنقر على الرابط التالي:
{verification_url}

هذا الرابط صالح لمدة 24 ساعة.

مع تحيات،
فريق تشاور

---

Hello,

Thank you for registering on Tashawer platform.

Please verify your email by clicking the following link:
{verification_url}

This link is valid for 24 hours.

Best regards,
Tashawer Team
            """
            html_message = plain_message

        try:
            send_mail(
                subject='Verify your email - Tashawer | تأكيد البريد الإلكتروني - تشاور',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Verification email sent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
            raise

    @staticmethod
    def send_password_reset_email(user):
        """
        Send password reset email to user.

        Args:
            user: User instance
        """
        # Generate token
        token = generate_token(32)
        user.password_reset_token = token
        user.password_reset_sent_at = timezone.now()
        user.save(update_fields=['password_reset_token', 'password_reset_sent_at'])

        # Build reset URL
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

        # Prepare email content
        context = {
            'user': user,
            'reset_url': reset_url,
            'expiry_hours': settings.TASHAWER_SETTINGS.get('PASSWORD_RESET_EXPIRY_HOURS', 2),
        }

        try:
            html_message = render_to_string('emails/password_reset.html', context)
            plain_message = strip_tags(html_message)
        except Exception:
            # Fallback if template doesn't exist
            plain_message = f"""
مرحباً،

لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.

انقر على الرابط التالي لإعادة تعيين كلمة المرور:
{reset_url}

هذا الرابط صالح لمدة ساعتين فقط.

إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.

مع تحيات،
فريق تشاور

---

Hello,

We received a request to reset your password.

Click the following link to reset your password:
{reset_url}

This link is valid for 2 hours only.

If you didn't request a password reset, please ignore this email.

Best regards,
Tashawer Team
            """
            html_message = plain_message

        try:
            send_mail(
                subject='Reset your password - Tashawer | إعادة تعيين كلمة المرور - تشاور',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Password reset email sent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
            raise

    @staticmethod
    def send_account_approved_email(user):
        """
        Send account approved notification to user.

        Args:
            user: User instance
        """
        login_url = f"{settings.FRONTEND_URL}/login"

        plain_message = f"""
مرحباً {user.get_full_name()},

يسرنا إبلاغك بأنه تم الموافقة على حسابك في منصة تشاور.

يمكنك الآن تسجيل الدخول والبدء في استخدام المنصة:
{login_url}

مع تحيات،
فريق تشاور

---

Hello {user.get_full_name()},

We are pleased to inform you that your account has been approved on Tashawer platform.

You can now login and start using the platform:
{login_url}

Best regards,
Tashawer Team
        """

        try:
            send_mail(
                subject='Account Approved - Tashawer | تم الموافقة على الحساب - تشاور',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info(f"Account approved email sent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send account approved email to {user.email}: {str(e)}")
