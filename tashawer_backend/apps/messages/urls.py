from django.urls import path
from .views import (
    ConversationListView,
    ConversationCreateView,
    ConversationDetailView,
    ConversationMessagesView,
    MarkConversationReadView,
    UnreadCountView,
)
from .views.admin import (
    AdminConversationListView,
    AdminConversationDetailView,
    AdminConversationMessagesView,
    AdminConversationExportView,
    AdminMessageSearchView,
    AdminMessagingStatsView,
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

    # Admin routes
    path('admin/conversations/', AdminConversationListView.as_view(), name='admin-conversation-list'),
    path('admin/conversations/<uuid:pk>/', AdminConversationDetailView.as_view(), name='admin-conversation-detail'),
    path('admin/conversations/<uuid:pk>/messages/', AdminConversationMessagesView.as_view(), name='admin-conversation-messages'),
    path('admin/conversations/<uuid:pk>/export/', AdminConversationExportView.as_view(), name='admin-conversation-export'),
    path('admin/search/', AdminMessageSearchView.as_view(), name='admin-message-search'),
    path('admin/stats/', AdminMessagingStatsView.as_view(), name='admin-messaging-stats'),
]
