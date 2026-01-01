import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatCurrency(amount: number | string, locale: string = 'en'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    style: 'currency',
    currency: 'SAR',
  }).format(num);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function validateSaudiMobile(mobile: string): boolean {
  const cleaned = mobile.replace(/\D/g, '');
  return /^(966|0)?5[0-9]{8}$/.test(cleaned);
}

export function formatSaudiMobile(mobile: string): string {
  const cleaned = mobile.replace(/\D/g, '');
  if (cleaned.startsWith('966')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('05')) {
    return `+966${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith('5')) {
    return `+966${cleaned}`;
  }
  return mobile;
}
