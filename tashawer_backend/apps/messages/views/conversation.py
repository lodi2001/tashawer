import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count, Q

from apps.messages.models import Conversation, Message, MessageAttachment
from apps.messages.serializers import (
    ConversationListSerializer,
    ConversationDetailSerializer,
    ConversationCreateSerializer,
    MessageSerializer,
    MessageCreateSerializer,
)

logger = logging.getLogger(__name__)


class ConversationListView(APIView):
    """
    List all conversations for the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get list of user's conversations.

        Query parameters:
        - page: page number (default: 1)
        - page_size: items per page (default: 20, max: 50)
        """
        conversations = Conversation.objects.filter(
            participants=request.user
        ).order_by('-last_message_at', '-created_at')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 20)), 50)
        start = (page - 1) * page_size
        end = start + page_size

        total_count = conversations.count()
        conversations = conversations[start:end]

        serializer = ConversationListSerializer(
            conversations,
            many=True,
            context={'request': request}
        )

        return Response({
            'success': True,
            'data': {
                'conversations': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                }
            }
        }, status=status.HTTP_200_OK)


class ConversationCreateView(APIView):
    """
    Start a new conversation.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Start a new conversation with another user.

        Request body:
        - recipient_id: uuid (required)
        - project_id: uuid (optional)
        - proposal_id: uuid (optional)
        - subject: string (optional)
        - message: string (required)
        """
        serializer = ConversationCreateSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            conversation = serializer.save()
            logger.info(f"Conversation created/used: {conversation.id} by user {request.user.id}")

            detail_serializer = ConversationDetailSerializer(
                conversation,
                context={'request': request}
            )

            return Response({
                'success': True,
                'message': 'Conversation started successfully',
                'data': detail_serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'success': False,
            'message': 'Validation error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class ConversationDetailView(APIView):
    """
    Get conversation details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Get conversation details by ID."""
        conversation = get_object_or_404(
            Conversation.objects.filter(participants=request.user),
            pk=pk
        )

        serializer = ConversationDetailSerializer(
            conversation,
            context={'request': request}
        )

        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class ConversationMessagesView(APIView):
    """
    List messages in a conversation and send new messages.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """
        Get messages in a conversation.

        Query parameters:
        - page: page number (default: 1)
        - page_size: items per page (default: 50, max: 100)
        - mark_read: auto mark as read (default: true)
        """
        conversation = get_object_or_404(
            Conversation.objects.filter(participants=request.user),
            pk=pk
        )

        messages = conversation.messages.all().order_by('created_at')

        # Pagination (from newest, but return in chronological order)
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 50)), 100)

        total_count = messages.count()
        total_pages = (total_count + page_size - 1) // page_size

        # Calculate offset from the end for pagination
        # Page 1 = most recent messages
        start = max(0, total_count - (page * page_size))
        end = total_count - ((page - 1) * page_size)

        messages_page = messages[start:end]

        # Auto mark as read
        mark_read = request.query_params.get('mark_read', 'true').lower() == 'true'
        if mark_read:
            conversation.messages.filter(
                is_read=False
            ).exclude(
                sender=request.user
            ).update(
                is_read=True,
                read_at=timezone.now()
            )

        serializer = MessageSerializer(
            messages_page,
            many=True,
            context={'request': request}
        )

        return Response({
            'success': True,
            'data': {
                'messages': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': total_pages,
                }
            }
        }, status=status.HTTP_200_OK)

    def post(self, request, pk):
        """
        Send a message in the conversation.

        Request body:
        - content: string (required)
        - attachments: array (optional) - list of attachment objects with:
          - file_url: string (required)
          - original_filename: string (required)
          - file_size: integer (required)
          - file_type: string (required)
          - thumbnail_url: string (optional)
        """
        conversation = get_object_or_404(
            Conversation.objects.filter(participants=request.user),
            pk=pk
        )

        serializer = MessageCreateSerializer(data=request.data)

        if serializer.is_valid():
            message = Message.objects.create(
                conversation=conversation,
                sender=request.user,
                content=serializer.validated_data['content']
            )

            # Create attachments if provided
            attachments_data = serializer.validated_data.get('attachments', [])
            for attachment_data in attachments_data:
                MessageAttachment.objects.create(
                    message=message,
                    file_url=attachment_data['file_url'],
                    original_filename=attachment_data['original_filename'],
                    file_size=attachment_data['file_size'],
                    file_type=attachment_data['file_type'],
                    thumbnail_url=attachment_data.get('thumbnail_url'),
                )

            logger.info(f"Message sent: {message.id} in conversation {conversation.id} with {len(attachments_data)} attachments")

            message_serializer = MessageSerializer(
                message,
                context={'request': request}
            )

            return Response({
                'success': True,
                'message': 'Message sent successfully',
                'data': message_serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'success': False,
            'message': 'Validation error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class MarkConversationReadView(APIView):
    """
    Mark all messages in a conversation as read.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """Mark all unread messages as read."""
        conversation = get_object_or_404(
            Conversation.objects.filter(participants=request.user),
            pk=pk
        )

        updated_count = conversation.messages.filter(
            is_read=False
        ).exclude(
            sender=request.user
        ).update(
            is_read=True,
            read_at=timezone.now()
        )

        logger.info(f"Marked {updated_count} messages as read in conversation {conversation.id}")

        return Response({
            'success': True,
            'message': f'{updated_count} messages marked as read'
        }, status=status.HTTP_200_OK)


class UnreadCountView(APIView):
    """
    Get unread message count for the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get total unread count and per-conversation counts."""
        conversations = Conversation.objects.filter(
            participants=request.user
        )

        # Get unread counts per conversation
        conversation_counts = []
        total_unread = 0

        for conv in conversations:
            unread = conv.messages.filter(
                is_read=False
            ).exclude(
                sender=request.user
            ).count()

            if unread > 0:
                conversation_counts.append({
                    'conversation_id': str(conv.id),
                    'unread_count': unread
                })
                total_unread += unread

        return Response({
            'success': True,
            'data': {
                'total_unread': total_unread,
                'conversations': conversation_counts
            }
        }, status=status.HTTP_200_OK)
