import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales, localeDirection, type Locale } from '@/i18n/config';
import { ClientProviders } from '@/components/ClientProviders';
import { SetDocumentAttributes } from '@/components/SetDocumentAttributes';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  return {
    title: locale === 'ar' ? 'تشاور - منصة الاستشارات الهندسية' : 'Tashawer - Engineering Consultation Platform',
    description: locale === 'ar'
      ? 'تشاور - تواصل مع استشاريين هندسيين في المملكة العربية السعودية'
      : 'Tashawer - Connect with engineering consultants in Saudi Arabia',
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale as Locale;

  // Validate locale
  if (!locales.includes(locale)) {
    notFound();
  }

  const dir = localeDirection[locale];
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SetDocumentAttributes locale={locale} dir={dir} />
      <ClientProviders>
        <div className={locale === 'ar' ? 'font-arabic' : 'font-sans'}>
          {children}
        </div>
      </ClientProviders>
    </NextIntlClientProvider>
  );
}
