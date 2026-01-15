import api from './api';

// ============ Types ============

export interface AdminParticipant {
  id: string;
  full_name: string;
  email: string;
  role: string;
  mobile?: string;
  registration_no?: string;
}

export interface AdminMessage {
  id: string;
  sender: AdminParticipant;
  sender_role: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  is_admin_message: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectInfo {
  id: string;
  title: string;
  status: string;
  client_name?: string;
  client_email?: string;
  budget_min?: string;
  budget_max?: string;
}

export interface ProposalInfo {
  id: string;
  project_id?: string;
  project_title?: string;
  consultant_name?: string;
  consultant_email?: string;
  proposed_amount?: string;
  status: string;
}

export interface LastMessage {
  id: string;
  content: string;
  sender_name: string;
  sender_role: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminConversation {
  id: string;
  participants: AdminParticipant[];
  participant_names: string[];
  participant_roles: string[];
  subject?: string;
  project_info?: ProjectInfo;
  proposal_info?: ProposalInfo;
  message_count: number;
  last_message?: LastMessage;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminConversationDetail extends AdminConversation {
  messages: AdminMessage[];
  statistics: {
    total_messages: number;
    messages_by_participant: Record<string, {
      name: string;
      role: string;
      message_count: number;
    }>;
    first_message_at: string | null;
    last_message_at: string | null;
  };
}

export interface MessagingStats {
  overview: {
    total_conversations: number;
    total_messages: number;
    active_conversations_today: number;
    messages_today: number;
    messages_this_week: number;
    messages_this_month: number;
  };
  by_role: {
    client_messages: number;
    consultant_messages: number;
    admin_messages: number;
  };
  recent_activity: Array<{
    date: string;
    count: number;
  }>;
}

export interface SearchResult {
  id: string;
  conversation_id: string;
  conversation_subject?: string;
  sender_name: string;
  sender_email: string;
  sender_role: string;
  content: string;
  content_preview: string;
  is_read: boolean;
  created_at: string;
  project_title?: string;
}

export interface PaginationInfo {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

export interface ConversationListResponse {
  conversations: AdminConversation[];
  pagination: PaginationInfo;
  statistics: {
    total_conversations: number;
    active_today: number;
    total_messages: number;
  };
}

// ============ Admin Messages APIs ============

/**
 * Get all conversations (admin only)
 */
export async function getAdminConversations(params?: {
  page?: number;
  page_size?: number;
  user_id?: string;
  project_id?: string;
  proposal_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  has_messages?: boolean;
  sort?: string;
}): Promise<ConversationListResponse> {
  const response = await api.get<{ success: boolean; data: ConversationListResponse }>(
    '/messages/admin/conversations/',
    { params }
  );
  return response.data.data;
}

/**
 * Get conversation details (admin only)
 */
export async function getAdminConversationDetail(id: string): Promise<AdminConversationDetail> {
  const response = await api.get<{ success: boolean; data: AdminConversationDetail }>(
    `/messages/admin/conversations/${id}/`
  );
  return response.data.data;
}

/**
 * Get paginated messages for a conversation (admin only)
 */
export async function getAdminConversationMessages(
  id: string,
  params?: { page?: number; page_size?: number }
): Promise<{ messages: AdminMessage[]; pagination: PaginationInfo }> {
  const response = await api.get<{ success: boolean; data: { messages: AdminMessage[]; pagination: PaginationInfo } }>(
    `/messages/admin/conversations/${id}/messages/`,
    { params }
  );
  return response.data.data;
}

/**
 * Send an admin intervention message
 */
export async function sendAdminMessage(
  conversationId: string,
  data: { content: string; is_system_message?: boolean }
): Promise<AdminMessage> {
  const response = await api.post<{ success: boolean; data: AdminMessage }>(
    `/messages/admin/conversations/${conversationId}/messages/`,
    data
  );
  return response.data.data;
}

/**
 * Export conversation to PDF or CSV
 */
export function getExportUrl(conversationId: string, format: 'pdf' | 'csv'): string {
  return `${api.defaults.baseURL}/messages/admin/conversations/${conversationId}/export/?format=${format}`;
}

/**
 * Search across all messages (admin only)
 */
export async function searchMessages(params: {
  q: string;
  page?: number;
  page_size?: number;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}): Promise<{ query: string; results: SearchResult[]; pagination: PaginationInfo }> {
  const response = await api.get<{ success: boolean; data: { query: string; results: SearchResult[]; pagination: PaginationInfo } }>(
    '/messages/admin/search/',
    { params }
  );
  return response.data.data;
}

/**
 * Get messaging statistics (admin only)
 */
export async function getMessagingStats(): Promise<MessagingStats> {
  const response = await api.get<{ success: boolean; data: MessagingStats }>(
    '/messages/admin/stats/'
  );
  return response.data.data;
}
