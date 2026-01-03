'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
  Alert,
  AlertDescription,
  Button,
} from '@/components/ui';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/notifications';
import { handleApiError } from '@/lib/api';
import type { NotificationPreferences } from '@/types/notification';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
} from 'lucide-react';

interface PreferenceCategory {
  key: string;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

const categories: PreferenceCategory[] = [
  {
    key: 'orders',
    labelEn: 'Orders',
    labelAr: 'الطلبات',
    descriptionEn: 'Order status updates, deliveries, and milestones',
    descriptionAr: 'تحديثات حالة الطلب والتسليمات والمراحل',
  },
  {
    key: 'proposals',
    labelEn: 'Proposals',
    labelAr: 'العروض',
    descriptionEn: 'New proposals and proposal status changes',
    descriptionAr: 'العروض الجديدة وتغييرات حالة العروض',
  },
  {
    key: 'payments',
    labelEn: 'Payments',
    labelAr: 'المدفوعات',
    descriptionEn: 'Payment confirmations and wallet updates',
    descriptionAr: 'تأكيدات الدفع وتحديثات المحفظة',
  },
  {
    key: 'messages',
    labelEn: 'Messages',
    labelAr: 'الرسائل',
    descriptionEn: 'New messages and conversation updates',
    descriptionAr: 'الرسائل الجديدة وتحديثات المحادثات',
  },
  {
    key: 'disputes',
    labelEn: 'Disputes',
    labelAr: 'النزاعات',
    descriptionEn: 'Dispute status and resolution updates',
    descriptionAr: 'حالة النزاعات وتحديثات الحل',
  },
  {
    key: 'reviews',
    labelEn: 'Reviews',
    labelAr: 'التقييمات',
    descriptionEn: 'New reviews and feedback',
    descriptionAr: 'التقييمات والملاحظات الجديدة',
  },
  {
    key: 'system',
    labelEn: 'System',
    labelAr: 'النظام',
    descriptionEn: 'Important system announcements and updates',
    descriptionAr: 'إعلانات النظام المهمة والتحديثات',
  },
];

export default function NotificationPreferencesPage() {
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getNotificationPreferences();
      setPreferences(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    if (preferences) {
      setPreferences({ ...preferences, [key]: value });
      setSuccess(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;
    try {
      setIsSaving(true);
      setError(null);
      await updateNotificationPreferences(preferences);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = (lang: 'en' | 'ar') => {
    if (preferences) {
      setPreferences({ ...preferences, preferred_language: lang });
      setSuccess(false);
    }
  };

  const renderToggle = (checked: boolean, onChange: (value: boolean) => void, disabled = false) => (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 ${
        checked ? 'bg-brand-blue' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          isRTL
            ? checked ? '-translate-x-5' : 'translate-x-0'
            : checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${locale}/notifications`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isRTL ? 'تفضيلات الإشعارات' : 'Notification Preferences'}
            </h1>
            <p className="text-sm text-gray-500">
              {isRTL
                ? 'تحكم في كيفية وصول الإشعارات إليك'
                : 'Control how you receive notifications'}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {isRTL ? 'تم حفظ التفضيلات بنجاح' : 'Preferences saved successfully'}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Preferences Form */}
        {!isLoading && preferences && (
          <div className="space-y-6">
            {/* Preferred Language */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-brand-blue" />
                  <span>{isRTL ? 'اللغة المفضلة' : 'Preferred Language'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  {isRTL
                    ? 'اختر اللغة المفضلة لرسائل البريد الإلكتروني والإشعارات'
                    : 'Choose your preferred language for email and notifications'}
                </p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('en')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      preferences.preferred_language === 'en'
                        ? 'border-brand-blue bg-blue-50 text-brand-blue'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">English</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('ar')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      preferences.preferred_language === 'ar'
                        ? 'border-brand-blue bg-blue-50 text-brand-blue'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">العربية</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Email Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-brand-blue" />
                  <span>{isRTL ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category) => {
                    const key = `email_${category.key}` as keyof NotificationPreferences;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {isRTL ? category.labelAr : category.labelEn}
                          </p>
                          <p className="text-sm text-gray-500">
                            {isRTL ? category.descriptionAr : category.descriptionEn}
                          </p>
                        </div>
                        {renderToggle(
                          preferences[key] as boolean,
                          (value) => handleToggle(key, value)
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Push Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-brand-blue" />
                  <span>{isRTL ? 'الإشعارات الفورية' : 'Push Notifications'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category) => {
                    const key = `push_${category.key}` as keyof NotificationPreferences;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {isRTL ? category.labelAr : category.labelEn}
                          </p>
                          <p className="text-sm text-gray-500">
                            {isRTL ? category.descriptionAr : category.descriptionEn}
                          </p>
                        </div>
                        {renderToggle(
                          preferences[key] as boolean,
                          (value) => handleToggle(key, value)
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* SMS Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-brand-blue" />
                  <span>{isRTL ? 'إشعارات الرسائل النصية' : 'SMS Notifications'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  {isRTL
                    ? 'تتوفر الرسائل النصية للفئات ذات الأولوية العالية فقط'
                    : 'SMS is available for high-priority categories only'}
                </p>
                <div className="space-y-4">
                  {categories
                    .filter((c) => ['payments', 'disputes', 'system'].includes(c.key))
                    .map((category) => {
                      const key = `sms_${category.key}` as keyof NotificationPreferences;
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {isRTL ? category.labelAr : category.labelEn}
                            </p>
                            <p className="text-sm text-gray-500">
                              {isRTL ? category.descriptionAr : category.descriptionEn}
                            </p>
                          </div>
                          {renderToggle(
                            preferences[key] as boolean,
                            (value) => handleToggle(key, value)
                          )}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
                {isSaving ? (
                  <Spinner size="sm" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{isRTL ? 'حفظ التفضيلات' : 'Save Preferences'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
