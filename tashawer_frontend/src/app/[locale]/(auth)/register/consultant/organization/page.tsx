'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button, Input, Alert, AlertDescription } from '@/components/ui';
import { registerConsultant } from '@/lib/auth';
import { handleApiError } from '@/lib/api';

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Office name is required'),
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
    specialization: z.string().optional(),
    experience_years: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
    hourly_rate: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
    saudi_engineering_license_no: z.string().optional(),
    commercial_registration_no: z.string().optional(),
    bio: z.string().optional(),
    city: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type RegisterFormData = z.input<typeof registerSchema>;

export default function RegisterConsultantOrganizationPage() {
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
      // Set consultant_type to 'office' for consulting offices
      const payload = {
        ...data,
        consultant_type: 'office' as const,
        experience_years: data.experience_years ? Number(data.experience_years) : undefined,
        hourly_rate: data.hourly_rate ? Number(data.hourly_rate) : undefined,
      };
      await registerConsultant(payload);
      router.push('/verify-email?email=' + encodeURIComponent(data.email));
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Register as Consulting Office"
      subtitle="Join as an engineering consulting office"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Input
          label="Office Name *"
          placeholder="Your consulting office name"
          error={errors.full_name?.message}
          {...register('full_name')}
        />

        <Input
          label="Email Address *"
          type="email"
          placeholder="office@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Mobile Number *"
          placeholder="05XXXXXXXX"
          error={errors.mobile?.message}
          {...register('mobile')}
        />

        <hr className="my-4" />

        <Input
          label="Specialization"
          placeholder="e.g., Civil Engineering, Architecture"
          error={errors.specialization?.message}
          {...register('specialization')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Experience (Years)"
            type="number"
            min={0}
            placeholder="0"
            error={errors.experience_years?.message}
            {...register('experience_years')}
          />

          <Input
            label="Hourly Rate (SAR)"
            type="number"
            min={0}
            placeholder="0"
            error={errors.hourly_rate?.message}
            {...register('hourly_rate')}
          />
        </div>

        <Input
          label="Saudi Engineering License No."
          placeholder="License number"
          error={errors.saudi_engineering_license_no?.message}
          {...register('saudi_engineering_license_no')}
        />

        <Input
          label="Commercial Registration No."
          placeholder="10-digit CR number"
          error={errors.commercial_registration_no?.message}
          {...register('commercial_registration_no')}
        />

        <Input
          label="City"
          placeholder="Your city"
          error={errors.city?.message}
          {...register('city')}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">About the Office</label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Tell clients about your office and services..."
            {...register('bio')}
          />
        </div>

        <hr className="my-4" />

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
            href="/register/consultant"
            className="font-medium text-primary hover:text-primary/80"
          >
            Choose different consultant type
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
