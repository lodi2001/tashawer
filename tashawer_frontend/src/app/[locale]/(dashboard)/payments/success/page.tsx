'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Spinner,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { getPaymentStatus } from '@/lib/payments';
import { handleApiError } from '@/lib/api';
import type { PaymentStatusResponse } from '@/types';
import { CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionRef = searchParams.get('transaction');
  const tapId = searchParams.get('tap_id');

  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!transactionRef) {
        setError('Missing transaction reference');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const paymentStatus = await getPaymentStatus(transactionRef);
        setStatus(paymentStatus);

        // If still processing, poll again after 3 seconds
        if (paymentStatus.status === 'processing') {
          setTimeout(checkPaymentStatus, 3000);
        }
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    checkPaymentStatus();
  }, [transactionRef]);

  const isSuccess = status?.status === 'completed';
  const isProcessing = status?.status === 'processing';
  const isFailed = status?.status === 'failed' || status?.status === 'cancelled';

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto py-12">
        <Card>
          <CardContent className="pt-8 pb-8">
            {isLoading ? (
              <div className="text-center">
                <Spinner size="lg" className="mx-auto" />
                <p className="mt-4 text-gray-600">Verifying payment...</p>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : isSuccess ? (
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-10 w-10 text-brand-blue" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Successful!
                </h1>
                <p className="text-gray-600 mb-6">
                  Your payment of {status.amount} {status.currency} has been processed successfully.
                </p>

                <div className="bg-brand-yellow/10 rounded-lg p-4 mb-6 text-left">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Reference</dt>
                      <dd className="font-medium text-gray-900">{status.reference_number}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Amount</dt>
                      <dd className="font-medium text-gray-900">{status.amount} {status.currency}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Status</dt>
                      <dd className="font-medium text-brand-blue">Completed</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex gap-3 justify-center">
                  <Link href="/payments/escrow">
                    <Button>
                      View Escrow
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/client/dashboard">
                    <Button variant="outline">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            ) : isProcessing ? (
              <div className="text-center">
                <RefreshCw className="h-12 w-12 text-brand-yellow mx-auto mb-4 animate-spin" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Processing Payment...
                </h1>
                <p className="text-gray-600 mb-4">
                  Please wait while we confirm your payment.
                </p>
                <p className="text-sm text-gray-500">
                  This may take a few moments.
                </p>
              </div>
            ) : isFailed ? (
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-10 w-10 text-brand-red" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment {status?.status === 'cancelled' ? 'Cancelled' : 'Failed'}
                </h1>
                <p className="text-gray-600 mb-6">
                  {status?.status === 'cancelled'
                    ? 'Your payment was cancelled.'
                    : 'There was an issue processing your payment.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <Link href="/payments/escrow">
                    <Button>
                      Try Again
                    </Button>
                  </Link>
                  <Link href="/client/dashboard">
                    <Button variant="outline">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
