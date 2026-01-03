import api from './api';
import type {
  ApiResponse,
  ConversationListItem,
  ConversationDetail,
  ConversationCreateData,
  ConversationListResponse,
  Message,
  MessagesListResponse,
  UnreadCountResponse,
} from '@/types';

// Get unread message count
export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get<ApiResponse<{ total_unread: number; conversations: Array<{ conversation_id: string; unread_count: number }> }>>('/messages/unread-count/');
  if (response.data.success && response.data.data) {
    return response.data.data.total_unread;
  }
  return 0;
};

// Get conversations list
export const getConversations = async (
  page = 1,
  pageSize = 20
): Promise<ConversationListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  const response = await api.get<ApiResponse<ConversationListResponse>>(
    `/messages/conversations/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch conversations');
};

// Get conversation detail
export const getConversation = async (id: string): Promise<ConversationDetail> => {
  const response = await api.get<ApiResponse<ConversationDetail>>(
    `/messages/conversations/${id}/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch conversation');
};

// Start new conversation
export const startConversation = async (
  data: ConversationCreateData
): Promise<ConversationDetail> => {
  const response = await api.post<ApiResponse<ConversationDetail>>(
    '/messages/conversations/start/',
    data
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to start conversation');
};

// Get messages in a conversation
export const getMessages = async (
  conversationId: string,
  page = 1,
  pageSize = 50
): Promise<MessagesListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  const response = await api.get<ApiResponse<MessagesListResponse>>(
    `/messages/conversations/${conversationId}/messages/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch messages');
};

// Send message
export const sendMessage = async (
  conversationId: string,
  content: string
): Promise<Message> => {
  const response = await api.post<ApiResponse<Message>>(
    `/messages/conversations/${conversationId}/messages/`,
    { content }
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to send message');
};

// Mark conversation as read
export const markConversationRead = async (conversationId: string): Promise<void> => {
  const response = await api.post<ApiResponse<null>>(
    `/messages/conversations/${conversationId}/mark-read/`
  );
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to mark as read');
  }
};
