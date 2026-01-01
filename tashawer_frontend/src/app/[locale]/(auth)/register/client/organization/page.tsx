'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button, Input, Select, Alert, AlertDescription } from '@/components/ui';
import { registerOrganization } from '@/lib/auth';
import { handleApiError } from '@/lib/api';

const companyTypes = [
  { value: 'company', label: 'Private Company' },
  { value: 'engineering_office', label: 'Engineering Office' },
  { value: 'government', label: 'Government Entity' },
  { value: 'other', label: 'Other' },
];

const registerSchema = z
  .object({
    company_name: z.string().min(2, 'Company name is required'),
    company_type: z.enum(['company', 'engineering_office', 'government', 'other']),
    representative_name: z.string().min(2, 'Representative name is required'),
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
    commercial_registration_no: z.string().optional(),
    vat_number: z.string().optional(),
    representative_position: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterClientOrganizationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      company_type: 'company',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      await registerOrganization(data);
      router.push('/verify-email?email=' + encodeURIComponent(data.email));
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Register as Organization"
      subtitle="Create your company account"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Input
          label="Company Name *"
          placeholder="Enter company name"
          error={errors.company_name?.message}
          {...register('company_name')}
        />

        <Select
          label="Company Type *"
          options={companyTypes}
          error={errors.company_type?.message}
          {...register('company_type')}
        />

        <Input
          label="Commercial Registration No."
          placeholder="10-digit CR number"
          error={errors.commercial_registration_no?.message}
          {...register('commercial_registration_no')}
        />

        <Input
          label="VAT Number"
          placeholder="15-digit VAT number"
          error={errors.vat_number?.message}
          {...register('vat_number')}
        />

        <hr className="my-4" />

        <Input
          label="Representative Name *"
          placeholder="Authorized representative"
          error={errors.representative_name?.message}
          {...register('representative_name')}
        />

        <Input
          label="Position"
          placeholder="Job title"
          error={errors.representative_position?.message}
          {...register('representative_position')}
        />

        <Input
          label="Email Address *"
          type="email"
          placeholder="company@email.com"
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
          label="City"
          placeholder="City"
          error={errors.city?.message}
          {...register('city')}
        />

        <Input
          label="Address"
          placeholder="Full address"
          error={errors.address?.message}
          {...register('address')}
        />

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
