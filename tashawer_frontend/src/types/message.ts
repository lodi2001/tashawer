// Participant info
export interface Participant {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

// Message types
export interface Message {
  id: string;
  sender: Participant;
  content: string;
  is_read: boolean;
  read_at: string | null;
  is_own_message: boolean;
  created_at: string;
}

// Last message preview
export interface LastMessagePreview {
  content: string;
  sender_name: string;
  created_at: string;
}

// Conversation list item
export interface ConversationListItem {
  id: string;
  other_participants: Participant[];
  subject: string | null;
  project_title: string | null;
  proposal_id: string | null;
  last_message: LastMessagePreview | null;
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
}

// Conversation detail
export interface ConversationDetail {
  id: string;
  participants: Participant[];
  other_participants: Participant[];
  subject: string | null;
  project_info: {
    id: string;
    title: string;
    status: string;
  } | null;
  proposal_info: {
    id: string;
    project_title: string;
    status: string;
  } | null;
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

// Create conversation request
export interface ConversationCreateData {
  recipient_id: string;
  project_id?: string;
  proposal_id?: string;
  subject?: string;
  message: string;
}

// Send message request
export interface MessageCreateData {
  content: string;
}

// Conversation list response
export interface ConversationListResponse {
  conversations: ConversationListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

// Messages list response
export interface MessagesListResponse {
  messages: Message[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

// Unread count response
export interface UnreadCountResponse {
  unread_count: number;
}
