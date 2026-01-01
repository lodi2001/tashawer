import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales, localeDirection, type Locale } from '@/i18n/config';
import { ClientProviders } from '@/components/ClientProviders';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
    <html lang={locale} dir={dir}>
      <head>
        <title>{locale === 'ar' ? 'تشاور - منصة الاستشارات الهندسية' : 'Tashawer - Engineering Consultation Platform'}</title>
        <meta
          name="description"
          content={locale === 'ar'
            ? 'تشاور - تواصل مع استشاريين هندسيين في المملكة العربية السعودية'
            : 'Tashawer - Connect with engineering consultants in Saudi Arabia'}
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} ${locale === 'ar' ? 'font-arabic' : 'font-sans'}`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientProviders>
            {children}
          </ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
