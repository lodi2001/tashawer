'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button, Input, Alert, AlertDescription } from '@/components/ui';
import { registerIndividual } from '@/lib/auth';
import { handleApiError } from '@/lib/api';

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    mobile: z
      .string()
      .regex(/^(05|5|966)\d{8}$/, 'Please enter a valid Saudi mobile number'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirm_password: z.string(),
    national_id: z
      .string()
      .optional()
      .refine((val) => !val || /^[12]\d{9}$/.test(val), {
        message: 'National ID must be 10 digits starting with 1 or 2',
      }),
    city: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterClientIndividualPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      await registerIndividual(data);
      router.push('/verify-email?email=' + encodeURIComponent(data.email));
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Register as Individual Client"
      subtitle="Create your personal account"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Input
          label="Full Name *"
          placeholder="Enter your full name"
          error={errors.full_name?.message}
          {...register('full_name')}
        />

        <Input
          label="Email Address *"
          type="email"
          placeholder="your@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Mobile Number *"
          placeholder="05XXXXXXXX"
          error={errors.mobile?.message}
          {...register('mobile')}
        />

        <Input
          label="National ID"
          placeholder="10-digit ID number"
          error={errors.national_id?.message}
          {...register('national_id')}
        />

        <Input
          label="City"
          placeholder="Your city"
          error={errors.city?.message}
          {...register('city')}
        />

        <Input
          label="Password *"
          type="password"
          placeholder="Create a strong password"
          error={errors.password?.message}
          helperText="At least 8 characters with uppercase, lowercase, and number"
          {...register('password')}
        />

        <Input
          label="Confirm Password *"
          type="password"
          placeholder="Confirm your password"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Create Account
        </Button>

        <div className="text-center text-sm">
          <Link
            href="/register/client"
            className="font-medium text-primary hover:text-primary/80"
          >
            Choose different account type
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
