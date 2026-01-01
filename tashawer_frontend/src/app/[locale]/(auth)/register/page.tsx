'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Card, CardContent } from '@/components/ui';
import { Users, Briefcase } from 'lucide-react';

export default function RegisterPage() {
  const locale = useLocale();
  const t = useTranslations('auth');
  const isRTL = locale === 'ar';

  // Helper to prefix paths with locale
  const localePath = (path: string) => `/${locale}${path}`;

  const roles = [
    {
      value: 'client',
      label: t('clientRole'),
      description: t('clientRoleDesc'),
      icon: Users,
    },
    {
      value: 'consultant',
      label: t('consultantRole'),
      description: t('consultantRoleDesc'),
      icon: Briefcase,
    },
  ];

  return (
    <AuthLayout
      title={t('createAccountTitle')}
      subtitle={t('chooseRole')}
    >
      <div className="space-y-4">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <Link
              key={role.value}
              href={localePath(`/register/${role.value}`)}
              className="block"
            >
              <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer">
                <CardContent className={`flex items-center gap-4 p-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <h3 className="font-semibold text-gray-900">{role.label}</h3>
                    <p className="text-sm text-gray-500">{role.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        <div className="text-center text-sm pt-4">
          <span className="text-gray-600">{t('haveAccount')} </span>
          <Link
            href={localePath('/login')}
            className="font-medium text-primary hover:text-primary/80"
          >
            {t('signIn')}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
