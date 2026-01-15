"""
Admin views for messaging system.
Provides full access to all conversations and messages for admin users.
"""

import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.http import HttpResponse

from apps.messages.models import Conversation, Message
from apps.messages.serializers.admin import (
    AdminConversationListSerializer,
    AdminConversationDetailSerializer,
    AdminMessageSerializer,
    AdminMessageCreateSerializer,
    AdminMessageSearchSerializer,
)

logger = logging.getLogger(__name__)


class AdminConversationListView(APIView):
    """
    List all conversations in the platform (admin only).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        """
        Get all conversations with filters.

        Query parameters:
        - page: page number (default: 1)
        - page_size: items per page (default: 20, max: 100)
        - user_id: filter by participant user ID
        - project_id: filter by project ID
        - proposal_id: filter by proposal ID
        - search: search in participant names/emails
        - date_from: filter by start date (ISO format)
        - date_to: filter by end date (ISO format)
        - has_messages: filter by whether has messages (true/false)
        - sort: sort field (-last_message_at, -created_at, -message_count)
        """
        queryset = Conversation.objects.all()

        # Annotate with message count for sorting
        queryset = queryset.annotate(message_count=Count('messages'))

        # Filter by user
        user_id = request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(participants__id=user_id)

        # Filter by project
        project_id = request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        # Filter by proposal
        proposal_id = request.query_params.get('proposal_id')
        if proposal_id:
            queryset = queryset.filter(proposal_id=proposal_id)

        # Search in participant names/emails
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(participants__email__icontains=search) |
                Q(participants__first_name__icontains=search) |
                Q(participants__last_name__icontains=search) |
                Q(subject__icontains=search)
            ).distinct()

        # Date filters
        date_from = request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)

        date_to = request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)

        # Filter by has messages
        has_messages = request.query_params.get('has_messages')
        if has_messages == 'true':
            queryset = queryset.filter(message_count__gt=0)
        elif has_messages == 'false':
            queryset = queryset.filter(message_count=0)

        # Sorting
        sort = request.query_params.get('sort', '-last_message_at')
        valid_sorts = ['-last_message_at', 'last_message_at', '-created_at', 'created_at', '-message_count', 'message_count']
        if sort in valid_sorts:
            queryset = queryset.order_by(sort, '-created_at')
        else:
            queryset = queryset.order_by('-last_message_at', '-created_at')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 20)), 100)
        start = (page - 1) * page_size
        end = start + page_size

        total_count = queryset.count()
        conversations = queryset[start:end]

        serializer = AdminConversationListSerializer(conversations, many=True)

        # Get statistics
        stats = {
            'total_conversations': Conversation.objects.count(),
            'active_today': Conversation.objects.filter(
                last_message_at__date=request.query_params.get('date', None) or
                Conversation.objects.order_by('-last_message_at').first().last_message_at.date() if Conversation.objects.exists() else None
            ).count() if Conversation.objects.exists() else 0,
            'total_messages': Message.objects.count(),
        }

        return Response({
            'success': True,
            'data': {
                'conversations': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                },
                'statistics': stats,
            }
        }, status=status.HTTP_200_OK)


class AdminConversationDetailView(APIView):
    """
    Get full conversation details with all messages (admin only).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        """Get full conversation details including all messages."""
        conversation = get_object_or_404(Conversation, pk=pk)

        serializer = AdminConversationDetailSerializer(conversation)

        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class AdminConversationMessagesView(APIView):
    """
    Get paginated messages for a conversation (admin only).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        """
        Get messages with pagination.

        Query parameters:
        - page: page number (default: 1)
        - page_size: items per page (default: 50, max: 200)
        """
        conversation = get_object_or_404(Conversation, pk=pk)

        messages = conversation.messages.all().order_by('created_at')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 50)), 200)

        total_count = messages.count()
        total_pages = (total_count + page_size - 1) // page_size

        start = (page - 1) * page_size
        end = start + page_size

        messages_page = messages[start:end]

        serializer = AdminMessageSerializer(messages_page, many=True)

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
        Send an admin intervention message.

        Request body:
        - content: string (required)
        - is_system_message: bool (optional, default: false)
        """
        conversation = get_object_or_404(Conversation, pk=pk)

        serializer = AdminMessageCreateSerializer(data=request.data)

        if serializer.is_valid():
            content = serializer.validated_data['content']
            is_system = serializer.validated_data.get('is_system_message', False)

            # Prefix system messages
            if is_system:
                content = f"[System Message] {content}"

            message = Message.objects.create(
                conversation=conversation,
                sender=request.user,
                content=content,
            )

            logger.info(f"Admin message sent: {message.id} in conversation {conversation.id} by {request.user.email}")

            return Response({
                'success': True,
                'message': 'Admin message sent successfully',
                'data': AdminMessageSerializer(message).data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'success': False,
            'message': 'Validation error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class AdminConversationExportView(APIView):
    """
    Export conversation to PDF or CSV (admin only).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        """
        Export conversation.

        Query parameters:
        - format: export format (pdf, csv) - default: pdf
        """
        from apps.messages.utils.export import export_conversation_pdf, export_conversation_csv

        conversation = get_object_or_404(Conversation, pk=pk)

        export_format = request.query_params.get('format', 'pdf').lower()

        if export_format == 'csv':
            return export_conversation_csv(conversation)
        else:
            return export_conversation_pdf(conversation)


class AdminMessageSearchView(APIView):
    """
    Search across all messages (admin only).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        """
        Search messages across all conversations.

        Query parameters:
        - q: search query (required)
        - page: page number (default: 1)
        - page_size: items per page (default: 20, max: 100)
        - user_id: filter by sender user ID
        - date_from: filter by start date
        - date_to: filter by end date
        """
        query = request.query_params.get('q', '').strip()

        if not query:
            return Response({
                'success': False,
                'message': 'Search query is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        messages = Message.objects.filter(
            content__icontains=query
        ).select_related('sender', 'conversation', 'conversation__project')

        # Filter by user
        user_id = request.query_params.get('user_id')
        if user_id:
            messages = messages.filter(sender_id=user_id)

        # Date filters
        date_from = request.query_params.get('date_from')
        if date_from:
            messages = messages.filter(created_at__gte=date_from)

        date_to = request.query_params.get('date_to')
        if date_to:
            messages = messages.filter(created_at__lte=date_to)

        messages = messages.order_by('-created_at')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 20)), 100)
        start = (page - 1) * page_size
        end = start + page_size

        total_count = messages.count()
        messages_page = messages[start:end]

        serializer = AdminMessageSearchSerializer(messages_page, many=True)

        return Response({
            'success': True,
            'data': {
                'query': query,
                'results': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                }
            }
        }, status=status.HTTP_200_OK)


class AdminMessagingStatsView(APIView):
    """
    Get messaging statistics (admin only).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        """Get overall messaging statistics."""
        from django.db.models.functions import TruncDate
        from django.utils import timezone
        from datetime import timedelta

        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        stats = {
            'overview': {
                'total_conversations': Conversation.objects.count(),
                'total_messages': Message.objects.count(),
                'active_conversations_today': Conversation.objects.filter(
                    last_message_at__date=today
                ).count(),
                'messages_today': Message.objects.filter(
                    created_at__date=today
                ).count(),
                'messages_this_week': Message.objects.filter(
                    created_at__date__gte=week_ago
                ).count(),
                'messages_this_month': Message.objects.filter(
                    created_at__date__gte=month_ago
                ).count(),
            },
            'by_role': {
                'client_messages': Message.objects.filter(sender__role='client').count(),
                'consultant_messages': Message.objects.filter(sender__role='consultant').count(),
                'admin_messages': Message.objects.filter(sender__role='admin').count(),
            },
            'recent_activity': list(
                Message.objects.filter(created_at__date__gte=week_ago)
                .annotate(date=TruncDate('created_at'))
                .values('date')
                .annotate(count=Count('id'))
                .order_by('date')
            ),
        }

        return Response({
            'success': True,
            'data': stats
        }, status=status.HTTP_200_OK)
