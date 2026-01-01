'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const locale = useLocale();
  const t = useTranslations('common');
  const isRTL = locale === 'ar';

  // Helper to prefix paths with locale
  const localePath = (path: string) => `/${locale}${path}`;

  return (
    <div className={`min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 ${isRTL ? 'font-arabic' : ''}`}>
      {/* Language Switcher */}
      <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'}`}>
        <LanguageSwitcher />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href={localePath('/')} className="flex justify-center">
          <h1 className="text-3xl font-bold text-primary">{t('appName')}</h1>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-gray-600">{subtitle}</p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
