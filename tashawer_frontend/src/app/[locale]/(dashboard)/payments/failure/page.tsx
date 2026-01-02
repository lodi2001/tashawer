'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardContent,
  Button,
} from '@/components/ui';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PaymentFailurePage() {
  const searchParams = useSearchParams();
  const transactionRef = searchParams.get('transaction');
  const errorMessage = searchParams.get('error');

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto py-12">
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center mb-6">
                <XCircle className="h-10 w-10 text-brand-red" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Failed
              </h1>
              <p className="text-gray-600 mb-6">
                {errorMessage || 'We were unable to process your payment. Please try again or use a different payment method.'}
              </p>

              {transactionRef && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Reference</dt>
                      <dd className="font-medium text-gray-900">{transactionRef}</dd>
                    </div>
                  </dl>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">
                  Common reasons for payment failure:
                </p>
                <ul className="text-sm text-gray-600 text-left list-disc list-inside space-y-1 mb-6">
                  <li>Insufficient funds in your account</li>
                  <li>Card expired or invalid</li>
                  <li>3D Secure verification failed</li>
                  <li>Payment was cancelled</li>
                </ul>
              </div>

              <div className="flex gap-3 justify-center">
                <Link href="/payments/escrow">
                  <Button>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </Link>
                <Link href="/client/dashboard">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
              </div>

              <p className="mt-6 text-sm text-gray-500">
                If you continue to experience issues, please{' '}
                <Link href="/support" className="text-brand-blue hover:underline">
                  contact support
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
