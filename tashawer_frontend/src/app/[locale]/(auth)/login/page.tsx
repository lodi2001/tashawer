'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button, Input, Alert, AlertDescription } from '@/components/ui';
import { login } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { handleApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const { setUser, fetchProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to prefix paths with locale
  const localePath = (path: string) => `/${locale}${path}`;

  const loginSchema = z.object({
    email: z.string().email(tErrors('invalidEmail')),
    password: z.string().min(1, tErrors('required')),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await login(data);
      setUser(response.user);
      await fetchProfile();

      // Redirect based on user role
      if (response.user.role === 'admin') {
        router.push(localePath('/admin/users'));
      } else {
        router.push(localePath('/profile'));
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('signInTitle')}
      subtitle={t('welcomeBack')}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Input
          label={t('email')}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label={t('password')}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              href={localePath('/forgot-password')}
              className="font-medium text-primary hover:text-primary/80"
            >
              {t('forgotPassword')}
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          {t('signIn')}
        </Button>

        <div className="text-center text-sm">
          <span className="text-gray-600">{t('noAccount')} </span>
          <Link
            href={localePath('/register')}
            className="font-medium text-primary hover:text-primary/80"
          >
            {t('register')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
