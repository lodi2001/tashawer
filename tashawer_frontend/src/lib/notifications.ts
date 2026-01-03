import api from './api';
import type {
  Notification,
  NotificationListItem,
  NotificationPreferences,
  UnreadCount,
} from '@/types/notification';

interface NotificationListResponse {
  success: boolean;
  data: NotificationListItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Get list of notifications
 */
export async function getNotifications(params?: {
  is_read?: boolean;
  category?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: NotificationListItem[]; meta: { total: number; limit: number; offset: number } }> {
  const response = await api.get<NotificationListResponse>('/notifications/', {
    params,
  });
  return {
    data: response.data.data,
    meta: response.data.meta,
  };
}

/**
 * Get a specific notification
 */
export async function getNotification(notificationId: string): Promise<Notification> {
  const response = await api.get<{ success: boolean; data: Notification }>(
    `/notifications/${notificationId}/`
  );
  return response.data.data;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await api.post(`/notifications/${notificationId}/mark-read/`);
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(category?: string): Promise<void> {
  await api.post('/notifications/mark-all-read/', { category });
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await api.delete(`/notifications/${notificationId}/`);
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<UnreadCount> {
  const response = await api.get<{ success: boolean; data: UnreadCount }>(
    '/notifications/unread-count/'
  );
  return response.data.data;
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await api.get<{ success: boolean; data: NotificationPreferences }>(
    '/notifications/preferences/'
  );
  return response.data.data;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const response = await api.put<{ success: boolean; data: NotificationPreferences }>(
    '/notifications/preferences/',
    preferences
  );
  return response.data.data;
}
