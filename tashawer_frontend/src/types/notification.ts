// Notification types

export type NotificationType =
  | 'order_created'
  | 'order_confirmed'
  | 'order_started'
  | 'order_delivered'
  | 'order_completed'
  | 'order_cancelled'
  | 'order_revision_requested'
  | 'milestone_submitted'
  | 'milestone_approved'
  | 'milestone_revision'
  | 'proposal_received'
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'project_invitation'
  | 'project_updated'
  | 'payment_received'
  | 'payment_released'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'dispute_opened'
  | 'dispute_response_needed'
  | 'dispute_resolved'
  | 'new_message'
  | 'new_review'
  | 'system_announcement'
  | 'account_verified';

export type NotificationCategory =
  | 'orders'
  | 'proposals'
  | 'payments'
  | 'messages'
  | 'disputes'
  | 'reviews'
  | 'system';

export interface Notification {
  id: string;
  notification_type: NotificationType;
  category: NotificationCategory;
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  related_object_type: string;
  related_object_id: string | null;
  action_url: string;
  is_read: boolean;
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationListItem {
  id: string;
  notification_type: NotificationType;
  category: NotificationCategory;
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  action_url: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  email_orders: boolean;
  email_proposals: boolean;
  email_payments: boolean;
  email_messages: boolean;
  email_disputes: boolean;
  email_reviews: boolean;
  email_system: boolean;
  push_orders: boolean;
  push_proposals: boolean;
  push_payments: boolean;
  push_messages: boolean;
  push_disputes: boolean;
  push_reviews: boolean;
  push_system: boolean;
  sms_payments: boolean;
  sms_disputes: boolean;
  sms_system: boolean;
  preferred_language: 'en' | 'ar';
}

export interface UnreadCount {
  total: number;
  by_category: Record<NotificationCategory, number>;
}

// Helper functions
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<string, string> = {
    order_created: 'shopping-bag',
    order_confirmed: 'check-circle',
    order_started: 'play-circle',
    order_delivered: 'package',
    order_completed: 'check-circle',
    order_cancelled: 'x-circle',
    order_revision_requested: 'edit',
    milestone_submitted: 'upload',
    milestone_approved: 'check',
    milestone_revision: 'refresh-cw',
    proposal_received: 'file-text',
    proposal_accepted: 'check-circle',
    proposal_rejected: 'x-circle',
    project_invitation: 'mail',
    project_updated: 'edit',
    payment_received: 'dollar-sign',
    payment_released: 'credit-card',
    withdrawal_approved: 'check-circle',
    withdrawal_rejected: 'x-circle',
    dispute_opened: 'alert-triangle',
    dispute_response_needed: 'alert-circle',
    dispute_resolved: 'check-circle',
    new_message: 'message-square',
    new_review: 'star',
    system_announcement: 'bell',
    account_verified: 'shield-check',
  };
  return icons[type] || 'bell';
}

export function getCategoryColor(category: NotificationCategory): string {
  const colors: Record<NotificationCategory, string> = {
    orders: 'bg-blue-100 text-blue-800',
    proposals: 'bg-purple-100 text-purple-800',
    payments: 'bg-green-100 text-green-800',
    messages: 'bg-yellow-100 text-yellow-800',
    disputes: 'bg-red-100 text-red-800',
    reviews: 'bg-orange-100 text-orange-800',
    system: 'bg-gray-100 text-gray-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
}
