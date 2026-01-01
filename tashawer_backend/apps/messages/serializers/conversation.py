from rest_framework import serializers
from django.db.models import Q
from apps.messages.models import Conversation, Message
from apps.projects.models import Project
from apps.proposals.models import Proposal


class ParticipantSerializer(serializers.Serializer):
    """Minimal user info for conversation display"""
    id = serializers.UUIDField()
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField()
    role = serializers.CharField()

    def get_full_name(self, obj):
        return obj.get_full_name()


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for messages"""

    sender = ParticipantSerializer(read_only=True)
    is_own_message = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id',
            'sender',
            'content',
            'is_read',
            'read_at',
            'is_own_message',
            'created_at',
        ]
        read_only_fields = fields

    def get_is_own_message(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.sender_id == request.user.id
        return False


class ConversationListSerializer(serializers.ModelSerializer):
    """Serializer for conversation listing"""

    other_participants = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    project_title = serializers.SerializerMethodField()
    proposal_id = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id',
            'other_participants',
            'subject',
            'project_title',
            'proposal_id',
            'last_message',
            'unread_count',
            'last_message_at',
            'created_at',
        ]
        read_only_fields = fields

    def get_other_participants(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            others = obj.get_other_participants(request.user)
            return ParticipantSerializer(others, many=True).data
        return []

    def get_last_message(self, obj):
        last_msg = obj.get_last_message()
        if last_msg:
            return {
                'content': last_msg.content[:100] + '...' if len(last_msg.content) > 100 else last_msg.content,
                'sender_name': last_msg.sender.get_full_name(),
                'created_at': last_msg.created_at,
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_unread_count(request.user)
        return 0

    def get_project_title(self, obj):
        if obj.project:
            return obj.project.title
        return None

    def get_proposal_id(self, obj):
        if obj.proposal:
            return str(obj.proposal.id)
        return None


class ConversationDetailSerializer(serializers.ModelSerializer):
    """Serializer for full conversation details"""

    participants = ParticipantSerializer(many=True, read_only=True)
    other_participants = serializers.SerializerMethodField()
    project_info = serializers.SerializerMethodField()
    proposal_info = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id',
            'participants',
            'other_participants',
            'subject',
            'project_info',
            'proposal_info',
            'unread_count',
            'last_message_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_other_participants(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            others = obj.get_other_participants(request.user)
            return ParticipantSerializer(others, many=True).data
        return []

    def get_project_info(self, obj):
        if obj.project:
            return {
                'id': str(obj.project.id),
                'title': obj.project.title,
                'status': obj.project.status,
            }
        return None

    def get_proposal_info(self, obj):
        if obj.proposal:
            return {
                'id': str(obj.proposal.id),
                'project_title': obj.proposal.project.title,
                'status': obj.proposal.status,
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_unread_count(request.user)
        return 0


class ConversationCreateSerializer(serializers.Serializer):
    """Serializer for creating a new conversation"""

    recipient_id = serializers.UUIDField()
    project_id = serializers.UUIDField(required=False, allow_null=True)
    proposal_id = serializers.UUIDField(required=False, allow_null=True)
    subject = serializers.CharField(max_length=255, required=False, allow_blank=True)
    message = serializers.CharField(max_length=5000)

    def validate_recipient_id(self, value):
        from apps.accounts.models import User
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Recipient not found")
        return value

    def validate_project_id(self, value):
        if value:
            try:
                Project.objects.get(id=value)
            except Project.DoesNotExist:
                raise serializers.ValidationError("Project not found")
        return value

    def validate_proposal_id(self, value):
        if value:
            try:
                Proposal.objects.get(id=value)
            except Proposal.DoesNotExist:
                raise serializers.ValidationError("Proposal not found")
        return value

    def validate(self, data):
        request = self.context.get('request')
        recipient_id = data.get('recipient_id')

        # Can't message yourself
        if str(recipient_id) == str(request.user.id):
            raise serializers.ValidationError({
                'recipient_id': 'You cannot start a conversation with yourself'
            })

        return data

    def create(self, validated_data):
        from apps.accounts.models import User
        request = self.context.get('request')

        recipient_id = validated_data.pop('recipient_id')
        project_id = validated_data.pop('project_id', None)
        proposal_id = validated_data.pop('proposal_id', None)
        subject = validated_data.pop('subject', '')
        message_content = validated_data.pop('message')

        recipient = User.objects.get(id=recipient_id)
        project = Project.objects.get(id=project_id) if project_id else None
        proposal = Proposal.objects.get(id=proposal_id) if proposal_id else None

        # Check if conversation already exists between these users for this project/proposal
        existing = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=recipient
        )

        if project:
            existing = existing.filter(project=project)
        elif proposal:
            existing = existing.filter(proposal=proposal)
        else:
            existing = existing.filter(project__isnull=True, proposal__isnull=True)

        if existing.exists():
            conversation = existing.first()
        else:
            # Create new conversation
            conversation = Conversation.objects.create(
                project=project,
                proposal=proposal,
                subject=subject if subject else None,
            )
            conversation.participants.add(request.user, recipient)

        # Add the initial message
        Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=message_content,
        )

        return conversation


class MessageCreateSerializer(serializers.Serializer):
    """Serializer for sending a message"""

    content = serializers.CharField(max_length=5000)

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Message content cannot be empty")
        return value
