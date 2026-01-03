'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Bell, Check, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/lib/notifications';
import {
  registerForPushNotifications,
  setupForegroundNotifications,
  isPushEnabled,
} from '@/lib/push-notifications';
import type { NotificationListItem, UnreadCount } from '@/types/notification';
import { getCategoryColor } from '@/types/notification';

export function NotificationBell() {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<UnreadCount>({ total: 0, by_category: {} as Record<string, number> });
  const [isLoading, setIsLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pushInitialized = useRef(false);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await getNotifications({ limit: 10 });
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle foreground notification
  const handleForegroundNotification = useCallback((notification: { title?: string; body?: string; url?: string }) => {
    // Refresh unread count when a new notification arrives
    loadUnreadCount();

    // If dropdown is open, also refresh notifications
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadUnreadCount, loadNotifications]);

  // Initialize push notifications on mount
  useEffect(() => {
    if (pushInitialized.current) return;
    pushInitialized.current = true;

    // Check if already enabled
    setPushEnabled(isPushEnabled());

    // Set up foreground message handler
    setupForegroundNotifications(handleForegroundNotification);

    // Request permission if not already granted
    if (!isPushEnabled() && typeof window !== 'undefined' && 'Notification' in window) {
      // Auto-register after a short delay (better UX)
      const timer = setTimeout(() => {
        registerForPushNotifications().then((success) => {
          setPushEnabled(success);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [handleForegroundNotification]);

  // Load unread count on mount and periodically
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount({ total: 0, by_category: {} as Record<string, number> });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationTitle = (notification: NotificationListItem) => {
    return isRTL && notification.title_ar ? notification.title_ar : notification.title;
  };

  const getNotificationMessage = (notification: NotificationListItem) => {
    return isRTL && notification.message_ar ? notification.message_ar : notification.message;
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: isRTL ? ar : undefined,
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label={isRTL ? 'الإشعارات' : 'Notifications'}
      >
        <Bell className="h-5 w-5" />
        {unreadCount.total > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount.total > 99 ? '99+' : unreadCount.total}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-80 md:w-96 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {isRTL ? 'الإشعارات' : 'Notifications'}
            </h3>
            {unreadCount.total > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-brand-blue hover:underline"
              >
                {isRTL ? 'تحديد الكل كمقروء' : 'Mark all as read'}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                {isRTL ? 'لا توجد إشعارات' : 'No notifications'}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <Link
                      href={notification.action_url || '#'}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                        setIsOpen(false);
                      }}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50' : ''
                      }`}
                    >
                      {/* Category Badge */}
                      <span
                        className={`mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full ${
                          !notification.is_read ? 'bg-brand-blue' : 'bg-gray-300'
                        }`}
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''} text-gray-900 truncate`}>
                          {getNotificationTitle(notification)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {getNotificationMessage(notification)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${getCategoryColor(
                              notification.category
                            )}`}
                          >
                            {notification.category}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Mark as read button */}
                      {!notification.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-brand-blue rounded"
                          title={isRTL ? 'تحديد كمقروء' : 'Mark as read'}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-3">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-brand-blue hover:underline"
            >
              {isRTL ? 'عرض كل الإشعارات' : 'View all notifications'}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
