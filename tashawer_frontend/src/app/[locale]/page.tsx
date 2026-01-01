'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuthStore } from '@/store/authStore';
import { Briefcase, Building2, User, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const locale = useLocale();
  const t = useTranslations('landing');
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  const tNav = useTranslations('nav');
  const { isAuthenticated, user } = useAuthStore();
  const isRTL = locale === 'ar';

  // Helper to prefix paths with locale
  const localePath = (path: string) => `/${locale}${path}`;

  const features = [
    {
      icon: <User className="h-6 w-6" />,
      title: t('individualClients'),
      description: t('individualClientsDesc'),
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: t('organizations'),
      description: t('organizationsDesc'),
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: t('consultants'),
      description: t('consultantsDesc'),
    },
  ];

  const benefits = [
    t('benefit1'),
    t('benefit2'),
    t('benefit3'),
    t('benefit4'),
    t('benefit5'),
    t('benefit6'),
  ];

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className={`min-h-screen bg-white ${isRTL ? 'font-arabic' : ''}`}>
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Link href={localePath('/')} className="text-2xl font-bold text-primary">
              {tCommon('appName')}
            </Link>
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <LanguageSwitcher />
              {isAuthenticated ? (
                <Link href={localePath(user?.role === 'admin' ? '/admin/users' : '/profile')}>
                  <Button>{tNav('dashboard')}</Button>
                </Link>
              ) : (
                <>
                  <Link href={localePath('/login')}>
                    <Button variant="ghost">{tAuth('signIn')}</Button>
                  </Link>
                  <Link href={localePath('/register')}>
                    <Button>{t('getStarted')}</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('heroTitle')}
            <br />
            <span className="text-primary">{t('heroTitleHighlight')}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
          <div className={`flex flex-wrap justify-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Link href={localePath('/register')}>
              <Button size="lg" className={`text-lg px-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {t('startYourProject')}
                <ArrowIcon className={`h-5 w-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
              </Button>
            </Link>
            <Link href={localePath('/register/consultant')}>
              <Button size="lg" variant="outline" className="text-lg px-8">
                {t('joinAsConsultant')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t('whoWeServe')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border bg-white hover:shadow-lg transition-shadow ${isRTL ? 'text-right' : ''}`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4 ${isRTL ? 'ml-auto' : ''}`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid md:grid-cols-2 gap-12 items-center ${isRTL ? 'direction-rtl' : ''}`}>
            <div className={isRTL ? 'text-right' : ''}>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {t('whyChooseUs')}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {t('whyChooseUsDesc')}
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`bg-white p-8 rounded-2xl shadow-lg ${isRTL ? 'text-right' : ''}`}>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t('readyToStart')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('readyToStartDesc')}
              </p>
              <Link href={localePath('/register')}>
                <Button className="w-full">{t('createAccount')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex flex-col md:flex-row items-center justify-between gap-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-xl font-bold text-primary">{tCommon('appName')}</span>
              <span className="text-gray-500">{locale === 'en' ? 'تشاور' : 'Tashawer'}</span>
            </div>
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} {tCommon('appName')}. {t('allRightsReserved')}.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
