'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardContent,
  Spinner,
  Alert,
  AlertDescription,
  Button,
} from '@/components/ui';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from '@/lib/notifications';
import { handleApiError } from '@/lib/api';
import type { NotificationListItem, NotificationCategory, UnreadCount } from '@/types/notification';
import { getCategoryColor } from '@/types/notification';
import {
  Bell,
  Filter,
  Check,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const categoryOptions: { value: NotificationCategory | ''; label: string; labelAr: string }[] = [
  { value: '', label: 'All Categories', labelAr: 'جميع الفئات' },
  { value: 'orders', label: 'Orders', labelAr: 'الطلبات' },
  { value: 'proposals', label: 'Proposals', labelAr: 'العروض' },
  { value: 'payments', label: 'Payments', labelAr: 'المدفوعات' },
  { value: 'messages', label: 'Messages', labelAr: 'الرسائل' },
  { value: 'disputes', label: 'Disputes', labelAr: 'النزاعات' },
  { value: 'reviews', label: 'Reviews', labelAr: 'التقييمات' },
  { value: 'system', label: 'System', labelAr: 'النظام' },
];

const readOptions: { value: boolean | ''; label: string; labelAr: string }[] = [
  { value: '', label: 'All', labelAr: 'الكل' },
  { value: false, label: 'Unread', labelAr: 'غير مقروء' },
  { value: true, label: 'Read', labelAr: 'مقروء' },
];

const ITEMS_PER_PAGE = 20;

export default function NotificationsPage() {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | ''>('');
  const [readFilter, setReadFilter] = useState<boolean | ''>('');
  const [unreadCount, setUnreadCount] = useState<UnreadCount>({ total: 0, by_category: {} as Record<string, number> });
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [categoryFilter, readFilter, page]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, meta } = await getNotifications({
        category: categoryFilter || undefined,
        is_read: readFilter === '' ? undefined : readFilter,
        limit: ITEMS_PER_PAGE,
        offset: page * ITEMS_PER_PAGE,
      });
      setNotifications(data);
      setTotal(meta.total);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(categoryFilter || undefined);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      if (categoryFilter) {
        setUnreadCount((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - (prev.by_category[categoryFilter] || 0)),
          by_category: { ...prev.by_category, [categoryFilter]: 0 },
        }));
      } else {
        setUnreadCount({ total: 0, by_category: {} as Record<string, number> });
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      const deleted = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setTotal((prev) => prev - 1);
      if (deleted && !deleted.is_read) {
        setUnreadCount((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: isRTL ? ar : undefined,
    });
  };

  const getNotificationTitle = (notification: NotificationListItem) => {
    return isRTL && notification.title_ar ? notification.title_ar : notification.title;
  };

  const getNotificationMessage = (notification: NotificationListItem) => {
    return isRTL && notification.message_ar ? notification.message_ar : notification.message;
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isRTL ? 'الإشعارات' : 'Notifications'}
            </h1>
            <p className="text-sm text-gray-500">
              {isRTL ? 'إدارة الإشعارات وتفضيلاتك' : 'Manage your notifications and preferences'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount.total > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                <span>{isRTL ? 'تحديد الكل كمقروء' : 'Mark all as read'}</span>
              </Button>
            )}
            <Link href="/notifications/preferences">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>{isRTL ? 'التفضيلات' : 'Preferences'}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{total}</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'إجمالي الإشعارات' : 'Total'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 flex-shrink-0">
                  <Bell className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadCount.total}</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'غير مقروء' : 'Unread'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{total - unreadCount.total}</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'مقروء' : 'Read'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 flex-shrink-0">
                  <Filter className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Object.keys(unreadCount.by_category || {}).length}</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'الفئات' : 'Categories'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {isRTL ? 'تصفية:' : 'Filter:'}
                </span>
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value as NotificationCategory | '');
                  setPage(0);
                }}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {isRTL ? option.labelAr : option.label}
                  </option>
                ))}
              </select>

              <select
                value={readFilter === '' ? '' : readFilter.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  setReadFilter(value === '' ? '' : value === 'true');
                  setPage(0);
                }}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                {readOptions.map((option) => (
                  <option key={option.value.toString()} value={option.value.toString()}>
                    {isRTL ? option.labelAr : option.label}
                  </option>
                ))}
              </select>

              <span className="text-sm text-gray-500">
                {isRTL
                  ? `تم العثور على ${total} إشعار`
                  : `${total} notification${total !== 1 ? 's' : ''} found`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && notifications.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {isRTL ? 'لا توجد إشعارات' : 'No notifications found'}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {isRTL
                  ? categoryFilter || readFilter !== ''
                    ? 'جرب تغيير المرشحات لرؤية المزيد من الإشعارات.'
                    : 'لا توجد إشعارات جديدة في الوقت الحالي.'
                  : categoryFilter || readFilter !== ''
                    ? 'Try changing the filters to see more notifications.'
                    : 'No new notifications at this time.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        {!isLoading && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-shadow hover:shadow-md ${
                  !notification.is_read ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Read indicator */}
                    <span
                      className={`mt-2 inline-flex h-2 w-2 flex-shrink-0 rounded-full ${
                        !notification.is_read ? 'bg-brand-blue' : 'bg-gray-300'
                      }`}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            href={notification.action_url || '#'}
                            className="block"
                            onClick={() => {
                              if (!notification.is_read) {
                                handleMarkAsRead(notification.id);
                              }
                            }}
                          >
                            <h3
                              className={`text-base ${
                                !notification.is_read ? 'font-semibold' : 'font-medium'
                              } text-gray-900 hover:text-brand-blue`}
                            >
                              {getNotificationTitle(notification)}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-600 mt-1">
                            {getNotificationMessage(notification)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(
                                notification.category
                              )}`}
                            >
                              {isRTL
                                ? categoryOptions.find((c) => c.value === notification.category)?.labelAr
                                : notification.category}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatTime(notification.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1.5 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded transition-colors"
                              title={isRTL ? 'تحديد كمقروء' : 'Mark as read'}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title={isRTL ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{isRTL ? 'السابق' : 'Previous'}</span>
            </Button>
            <span className="text-sm text-gray-600">
              {isRTL
                ? `${page + 1} من ${totalPages}`
                : `Page ${page + 1} of ${totalPages}`}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1"
            >
              <span>{isRTL ? 'التالي' : 'Next'}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
