import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  // List of all supported locales
  locales,
  // Default locale when no locale matches
  defaultLocale,
  // Prefix the default locale (en) in the URL as well
  localePrefix: 'always',
});

export const config = {
  // Match all pathnames except for
  // - /api routes
  // - /_next (Next.js internals)
  // - /_vercel (Vercel internals)
  // - /static (public static files)
  // - All files with extensions (e.g., favicon.ico)
  matcher: ['/((?!api|_next|_vercel|static|.*\\..*).*)'],
};
