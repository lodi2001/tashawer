'use client';

import { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  getWallet,
  getBankAccounts,
  getWithdrawals,
  createWithdrawal,
  createBankAccount,
  cancelWithdrawal,
} from '@/lib/payments';
import { handleApiError } from '@/lib/api';
import type { Wallet, BankAccount, WithdrawalListItem, WithdrawalStatus } from '@/types';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  Building2,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const withdrawalStatusConfig: Record<WithdrawalStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', className: 'text-brand-gray bg-secondary/20', icon: <Clock className="h-3 w-3" /> },
  approved: { label: 'Approved', className: 'text-primary bg-primary/10', icon: <CheckCircle className="h-3 w-3" /> },
  processing: { label: 'Processing', className: 'text-primary bg-primary/10', icon: <RefreshCw className="h-3 w-3" /> },
  completed: { label: 'Completed', className: 'text-primary bg-primary/10', icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: 'Rejected', className: 'text-destructive bg-destructive/10', icon: <XCircle className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', className: 'text-muted-foreground bg-muted', icon: <XCircle className="h-3 w-3" /> },
};

const saudiBanks = [
  { value: 'Al Rajhi Bank', label: 'Al Rajhi Bank' },
  { value: 'Saudi National Bank (SNB)', label: 'Saudi National Bank (SNB)' },
  { value: 'Riyad Bank', label: 'Riyad Bank' },
  { value: 'Banque Saudi Fransi', label: 'Banque Saudi Fransi' },
  { value: 'Arab National Bank', label: 'Arab National Bank' },
  { value: 'Bank AlBilad', label: 'Bank AlBilad' },
  { value: 'Alinma Bank', label: 'Alinma Bank' },
  { value: 'Bank AlJazira', label: 'Bank AlJazira' },
  { value: 'Saudi Investment Bank', label: 'Saudi Investment Bank' },
  { value: 'Gulf International Bank', label: 'Gulf International Bank' },
];

export default function WithdrawalsPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Withdrawal form
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [withdrawalNote, setWithdrawalNote] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);

  // Add bank account form
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [iban, setIban] = useState('');
  const [bankFormLoading, setBankFormLoading] = useState(false);
  const [bankFormError, setBankFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [walletData, bankAccountsData, withdrawalsData] = await Promise.all([
        getWallet(),
        getBankAccounts(),
        getWithdrawals(1, 20),
      ]);
      setWallet(walletData);
      setBankAccounts(bankAccountsData);
      setWithdrawals(withdrawalsData.results || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBankAccount = async () => {
    if (!bankName || !accountHolderName || !iban) {
      setBankFormError('Please fill in all required fields');
      return;
    }

    // Validate IBAN format (SA + 22 digits)
    const ibanClean = iban.replace(/\s/g, '').toUpperCase();
    if (!/^SA\d{22}$/.test(ibanClean)) {
      setBankFormError('Please enter a valid Saudi IBAN (SA followed by 22 digits)');
      return;
    }

    try {
      setBankFormLoading(true);
      setBankFormError(null);
      const newAccount = await createBankAccount({
        bank_name: bankName,
        account_holder_name: accountHolderName,
        iban: ibanClean,
      });
      setBankAccounts([...bankAccounts, newAccount]);
      setShowBankForm(false);
      setBankName('');
      setAccountHolderName('');
      setIban('');
    } catch (err) {
      setBankFormError(handleApiError(err));
    } finally {
      setBankFormLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount < 100) {
      setWithdrawalError('Minimum withdrawal amount is 100 SAR');
      return;
    }

    if (!selectedBankAccount) {
      setWithdrawalError('Please select a bank account');
      return;
    }

    if (wallet && amount > parseFloat(wallet.balance)) {
      setWithdrawalError(`Insufficient balance. Available: ${wallet.balance} SAR`);
      return;
    }

    try {
      setWithdrawalLoading(true);
      setWithdrawalError(null);
      await createWithdrawal({
        amount,
        bank_account_id: selectedBankAccount,
        note: withdrawalNote,
      });
      setShowWithdrawalForm(false);
      setWithdrawalAmount('');
      setSelectedBankAccount('');
      setWithdrawalNote('');
      loadData(); // Refresh data
    } catch (err) {
      setWithdrawalError(handleApiError(err));
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const handleCancelWithdrawal = async (referenceNumber: string) => {
    if (!confirm('Are you sure you want to cancel this withdrawal request?')) {
      return;
    }

    try {
      await cancelWithdrawal(referenceNumber);
      loadData();
    } catch (err) {
      setError(handleApiError(err));
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

  const verifiedAccounts = bankAccounts.filter((acc) => acc.is_verified);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>
            <p className="text-sm text-gray-500">Withdraw funds to your bank account</p>
          </div>
          <Button
            onClick={() => setShowWithdrawalForm(true)}
            disabled={verifiedAccounts.length === 0 || (wallet ? parseFloat(wallet.balance) < 100 : true)}
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Withdraw Funds
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Balance Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Available for Withdrawal</p>
                <p className="text-3xl font-bold text-gray-900">
                  {wallet ? parseFloat(wallet.balance).toLocaleString() : '0'}{' '}
                  <span className="text-lg font-normal text-gray-500">SAR</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">Minimum withdrawal: 100 SAR</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <WalletIcon className="h-7 w-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        {showWithdrawalForm && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5" />
                Withdraw Funds
              </h3>

              {withdrawalError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{withdrawalError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (SAR)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="100"
                    max={wallet ? parseFloat(wallet.balance) : 50000}
                    placeholder="Enter amount (min: 100 SAR)"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="bank_account">Bank Account</Label>
                  <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {verifiedAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.bank_name} - {account.masked_iban}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Input
                    id="note"
                    placeholder="Add a note..."
                    value={withdrawalNote}
                    onChange={(e) => setWithdrawalNote(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowWithdrawalForm(false);
                      setWithdrawalAmount('');
                      setSelectedBankAccount('');
                      setWithdrawalNote('');
                      setWithdrawalError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleWithdrawal} disabled={withdrawalLoading}>
                    {withdrawalLoading ? 'Processing...' : 'Submit Withdrawal'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bank Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bank Accounts
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowBankForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Account
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add Bank Form */}
            {showBankForm && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-4">Add Bank Account</h4>

                {bankFormError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{bankFormError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Select value={bankName} onValueChange={setBankName}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {saudiBanks.map((bank) => (
                          <SelectItem key={bank.value} value={bank.value}>
                            {bank.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="account_holder">Account Holder Name</Label>
                    <Input
                      id="account_holder"
                      placeholder="As it appears on your bank account"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      placeholder="SA0000000000000000000000"
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Saudi IBAN: SA followed by 22 digits</p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowBankForm(false);
                        setBankFormError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddBankAccount} disabled={bankFormLoading}>
                      {bankFormLoading ? 'Adding...' : 'Add Account'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {bankAccounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No bank accounts added</p>
                <p className="text-sm mt-1">Add a bank account to withdraw funds</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bankAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">{account.bank_name}</p>
                        <p className="text-sm text-gray-500">{account.masked_iban}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-primary bg-primary/10">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-brand-gray bg-secondary/20">
                          <AlertCircle className="h-3 w-3" />
                          Pending Verification
                        </span>
                      )}
                      {account.is_primary && (
                        <span className="text-xs text-gray-500">Primary</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              Withdrawal History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ArrowUpRight className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No withdrawals yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => {
                  const statusInfo = withdrawalStatusConfig[withdrawal.status];
                  return (
                    <div
                      key={withdrawal.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                          <ArrowUpRight className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium">{withdrawal.reference_number}</p>
                          <p className="text-xs text-gray-500">
                            {withdrawal.bank_account_display} -{' '}
                            {formatDistanceToNow(new Date(withdrawal.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-accent">
                            -{parseFloat(withdrawal.amount).toLocaleString()} {withdrawal.currency}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </div>
                        {withdrawal.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelWithdrawal(withdrawal.reference_number)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
