"""
Firebase Cloud Messaging service for push notifications.
"""

import logging
from typing import Optional, Dict, List
from django.conf import settings

logger = logging.getLogger(__name__)

# Firebase Admin SDK - initialize lazily
_firebase_app = None


def _get_firebase_app():
    """Initialize Firebase Admin SDK lazily."""
    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    try:
        import firebase_admin
        from firebase_admin import credentials

        # Check if already initialized
        try:
            _firebase_app = firebase_admin.get_app()
            return _firebase_app
        except ValueError:
            pass

        # Get credentials path from settings
        cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)

        if not cred_path:
            logger.warning(
                'FIREBASE_CREDENTIALS_PATH not configured. '
                'Push notifications will not work.'
            )
            return None

        cred = credentials.Certificate(cred_path)
        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info('Firebase Admin SDK initialized successfully')
        return _firebase_app

    except ImportError:
        logger.error(
            'firebase-admin package not installed. '
            'Run: pip install firebase-admin'
        )
        return None
    except Exception as e:
        logger.error(f'Failed to initialize Firebase: {e}')
        return None


class FirebaseService:
    """
    Firebase Cloud Messaging service for sending push notifications.
    """

    @classmethod
    def send_to_device(
        cls,
        token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None,
        image: Optional[str] = None,
    ) -> bool:
        """
        Send push notification to a single device.

        Args:
            token: FCM device token
            title: Notification title
            body: Notification body
            data: Optional data payload
            image: Optional image URL

        Returns:
            True if sent successfully, False otherwise
        """
        app = _get_firebase_app()
        if not app:
            logger.warning('Firebase not configured, skipping push notification')
            return False

        try:
            from firebase_admin import messaging

            # Build the notification
            notification = messaging.Notification(
                title=title,
                body=body,
                image=image,
            )

            # Build the message
            message = messaging.Message(
                notification=notification,
                data=data or {},
                token=token,
                # Android specific config
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        icon='notification_icon',
                        color='#1560BD',  # Tashawer brand blue
                        click_action='FLUTTER_NOTIFICATION_CLICK',
                    ),
                ),
                # Web push config
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        icon='/images/Tashawer_Logo_Final.png',
                    ),
                    fcm_options=messaging.WebpushFCMOptions(
                        link=data.get('action_url', '/notifications') if data else '/notifications',
                    ),
                ),
                # iOS/APNs config
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            alert=messaging.ApsAlert(
                                title=title,
                                body=body,
                            ),
                            badge=1,
                            sound='default',
                        ),
                    ),
                ),
            )

            # Send the message
            response = messaging.send(message)
            logger.info(f'Push notification sent: {response}')
            return True

        except Exception as e:
            logger.error(f'Failed to send push notification: {e}')
            return False

    @classmethod
    def send_to_multiple(
        cls,
        tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None,
        image: Optional[str] = None,
    ) -> Dict[str, int]:
        """
        Send push notification to multiple devices.

        Args:
            tokens: List of FCM device tokens
            title: Notification title
            body: Notification body
            data: Optional data payload
            image: Optional image URL

        Returns:
            Dict with success and failure counts
        """
        app = _get_firebase_app()
        if not app:
            logger.warning('Firebase not configured, skipping push notification')
            return {'success': 0, 'failure': len(tokens)}

        if not tokens:
            return {'success': 0, 'failure': 0}

        try:
            from firebase_admin import messaging

            # Build the notification
            notification = messaging.Notification(
                title=title,
                body=body,
                image=image,
            )

            # Build the multicast message
            message = messaging.MulticastMessage(
                notification=notification,
                data=data or {},
                tokens=tokens,
                android=messaging.AndroidConfig(
                    priority='high',
                ),
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        icon='/images/Tashawer_Logo_Final.png',
                    ),
                ),
            )

            # Send to all devices
            response = messaging.send_multicast(message)
            logger.info(
                f'Multicast sent: {response.success_count} success, '
                f'{response.failure_count} failure'
            )

            # Handle failed tokens (they should be removed)
            if response.failure_count > 0:
                failed_tokens = []
                for idx, result in enumerate(response.responses):
                    if not result.success:
                        failed_tokens.append(tokens[idx])
                        logger.warning(
                            f'Failed token: {tokens[idx][:20]}... - '
                            f'{result.exception}'
                        )
                # Mark failed tokens as inactive
                cls._deactivate_tokens(failed_tokens)

            return {
                'success': response.success_count,
                'failure': response.failure_count,
            }

        except Exception as e:
            logger.error(f'Failed to send multicast push notification: {e}')
            return {'success': 0, 'failure': len(tokens)}

    @classmethod
    def _deactivate_tokens(cls, tokens: List[str]) -> None:
        """Mark tokens as inactive in the database."""
        from apps.notifications.models import DeviceToken

        DeviceToken.objects.filter(token__in=tokens).update(is_active=False)
        logger.info(f'Deactivated {len(tokens)} failed device tokens')

    @classmethod
    def send_to_user(
        cls,
        user,
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None,
        image: Optional[str] = None,
    ) -> Dict[str, int]:
        """
        Send push notification to all devices of a user.

        Args:
            user: User instance
            title: Notification title
            body: Notification body
            data: Optional data payload
            image: Optional image URL

        Returns:
            Dict with success and failure counts
        """
        from apps.notifications.models import DeviceToken

        # Get all active tokens for the user
        tokens = list(
            DeviceToken.objects.filter(
                user=user,
                is_active=True
            ).values_list('token', flat=True)
        )

        if not tokens:
            logger.debug(f'No active device tokens for user {user.email}')
            return {'success': 0, 'failure': 0}

        return cls.send_to_multiple(
            tokens=tokens,
            title=title,
            body=body,
            data=data,
            image=image,
        )
