'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Card, CardContent } from '@/components/ui';
import { User, Building2, ArrowLeft } from 'lucide-react';

export default function ConsultantRegisterPage() {
  const locale = useLocale();
  const t = useTranslations('auth');
  const isRTL = locale === 'ar';

  // Helper to prefix paths with locale
  const localePath = (path: string) => `/${locale}${path}`;

  const types = [
    {
      value: 'individual',
      label: t('individualConsultant'),
      description: t('individualConsultantDesc'),
      icon: User,
    },
    {
      value: 'organization',
      label: t('consultingOffice'),
      description: t('consultingOfficeDesc'),
      icon: Building2,
    },
  ];

  return (
    <AuthLayout
      title={t('registerAsConsultantTitle')}
      subtitle={t('chooseConsultantType')}
    >
      <div className="space-y-4">
        {types.map((type) => {
          const Icon = type.icon;
          return (
            <Link
              key={type.value}
              href={localePath(`/register/consultant/${type.value}`)}
              className="block"
            >
              <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer">
                <CardContent className={`flex items-center gap-4 p-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <h3 className="font-semibold text-gray-900">{type.label}</h3>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        <div className="text-center text-sm pt-4">
          <Link
            href={localePath('/register')}
            className={`inline-flex items-center gap-1 font-medium text-primary hover:text-primary/80 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            {t('backToRoleSelection')}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
