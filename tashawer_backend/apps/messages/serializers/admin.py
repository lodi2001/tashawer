"""
Admin serializers for messaging system.
Provides full access to all conversations and messages for admin users.
"""

from rest_framework import serializers
from apps.messages.models import Conversation, Message


class AdminParticipantSerializer(serializers.Serializer):
    """Full user info for admin view"""
    id = serializers.UUIDField()
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField()
    role = serializers.CharField()
    mobile = serializers.CharField(source='mobile', allow_null=True)
    registration_no = serializers.CharField(allow_null=True)

    def get_full_name(self, obj):
        return obj.get_full_name()


class AdminMessageSerializer(serializers.ModelSerializer):
    """Full message details for admin"""

    sender = AdminParticipantSerializer(read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    is_admin_message = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id',
            'sender',
            'sender_role',
            'content',
            'is_read',
            'read_at',
            'is_admin_message',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_is_admin_message(self, obj):
        return obj.sender.role == 'admin'


class AdminConversationListSerializer(serializers.ModelSerializer):
    """Conversation list for admin with full details"""

    participants = AdminParticipantSerializer(many=True, read_only=True)
    participant_names = serializers.SerializerMethodField()
    participant_roles = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    project_info = serializers.SerializerMethodField()
    proposal_info = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id',
            'participants',
            'participant_names',
            'participant_roles',
            'subject',
            'project_info',
            'proposal_info',
            'message_count',
            'last_message',
            'last_message_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_participant_names(self, obj):
        return [p.get_full_name() for p in obj.participants.all()]

    def get_participant_roles(self, obj):
        return [p.role for p in obj.participants.all()]

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        last_msg = obj.get_last_message()
        if last_msg:
            return {
                'id': str(last_msg.id),
                'content': last_msg.content[:150] + '...' if len(last_msg.content) > 150 else last_msg.content,
                'sender_name': last_msg.sender.get_full_name(),
                'sender_role': last_msg.sender.role,
                'is_read': last_msg.is_read,
                'created_at': last_msg.created_at,
            }
        return None

    def get_project_info(self, obj):
        if obj.project:
            return {
                'id': str(obj.project.id),
                'title': obj.project.title,
                'status': obj.project.status,
                'client_name': obj.project.client.get_full_name() if obj.project.client else None,
            }
        return None

    def get_proposal_info(self, obj):
        if obj.proposal:
            return {
                'id': str(obj.proposal.id),
                'project_title': obj.proposal.project.title if obj.proposal.project else None,
                'consultant_name': obj.proposal.consultant.get_full_name() if obj.proposal.consultant else None,
                'status': obj.proposal.status,
            }
        return None


class AdminConversationDetailSerializer(serializers.ModelSerializer):
    """Full conversation details for admin with all messages"""

    participants = AdminParticipantSerializer(many=True, read_only=True)
    messages = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    project_info = serializers.SerializerMethodField()
    proposal_info = serializers.SerializerMethodField()
    statistics = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id',
            'participants',
            'subject',
            'project_info',
            'proposal_info',
            'messages',
            'message_count',
            'statistics',
            'last_message_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_messages(self, obj):
        messages = obj.messages.all().order_by('created_at')
        return AdminMessageSerializer(messages, many=True).data

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_project_info(self, obj):
        if obj.project:
            return {
                'id': str(obj.project.id),
                'title': obj.project.title,
                'status': obj.project.status,
                'budget_min': str(obj.project.budget_min) if obj.project.budget_min else None,
                'budget_max': str(obj.project.budget_max) if obj.project.budget_max else None,
                'client_name': obj.project.client.get_full_name() if obj.project.client else None,
                'client_email': obj.project.client.email if obj.project.client else None,
            }
        return None

    def get_proposal_info(self, obj):
        if obj.proposal:
            return {
                'id': str(obj.proposal.id),
                'project_id': str(obj.proposal.project.id) if obj.proposal.project else None,
                'project_title': obj.proposal.project.title if obj.proposal.project else None,
                'consultant_name': obj.proposal.consultant.get_full_name() if obj.proposal.consultant else None,
                'consultant_email': obj.proposal.consultant.email if obj.proposal.consultant else None,
                'proposed_amount': str(obj.proposal.proposed_amount),
                'status': obj.proposal.status,
            }
        return None

    def get_statistics(self, obj):
        messages = obj.messages.all()
        participants = obj.participants.all()

        stats = {
            'total_messages': messages.count(),
            'messages_by_participant': {},
            'first_message_at': None,
            'last_message_at': obj.last_message_at,
        }

        first_msg = messages.order_by('created_at').first()
        if first_msg:
            stats['first_message_at'] = first_msg.created_at

        for participant in participants:
            count = messages.filter(sender=participant).count()
            stats['messages_by_participant'][str(participant.id)] = {
                'name': participant.get_full_name(),
                'role': participant.role,
                'message_count': count,
            }

        return stats


class AdminMessageCreateSerializer(serializers.Serializer):
    """Serializer for admin to send intervention messages"""

    content = serializers.CharField(max_length=5000)
    is_system_message = serializers.BooleanField(default=False, required=False)

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Message content cannot be empty")
        return value


class AdminMessageSearchSerializer(serializers.Serializer):
    """Serializer for message search results"""

    id = serializers.UUIDField()
    conversation_id = serializers.UUIDField(source='conversation.id')
    conversation_subject = serializers.CharField(source='conversation.subject', allow_null=True)
    sender_name = serializers.SerializerMethodField()
    sender_email = serializers.EmailField(source='sender.email')
    sender_role = serializers.CharField(source='sender.role')
    content = serializers.CharField()
    content_preview = serializers.SerializerMethodField()
    is_read = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    project_title = serializers.SerializerMethodField()

    def get_sender_name(self, obj):
        return obj.sender.get_full_name()

    def get_content_preview(self, obj):
        return obj.content[:200] + '...' if len(obj.content) > 200 else obj.content

    def get_project_title(self, obj):
        if obj.conversation.project:
            return obj.conversation.project.title
        return None
