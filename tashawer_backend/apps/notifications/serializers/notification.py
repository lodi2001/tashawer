"""
Notification serializers.
"""

from rest_framework import serializers
from apps.notifications.models import Notification, NotificationPreference, DeviceToken


class NotificationSerializer(serializers.ModelSerializer):
    """Full notification serializer."""
    type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'type_display',
            'category',
            'category_display',
            'title',
            'title_ar',
            'message',
            'message_ar',
            'related_object_type',
            'related_object_id',
            'action_url',
            'is_read',
            'read_at',
            'metadata',
            'created_at',
        ]
        read_only_fields = fields


class NotificationListSerializer(serializers.ModelSerializer):
    """Lightweight notification serializer for list view."""

    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'category',
            'title',
            'title_ar',
            'message',
            'message_ar',
            'action_url',
            'is_read',
            'created_at',
        ]
        read_only_fields = fields


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences."""

    class Meta:
        model = NotificationPreference
        fields = [
            'email_orders',
            'email_proposals',
            'email_payments',
            'email_messages',
            'email_disputes',
            'email_reviews',
            'email_system',
            'push_orders',
            'push_proposals',
            'push_payments',
            'push_messages',
            'push_disputes',
            'push_reviews',
            'push_system',
            'sms_payments',
            'sms_disputes',
            'sms_system',
            'preferred_language',
        ]

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class DeviceTokenSerializer(serializers.ModelSerializer):
    """Serializer for device tokens."""

    class Meta:
        model = DeviceToken
        fields = [
            'id',
            'token',
            'device_type',
            'device_name',
            'device_info',
            'is_active',
            'last_used_at',
            'created_at',
        ]
        read_only_fields = ['id', 'is_active', 'last_used_at', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        token = validated_data['token']

        # Update or create the device token
        device_token, created = DeviceToken.objects.update_or_create(
            token=token,
            defaults={
                'user': user,
                'device_type': validated_data.get('device_type', 'web'),
                'device_name': validated_data.get('device_name', ''),
                'device_info': validated_data.get('device_info', {}),
                'is_active': True,
            }
        )
        return device_token
