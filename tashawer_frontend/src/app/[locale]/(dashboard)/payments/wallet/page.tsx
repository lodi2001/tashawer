'use client';

import { useState, useEffect } from 'react';
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
  Input,
  Label,
} from '@/components/ui';
import { getWallet, getDeposits, initializeDeposit } from '@/lib/payments';
import { handleApiError } from '@/lib/api';
import type { Wallet, DepositListItem, DepositStatus } from '@/types';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const depositStatusConfig: Record<DepositStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', className: 'text-brand-gray bg-secondary/20', icon: <Clock className="h-3 w-3" /> },
  processing: { label: 'Processing', className: 'text-primary bg-primary/10', icon: <RefreshCw className="h-3 w-3" /> },
  completed: { label: 'Completed', className: 'text-primary bg-primary/10', icon: <CheckCircle className="h-3 w-3" /> },
  failed: { label: 'Failed', className: 'text-destructive bg-destructive/10', icon: <XCircle className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', className: 'text-muted-foreground bg-muted', icon: <XCircle className="h-3 w-3" /> },
};

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [deposits, setDeposits] = useState<DepositListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [walletData, depositsData] = await Promise.all([
        getWallet(),
        getDeposits(1, 10),
      ]);
      setWallet(walletData);
      setDeposits(depositsData.results || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 10 || amount > 100000) {
      setDepositError('Amount must be between 10 and 100,000 SAR');
      return;
    }

    try {
      setDepositLoading(true);
      setDepositError(null);
      const response = await initializeDeposit({
        amount,
        payment_method: 'credit_card',
      });

      if (response.payment_url) {
        window.location.href = response.payment_url;
      } else {
        setDepositError('Failed to get payment URL');
      }
    } catch (err) {
      setDepositError(handleApiError(err));
    } finally {
      setDepositLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
            <p className="text-sm text-gray-500">Manage your balance and deposits</p>
          </div>
          <Button onClick={() => setShowDepositModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Funds
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Deposit Modal */}
        {showDepositModal && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Add Funds to Wallet
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the amount you want to deposit to your wallet.
              </p>

              {depositError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{depositError}</AlertDescription>
                </Alert>
              )}

              <div className="mb-4">
                <Label htmlFor="amount">Amount (SAR)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="10"
                  max="100000"
                  placeholder="Enter amount (10 - 100,000 SAR)"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: 10 SAR | Maximum: 100,000 SAR
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDepositModal(false);
                    setDepositAmount('');
                    setDepositError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleDeposit}
                  disabled={depositLoading || !depositAmount}
                >
                  {depositLoading ? 'Processing...' : 'Continue to Payment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Balance Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Available Balance</p>
                <p className="text-4xl font-bold text-gray-900">
                  {wallet ? parseFloat(wallet.balance).toLocaleString() : '0'}{' '}
                  <span className="text-lg font-normal text-gray-500">SAR</span>
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <WalletIcon className="h-8 w-8 text-primary" />
              </div>
            </div>

            {wallet && parseFloat(wallet.pending_balance) > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Pending: {parseFloat(wallet.pending_balance).toLocaleString()} SAR
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        {wallet && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowDownLeft className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Deposited</p>
                    <p className="text-lg font-semibold">
                      {parseFloat(wallet.total_deposited).toLocaleString()} SAR
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowUpRight className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Earned</p>
                    <p className="text-lg font-semibold">
                      {parseFloat(wallet.total_earned).toLocaleString()} SAR
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <ArrowUpRight className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Spent</p>
                    <p className="text-lg font-semibold">
                      {parseFloat(wallet.total_spent).toLocaleString()} SAR
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <ArrowUpRight className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Withdrawn</p>
                    <p className="text-lg font-semibold">
                      {parseFloat(wallet.total_withdrawn).toLocaleString()} SAR
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Deposits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deposits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <WalletIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No deposits yet</p>
                <p className="text-sm mt-1">Add funds to your wallet to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deposits.map((deposit) => {
                  const statusInfo = depositStatusConfig[deposit.status];
                  return (
                    <div
                      key={deposit.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <ArrowDownLeft className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{deposit.reference_number}</p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(deposit.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          +{parseFloat(deposit.amount).toLocaleString()} {deposit.currency}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {deposits.length > 0 && (
              <div className="mt-4 pt-4 border-t text-center">
                <Link href="/payments/transactions">
                  <Button variant="outline" size="sm">
                    View All Transactions
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
