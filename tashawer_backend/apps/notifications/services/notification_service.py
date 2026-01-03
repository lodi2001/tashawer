"""
Notification service for sending notifications via multiple channels.
"""

import logging
from typing import Dict, Any, Optional, List
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone

from apps.notifications.models import (
    Notification,
    NotificationPreference,
    NotificationType,
    NotificationCategory,
    EmailLog,
)

logger = logging.getLogger(__name__)


# Mapping notification types to categories
TYPE_TO_CATEGORY = {
    # Orders
    NotificationType.ORDER_CREATED: NotificationCategory.ORDERS,
    NotificationType.ORDER_CONFIRMED: NotificationCategory.ORDERS,
    NotificationType.ORDER_STARTED: NotificationCategory.ORDERS,
    NotificationType.ORDER_DELIVERED: NotificationCategory.ORDERS,
    NotificationType.ORDER_COMPLETED: NotificationCategory.ORDERS,
    NotificationType.ORDER_CANCELLED: NotificationCategory.ORDERS,
    NotificationType.ORDER_REVISION_REQUESTED: NotificationCategory.ORDERS,
    NotificationType.MILESTONE_SUBMITTED: NotificationCategory.ORDERS,
    NotificationType.MILESTONE_APPROVED: NotificationCategory.ORDERS,
    NotificationType.MILESTONE_REVISION: NotificationCategory.ORDERS,
    # Proposals
    NotificationType.PROPOSAL_RECEIVED: NotificationCategory.PROPOSALS,
    NotificationType.PROPOSAL_ACCEPTED: NotificationCategory.PROPOSALS,
    NotificationType.PROPOSAL_REJECTED: NotificationCategory.PROPOSALS,
    NotificationType.PROJECT_INVITATION: NotificationCategory.PROPOSALS,
    NotificationType.PROJECT_UPDATED: NotificationCategory.PROPOSALS,
    # Payments
    NotificationType.PAYMENT_RECEIVED: NotificationCategory.PAYMENTS,
    NotificationType.PAYMENT_RELEASED: NotificationCategory.PAYMENTS,
    NotificationType.WITHDRAWAL_APPROVED: NotificationCategory.PAYMENTS,
    NotificationType.WITHDRAWAL_REJECTED: NotificationCategory.PAYMENTS,
    # Disputes
    NotificationType.DISPUTE_OPENED: NotificationCategory.DISPUTES,
    NotificationType.DISPUTE_RESPONSE_NEEDED: NotificationCategory.DISPUTES,
    NotificationType.DISPUTE_RESOLVED: NotificationCategory.DISPUTES,
    # Messages
    NotificationType.NEW_MESSAGE: NotificationCategory.MESSAGES,
    # Reviews
    NotificationType.NEW_REVIEW: NotificationCategory.REVIEWS,
    # System
    NotificationType.SYSTEM_ANNOUNCEMENT: NotificationCategory.SYSTEM,
    NotificationType.ACCOUNT_VERIFIED: NotificationCategory.SYSTEM,
}


class NotificationService:
    """
    Service for sending notifications through various channels.
    """

    @classmethod
    def get_user_preferences(cls, user) -> NotificationPreference:
        """Get or create notification preferences for user."""
        preferences, created = NotificationPreference.objects.get_or_create(
            user=user,
            defaults={'preferred_language': 'en'}
        )
        return preferences

    @classmethod
    def send(
        cls,
        user,
        notification_type: str,
        title: str,
        message: str,
        title_ar: str = '',
        message_ar: str = '',
        related_object_type: str = '',
        related_object_id: str = None,
        action_url: str = '',
        metadata: Dict[str, Any] = None,
        send_email: bool = True,
        send_push: bool = True,
        email_template: str = None,
        email_context: Dict[str, Any] = None,
    ) -> Notification:
        """
        Send a notification to a user.

        Args:
            user: User to send notification to
            notification_type: Type of notification (from NotificationType)
            title: Notification title in English
            message: Notification message in English
            title_ar: Notification title in Arabic
            message_ar: Notification message in Arabic
            related_object_type: Type of related object (e.g., 'order', 'dispute')
            related_object_id: UUID of related object
            action_url: URL to navigate to when notification is clicked
            metadata: Additional metadata dict
            send_email: Whether to send email notification
            send_push: Whether to send push notification
            email_template: Custom email template name
            email_context: Additional context for email template

        Returns:
            Created Notification instance
        """
        # Get category for this notification type
        category = TYPE_TO_CATEGORY.get(notification_type, NotificationCategory.SYSTEM)

        # Get user preferences
        preferences = cls.get_user_preferences(user)

        # Create in-app notification
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            category=category,
            title=title,
            title_ar=title_ar or title,
            message=message,
            message_ar=message_ar or message,
            related_object_type=related_object_type,
            related_object_id=related_object_id,
            action_url=action_url,
            metadata=metadata or {},
        )

        # Send email if enabled
        if send_email and preferences.should_send_email(category):
            cls._send_email(
                user=user,
                notification=notification,
                preferences=preferences,
                template=email_template,
                extra_context=email_context,
            )

        # Send push notification if enabled (placeholder for future)
        if send_push and preferences.should_send_push(category):
            cls._send_push(user, notification, preferences)

        logger.info(
            f"Notification sent: {notification_type} to {user.email}"
        )

        return notification

    @classmethod
    def send_to_multiple(
        cls,
        users: List,
        notification_type: str,
        title: str,
        message: str,
        **kwargs
    ) -> List[Notification]:
        """Send notification to multiple users."""
        notifications = []
        for user in users:
            try:
                notification = cls.send(
                    user=user,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    **kwargs
                )
                notifications.append(notification)
            except Exception as e:
                logger.error(f"Failed to send notification to {user.email}: {e}")
        return notifications

    @classmethod
    def _send_email(
        cls,
        user,
        notification: Notification,
        preferences: NotificationPreference,
        template: str = None,
        extra_context: Dict[str, Any] = None,
    ):
        """Send email notification."""
        try:
            language = preferences.preferred_language

            # Get title and message in preferred language
            title = notification.get_title(language)
            message = notification.get_message(language)

            # Determine template
            template_name = template or f"emails/{notification.notification_type}.html"
            fallback_template = "emails/base_notification.html"

            # Build context
            context = {
                'user': user,
                'notification': notification,
                'title': title,
                'message': message,
                'action_url': notification.action_url,
                'language': language,
                'is_rtl': language == 'ar',
                'site_name': 'Tashawer',
                'site_url': settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else '',
                **(extra_context or {}),
            }

            # Try to render the specific template, fallback to base
            try:
                html_content = render_to_string(template_name, context)
            except Exception:
                html_content = render_to_string(fallback_template, context)

            text_content = strip_tags(html_content)

            # Get subject
            subject = f"[Tashawer] {title}"

            # Create email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            email.attach_alternative(html_content, "text/html")

            # Log email
            email_log = EmailLog.objects.create(
                user=user,
                to_email=user.email,
                subject=subject,
                template_name=template_name,
                notification_type=notification.notification_type,
                status='pending',
            )

            # Send email
            email.send(fail_silently=False)

            # Update log
            email_log.status = 'sent'
            email_log.sent_at = timezone.now()
            email_log.save(update_fields=['status', 'sent_at'])

            logger.info(f"Email sent to {user.email}: {subject}")

        except Exception as e:
            logger.error(f"Failed to send email to {user.email}: {e}")
            if 'email_log' in locals():
                email_log.status = 'failed'
                email_log.error_message = str(e)
                email_log.save(update_fields=['status', 'error_message'])

    @classmethod
    def _send_push(
        cls,
        user,
        notification: Notification,
        preferences: NotificationPreference,
    ):
        """
        Send push notification via Firebase Cloud Messaging.
        """
        try:
            from apps.notifications.services.firebase_service import FirebaseService

            language = preferences.preferred_language

            # Get localized title and message
            title = notification.get_title(language)
            message = notification.get_message(language)

            # Prepare data payload
            data = {
                'notification_id': str(notification.id),
                'notification_type': notification.notification_type,
                'category': notification.category,
                'action_url': notification.action_url or '/notifications',
            }

            # Send push to all user devices
            result = FirebaseService.send_to_user(
                user=user,
                title=title,
                body=message,
                data=data,
            )

            if result['success'] > 0:
                logger.info(
                    f"Push notification sent to {user.email}: "
                    f"{result['success']} devices"
                )

        except Exception as e:
            logger.error(f"Failed to send push to {user.email}: {e}")

    @classmethod
    def _send_sms(
        cls,
        user,
        message: str,
        notification_type: str = None,
    ):
        """
        Send SMS notification.
        Placeholder for SMS provider integration.
        """
        # TODO: Implement SMS via Twilio or local provider
        pass

    # ============ Convenience methods for common notifications ============

    @classmethod
    def notify_order_created(cls, order):
        """Notify consultant about new order."""
        cls.send(
            user=order.consultant,
            notification_type=NotificationType.ORDER_CREATED,
            title=f"New Order #{order.order_number}",
            message=f"You have a new order for project: {order.project.title}",
            title_ar=f"طلب جديد #{order.order_number}",
            message_ar=f"لديك طلب جديد للمشروع: {order.project.title}",
            related_object_type='order',
            related_object_id=order.id,
            action_url=f"/orders/{order.order_number}",
            email_context={'order': order},
        )

    @classmethod
    def notify_order_started(cls, order):
        """Notify client that order has started."""
        cls.send(
            user=order.client,
            notification_type=NotificationType.ORDER_STARTED,
            title=f"Order #{order.order_number} Started",
            message=f"The consultant has started working on your order.",
            title_ar=f"بدأ الطلب #{order.order_number}",
            message_ar=f"بدأ الاستشاري العمل على طلبك.",
            related_object_type='order',
            related_object_id=order.id,
            action_url=f"/orders/{order.order_number}",
            email_context={'order': order},
        )

    @classmethod
    def notify_order_delivered(cls, order):
        """Notify client that order has been delivered."""
        cls.send(
            user=order.client,
            notification_type=NotificationType.ORDER_DELIVERED,
            title=f"Order #{order.order_number} Delivered",
            message=f"Your order has been delivered. Please review the work.",
            title_ar=f"تم تسليم الطلب #{order.order_number}",
            message_ar=f"تم تسليم طلبك. يرجى مراجعة العمل.",
            related_object_type='order',
            related_object_id=order.id,
            action_url=f"/orders/{order.order_number}",
            email_context={'order': order},
        )

    @classmethod
    def notify_order_completed(cls, order):
        """Notify both parties that order is completed."""
        # Notify consultant
        cls.send(
            user=order.consultant,
            notification_type=NotificationType.ORDER_COMPLETED,
            title=f"Order #{order.order_number} Completed",
            message=f"The order has been completed. Payment will be released.",
            title_ar=f"اكتمل الطلب #{order.order_number}",
            message_ar=f"اكتمل الطلب. سيتم تحويل الدفعة.",
            related_object_type='order',
            related_object_id=order.id,
            action_url=f"/orders/{order.order_number}",
            email_context={'order': order},
        )

    @classmethod
    def notify_proposal_received(cls, proposal):
        """Notify client about new proposal."""
        cls.send(
            user=proposal.project.client,
            notification_type=NotificationType.PROPOSAL_RECEIVED,
            title="New Proposal Received",
            message=f"You received a new proposal from {proposal.consultant.full_name}",
            title_ar="عرض جديد",
            message_ar=f"لديك عرض جديد من {proposal.consultant.full_name}",
            related_object_type='proposal',
            related_object_id=proposal.id,
            action_url=f"/projects/{proposal.project.id}/proposals",
            email_context={'proposal': proposal},
        )

    @classmethod
    def notify_proposal_accepted(cls, proposal):
        """Notify consultant that proposal was accepted."""
        cls.send(
            user=proposal.consultant,
            notification_type=NotificationType.PROPOSAL_ACCEPTED,
            title="Proposal Accepted!",
            message=f"Your proposal for '{proposal.project.title}' has been accepted!",
            title_ar="تم قبول عرضك!",
            message_ar=f"تم قبول عرضك للمشروع '{proposal.project.title}'!",
            related_object_type='proposal',
            related_object_id=proposal.id,
            action_url=f"/orders",
            email_context={'proposal': proposal},
        )

    @classmethod
    def notify_dispute_opened(cls, dispute):
        """Notify other party about dispute."""
        cls.send(
            user=dispute.other_party,
            notification_type=NotificationType.DISPUTE_OPENED,
            title=f"Dispute Opened #{dispute.dispute_number}",
            message=f"A dispute has been opened for order #{dispute.order.order_number}",
            title_ar=f"تم فتح نزاع #{dispute.dispute_number}",
            message_ar=f"تم فتح نزاع للطلب #{dispute.order.order_number}",
            related_object_type='dispute',
            related_object_id=dispute.id,
            action_url=f"/disputes/{dispute.dispute_number}",
            email_context={'dispute': dispute},
        )

    @classmethod
    def notify_dispute_response_needed(cls, dispute, user):
        """Notify user that response is needed for dispute."""
        cls.send(
            user=user,
            notification_type=NotificationType.DISPUTE_RESPONSE_NEEDED,
            title=f"Response Needed for Dispute #{dispute.dispute_number}",
            message=f"Please respond to the dispute within the deadline.",
            title_ar=f"مطلوب رد للنزاع #{dispute.dispute_number}",
            message_ar=f"يرجى الرد على النزاع ضمن الموعد المحدد.",
            related_object_type='dispute',
            related_object_id=dispute.id,
            action_url=f"/disputes/{dispute.dispute_number}",
            email_context={'dispute': dispute},
        )

    @classmethod
    def notify_dispute_resolved(cls, dispute):
        """Notify both parties that dispute is resolved."""
        for user in [dispute.client, dispute.consultant]:
            cls.send(
                user=user,
                notification_type=NotificationType.DISPUTE_RESOLVED,
                title=f"Dispute #{dispute.dispute_number} Resolved",
                message=f"The dispute has been resolved: {dispute.get_resolution_type_display()}",
                title_ar=f"تم حل النزاع #{dispute.dispute_number}",
                message_ar=f"تم حل النزاع: {dispute.get_resolution_type_display()}",
                related_object_type='dispute',
                related_object_id=dispute.id,
                action_url=f"/disputes/{dispute.dispute_number}",
                email_context={'dispute': dispute},
            )

    @classmethod
    def notify_payment_released(cls, user, amount, order):
        """Notify consultant about payment release."""
        cls.send(
            user=user,
            notification_type=NotificationType.PAYMENT_RELEASED,
            title="Payment Released",
            message=f"SAR {amount} has been released to your wallet.",
            title_ar="تم تحويل الدفعة",
            message_ar=f"تم تحويل {amount} ريال إلى محفظتك.",
            related_object_type='order',
            related_object_id=order.id,
            action_url="/payments/transactions",
            email_context={'amount': amount, 'order': order},
        )

    @classmethod
    def notify_new_message(cls, recipient, sender, conversation):
        """Notify user about new message."""
        cls.send(
            user=recipient,
            notification_type=NotificationType.NEW_MESSAGE,
            title=f"New Message from {sender.full_name}",
            message=f"You have a new message.",
            title_ar=f"رسالة جديدة من {sender.full_name}",
            message_ar=f"لديك رسالة جديدة.",
            related_object_type='conversation',
            related_object_id=conversation.id,
            action_url=f"/messages/{conversation.id}",
        )

    @classmethod
    def notify_new_review(cls, review):
        """Notify consultant about new review."""
        cls.send(
            user=review.reviewee,
            notification_type=NotificationType.NEW_REVIEW,
            title="New Review Received",
            message=f"You received a {review.rating}-star review from {review.reviewer.full_name}",
            title_ar="تقييم جديد",
            message_ar=f"حصلت على تقييم {review.rating} نجوم من {review.reviewer.full_name}",
            related_object_type='review',
            related_object_id=review.id,
            action_url="/reviews/received",
            email_context={'review': review},
        )
