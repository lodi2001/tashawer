from django.urls import path
from .views import (
    ConversationListView,
    ConversationCreateView,
    ConversationDetailView,
    ConversationMessagesView,
    MarkConversationReadView,
    UnreadCountView,
)

app_name = 'messaging'

urlpatterns = [
    # Unread count
    path('unread-count/', UnreadCountView.as_view(), name='unread-count'),

    # Conversations
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('conversations/start/', ConversationCreateView.as_view(), name='conversation-create'),
    path('conversations/<uuid:pk>/', ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<uuid:pk>/messages/', ConversationMessagesView.as_view(), name='conversation-messages'),
    path('conversations/<uuid:pk>/mark-read/', MarkConversationReadView.as_view(), name='mark-read'),
]
