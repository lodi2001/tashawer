'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button, Alert, AlertDescription, Spinner } from '@/components/ui';
import { verifyEmail, resendVerification } from '@/lib/auth';
import { handleApiError } from '@/lib/api';
import { CheckCircle2, Mail, XCircle } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (token) {
      handleVerify();
    }
  }, [token]);

  const handleVerify = async () => {
    if (!token) return;

    try {
      setStatus('verifying');
      setError(null);
      await verifyEmail(token);
      setStatus('success');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setStatus('error');
      setError(handleApiError(err));
    }
  };

  const handleResend = async () => {
    if (!email) return;

    try {
      setResendStatus('loading');
      await resendVerification(email);
      setResendStatus('success');
    } catch (err) {
      setResendStatus('error');
      setError(handleApiError(err));
    }
  };

  // If we have a token, show verification status
  if (token) {
    if (status === 'verifying') {
      return (
        <AuthLayout title="Verifying your email">
          <div className="flex flex-col items-center justify-center py-8">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600">Please wait while we verify your email...</p>
          </div>
        </AuthLayout>
      );
    }

    if (status === 'success') {
      return (
        <AuthLayout title="Email Verified">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Email verified successfully!
            </h3>
            <p className="mt-2 text-center text-gray-600">
              Redirecting you to login...
            </p>
            <Link href="/login" className="mt-4">
              <Button>Go to Login</Button>
            </Link>
          </div>
        </AuthLayout>
      );
    }

    if (status === 'error') {
      return (
        <AuthLayout title="Verification Failed">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Verification failed
            </h3>
            <p className="mt-2 text-center text-gray-600">{error}</p>
            <Link href="/login" className="mt-4">
              <Button variant="outline">Back to Login</Button>
            </Link>
          </div>
        </AuthLayout>
      );
    }
  }

  // No token - show instructions to check email
  return (
    <AuthLayout title="Check your email">
      <div className="flex flex-col items-center justify-center py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Verification email sent
        </h3>
        <p className="mt-2 text-center text-gray-600">
          We&apos;ve sent a verification link to{' '}
          {email && <span className="font-medium">{email}</span>}
        </p>
        <p className="mt-1 text-center text-sm text-gray-500">
          Please check your inbox and click the link to verify your account.
        </p>

        {email && (
          <div className="mt-6 w-full">
            {resendStatus === 'success' ? (
              <Alert variant="success">
                <AlertDescription>
                  Verification email resent successfully!
                </AlertDescription>
              </Alert>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResend}
                isLoading={resendStatus === 'loading'}
                disabled={resendStatus === 'loading'}
              >
                Resend verification email
              </Button>
            )}
          </div>
        )}

        {error && resendStatus === 'error' && (
          <Alert variant="destructive" className="mt-4 w-full">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Link href="/login" className="mt-6">
          <Button variant="link">Back to Login</Button>
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Loading...">
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        </AuthLayout>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
