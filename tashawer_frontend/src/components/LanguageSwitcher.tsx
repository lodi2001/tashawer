'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'toggle';
  className?: string;
}

export function LanguageSwitcher({ variant = 'toggle', className = '' }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    // Replace the current locale in the pathname with the new one
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    router.push(newPath);
  };

  if (variant === 'toggle') {
    const otherLocale = locale === 'en' ? 'ar' : 'en';
    return (
      <button
        onClick={() => handleLocaleChange(otherLocale)}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
          text-muted-foreground hover:text-foreground hover:bg-muted
          transition-colors ${className}`}
        title={`Switch to ${localeNames[otherLocale]}`}
      >
        <Globe className="h-4 w-4" />
        <span>{localeNames[otherLocale]}</span>
      </button>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative ${className}`}>
      <select
        value={locale}
        onChange={(e) => handleLocaleChange(e.target.value as Locale)}
        className="appearance-none bg-transparent border border-border rounded-md px-3 py-2 pr-8
          text-sm font-medium text-foreground cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeNames[loc]}
          </option>
        ))}
      </select>
      <Globe className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}

export default LanguageSwitcher;
