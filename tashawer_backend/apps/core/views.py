"""
Admin views for platform settings.
"""

import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PlatformSettings

logger = logging.getLogger(__name__)


class PlatformSettingsView(APIView):
    """
    View and update platform settings (admin only).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        """Get current platform settings."""
        settings_obj = PlatformSettings.get_settings()

        # Don't return the actual API keys, just whether they're set
        return Response({
            'success': True,
            'data': {
                'ai_settings': {
                    'anthropic_api_key_set': bool(settings_obj.get_anthropic_api_key()),
                    'ai_enabled': settings_obj.ai_enabled,
                    'ai_daily_limit_per_user': settings_obj.ai_daily_limit_per_user,
                    'ai_monthly_limit_per_user': settings_obj.ai_monthly_limit_per_user,
                },
                'payment_settings': {
                    'tap_secret_key_set': bool(settings_obj.get_tap_secret_key()),
                    'tap_public_key': settings_obj.tap_public_key,
                },
                'platform_settings': {
                    'platform_fee_percentage': float(settings_obj.platform_fee_percentage),
                    'maintenance_mode': settings_obj.maintenance_mode,
                    'maintenance_message': settings_obj.maintenance_message,
                },
                'updated_at': settings_obj.updated_at,
            }
        }, status=status.HTTP_200_OK)

    def patch(self, request):
        """Update platform settings."""
        settings_obj = PlatformSettings.get_settings()
        data = request.data

        # AI Settings
        if 'anthropic_api_key' in data:
            api_key = data['anthropic_api_key']
            if api_key:  # Only update if not empty
                settings_obj.set_anthropic_api_key(api_key)
            elif api_key == '':  # Explicitly clear if empty string
                settings_obj.set_anthropic_api_key('')

        if 'ai_enabled' in data:
            settings_obj.ai_enabled = bool(data['ai_enabled'])

        if 'ai_daily_limit_per_user' in data:
            limit = int(data['ai_daily_limit_per_user'])
            if limit > 0:
                settings_obj.ai_daily_limit_per_user = limit

        if 'ai_monthly_limit_per_user' in data:
            limit = int(data['ai_monthly_limit_per_user'])
            if limit > 0:
                settings_obj.ai_monthly_limit_per_user = limit

        # Payment Settings
        if 'tap_secret_key' in data:
            secret_key = data['tap_secret_key']
            if secret_key:
                settings_obj.set_tap_secret_key(secret_key)
            elif secret_key == '':
                settings_obj.set_tap_secret_key('')

        if 'tap_public_key' in data:
            settings_obj.tap_public_key = data['tap_public_key']

        # Platform Settings
        if 'platform_fee_percentage' in data:
            fee = float(data['platform_fee_percentage'])
            if 0 <= fee <= 100:
                settings_obj.platform_fee_percentage = fee

        if 'maintenance_mode' in data:
            settings_obj.maintenance_mode = bool(data['maintenance_mode'])

        if 'maintenance_message' in data:
            settings_obj.maintenance_message = data['maintenance_message']

        settings_obj.save()

        logger.info(f"Platform settings updated by admin {request.user.email}")

        return Response({
            'success': True,
            'message': 'Settings updated successfully',
            'data': {
                'ai_settings': {
                    'anthropic_api_key_set': bool(settings_obj.get_anthropic_api_key()),
                    'ai_enabled': settings_obj.ai_enabled,
                    'ai_daily_limit_per_user': settings_obj.ai_daily_limit_per_user,
                    'ai_monthly_limit_per_user': settings_obj.ai_monthly_limit_per_user,
                },
                'payment_settings': {
                    'tap_secret_key_set': bool(settings_obj.get_tap_secret_key()),
                    'tap_public_key': settings_obj.tap_public_key,
                },
                'platform_settings': {
                    'platform_fee_percentage': float(settings_obj.platform_fee_percentage),
                    'maintenance_mode': settings_obj.maintenance_mode,
                    'maintenance_message': settings_obj.maintenance_message,
                },
                'updated_at': settings_obj.updated_at,
            }
        }, status=status.HTTP_200_OK)


class TestAIConnectionView(APIView):
    """
    Test the AI (Claude) API connection.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        """Test the Claude API connection."""
        from apps.ai.services.claude import ClaudeService

        service = ClaudeService()

        if not service.is_available():
            return Response({
                'success': False,
                'message': 'AI service is not available. Please check your API key.',
                'connected': False,
            }, status=status.HTTP_200_OK)

        # Try a simple test call
        try:
            result = service.generate(
                prompt="Say 'Hello' in Arabic.",
                max_tokens=50,
            )

            if result['success']:
                return Response({
                    'success': True,
                    'message': 'Successfully connected to Claude AI',
                    'connected': True,
                    'test_response': result['content'][:100] if result['content'] else '',
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'message': result.get('error', 'Failed to connect'),
                    'connected': False,
                }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"AI connection test failed: {e}")
            return Response({
                'success': False,
                'message': str(e),
                'connected': False,
            }, status=status.HTTP_200_OK)
