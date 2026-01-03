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
import { getPaymentStatus, getDepositStatus } from '@/lib/payments';
import { handleApiError } from '@/lib/api';
import type { PaymentStatusResponse, DepositStatusResponse } from '@/types';
import { CheckCircle2, ArrowRight, RefreshCw, Wallet } from 'lucide-react';

type StatusData = {
  reference: string;
  amount: string;
  currency: string;
  status: string;
  walletBalance?: string | null;
};

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionRef = searchParams.get('transaction');
  const depositRef = searchParams.get('deposit');
  const tapId = searchParams.get('tap_id');

  const isDeposit = !!depositRef;
  const reference = depositRef || transactionRef;

  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!reference) {
        setError('Missing reference');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        if (isDeposit) {
          const depositStatus = await getDepositStatus(reference);
          setStatusData({
            reference: depositStatus.reference_number,
            amount: depositStatus.amount,
            currency: depositStatus.currency,
            status: depositStatus.status,
            walletBalance: depositStatus.wallet_balance,
          });

          if (depositStatus.status === 'processing') {
            setTimeout(checkStatus, 3000);
          }
        } else {
          const paymentStatus = await getPaymentStatus(reference);
          setStatusData({
            reference: paymentStatus.reference_number,
            amount: paymentStatus.amount,
            currency: paymentStatus.currency,
            status: paymentStatus.status,
          });

          if (paymentStatus.status === 'processing') {
            setTimeout(checkStatus, 3000);
          }
        }
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [reference, isDeposit]);

  const isSuccess = statusData?.status === 'completed';
  const isProcessing = statusData?.status === 'processing';
  const isFailed = statusData?.status === 'failed' || statusData?.status === 'cancelled';

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto py-12">
        <Card>
          <CardContent className="pt-8 pb-8">
            {isLoading ? (
              <div className="text-center">
                <Spinner size="lg" className="mx-auto" />
                <p className="mt-4 text-gray-600">
                  Verifying {isDeposit ? 'deposit' : 'payment'}...
                </p>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : isSuccess ? (
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mb-6">
                  {isDeposit ? (
                    <Wallet className="h-10 w-10 text-brand-blue" />
                  ) : (
                    <CheckCircle2 className="h-10 w-10 text-brand-blue" />
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {isDeposit ? 'Deposit Successful!' : 'Payment Successful!'}
                </h1>
                <p className="text-gray-600 mb-6">
                  Your {isDeposit ? 'deposit' : 'payment'} of {statusData?.amount} {statusData?.currency} has been processed successfully.
                </p>

                <div className="bg-brand-yellow/10 rounded-lg p-4 mb-6 text-left">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Reference</dt>
                      <dd className="font-medium text-gray-900">{statusData?.reference}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Amount</dt>
                      <dd className="font-medium text-gray-900">{statusData?.amount} {statusData?.currency}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Status</dt>
                      <dd className="font-medium text-brand-blue">Completed</dd>
                    </div>
                    {isDeposit && statusData?.walletBalance && (
                      <div className="flex justify-between pt-2 border-t">
                        <dt className="text-gray-500">Wallet Balance</dt>
                        <dd className="font-medium text-brand-blue">
                          {parseFloat(statusData.walletBalance).toLocaleString()} SAR
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="flex gap-3 justify-center">
                  {isDeposit ? (
                    <>
                      <Link href="/payments/wallet">
                        <Button>
                          <Wallet className="h-4 w-4 mr-2" />
                          View Wallet
                        </Button>
                      </Link>
                      <Link href="/client/dashboard">
                        <Button variant="outline">
                          Go to Dashboard
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            ) : isProcessing ? (
              <div className="text-center">
                <RefreshCw className="h-12 w-12 text-brand-yellow mx-auto mb-4 animate-spin" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Processing {isDeposit ? 'Deposit' : 'Payment'}...
                </h1>
                <p className="text-gray-600 mb-4">
                  Please wait while we confirm your {isDeposit ? 'deposit' : 'payment'}.
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
                  {isDeposit ? 'Deposit' : 'Payment'} {statusData?.status === 'cancelled' ? 'Cancelled' : 'Failed'}
                </h1>
                <p className="text-gray-600 mb-6">
                  {statusData?.status === 'cancelled'
                    ? `Your ${isDeposit ? 'deposit' : 'payment'} was cancelled.`
                    : `There was an issue processing your ${isDeposit ? 'deposit' : 'payment'}.`}
                </p>
                <div className="flex gap-3 justify-center">
                  <Link href={isDeposit ? '/payments/wallet' : '/payments/escrow'}>
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
