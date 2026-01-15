'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Search,
  Filter,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  User,
  CreditCard,
  Shield,
  Clock,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  getAdminWithdrawals,
  verifyBankAccount,
  type Withdrawal,
  type BankAccount,
} from '@/lib/withdrawals';

interface BankAccountWithUser extends BankAccount {
  user_email: string;
  user_name: string;
}

export default function AdminBankAccountsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // State
  const [bankAccounts, setBankAccounts] = useState<BankAccountWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified'>('all');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch bank accounts from withdrawals
  const fetchBankAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all withdrawals to extract unique bank accounts
      const response = await getAdminWithdrawals({ page_size: 250 });

      // Extract unique bank accounts with user info
      const accountMap = new Map<string, BankAccountWithUser>();

      response.results.forEach((withdrawal: Withdrawal) => {
        if (withdrawal.bank_account && !accountMap.has(withdrawal.bank_account.id)) {
          accountMap.set(withdrawal.bank_account.id, {
            ...withdrawal.bank_account,
            user_email: withdrawal.user_email,
            user_name: withdrawal.user_name,
          });
        }
      });

      setBankAccounts(Array.from(accountMap.values()));
    } catch (err) {
      console.error('Failed to fetch bank accounts:', err);
      setError(isRTL ? 'فشل في تحميل الحسابات البنكية' : 'Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  // Handle verify bank account
  const handleVerify = async (bankAccountId: string) => {
    setVerifyingId(bankAccountId);
    setError(null);
    setSuccessMessage(null);
    try {
      await verifyBankAccount(bankAccountId);
      setSuccessMessage(isRTL ? 'تم التحقق من الحساب البنكي بنجاح' : 'Bank account verified successfully');
      await fetchBankAccounts();
    } catch (err) {
      console.error('Failed to verify bank account:', err);
      setError(isRTL ? 'فشل في التحقق من الحساب البنكي' : 'Failed to verify bank account');
    } finally {
      setVerifyingId(null);
    }
  };

  // Filter bank accounts
  const filteredAccounts = bankAccounts.filter((account) => {
    // Status filter
    if (filterStatus === 'verified' && !account.is_verified) return false;
    if (filterStatus === 'unverified' && account.is_verified) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        account.account_holder_name.toLowerCase().includes(query) ||
        account.iban.toLowerCase().includes(query) ||
        account.bank_name.toLowerCase().includes(query) ||
        account.user_name.toLowerCase().includes(query) ||
        account.user_email.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Count stats
  const verifiedCount = bankAccounts.filter((a) => a.is_verified).length;
  const unverifiedCount = bankAccounts.filter((a) => !a.is_verified).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isRTL ? 'الحسابات البنكية' : 'Bank Accounts'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isRTL
              ? 'إدارة والتحقق من الحسابات البنكية للاستشاريين'
              : 'Manage and verify consultant bank accounts'}
          </p>
        </div>
        <button
          onClick={fetchBankAccounts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {isRTL ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{isRTL ? 'إجمالي الحسابات' : 'Total Accounts'}</p>
              <p className="text-2xl font-semibold text-gray-900">{bankAccounts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{isRTL ? 'حسابات موثقة' : 'Verified'}</p>
              <p className="text-2xl font-semibold text-green-600">{verifiedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{isRTL ? 'في انتظار التحقق' : 'Pending Verification'}</p>
              <p className="text-2xl font-semibold text-orange-600">{unverifiedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'البحث بالاسم أو IBAN أو البنك...' : 'Search by name, IBAN, or bank...'}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">{isRTL ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="verified">{isRTL ? 'موثق' : 'Verified'}</option>
                <option value="unverified">{isRTL ? 'غير موثق' : 'Unverified'}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Bank Accounts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Building2 className="h-12 w-12 mb-4 text-gray-300" />
            <p>{isRTL ? 'لا توجد حسابات بنكية' : 'No bank accounts found'}</p>
            {bankAccounts.length === 0 && (
              <p className="text-sm mt-2">
                {isRTL
                  ? 'الحسابات البنكية تظهر عند إنشاء طلبات السحب'
                  : 'Bank accounts appear when withdrawal requests are created'}
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isRTL ? 'صاحب الحساب' : 'Account Holder'}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isRTL ? 'البنك' : 'Bank'}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IBAN
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isRTL ? 'المستخدم' : 'User'}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isRTL ? 'الحالة' : 'Status'}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isRTL ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {account.account_holder_name}
                          </p>
                          {account.is_primary && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {isRTL ? 'أساسي' : 'Primary'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {isRTL ? account.bank_name_ar || account.bank_name : account.bank_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-gray-900">
                        {account.masked_iban || account.iban}
                      </span>
                      {account.swift_code && (
                        <p className="text-xs text-gray-500">SWIFT: {account.swift_code}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{account.user_name}</p>
                        <p className="text-xs text-gray-500">{account.user_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {account.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Shield className="h-3 w-3" />
                          {isRTL ? 'موثق' : 'Verified'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <AlertCircle className="h-3 w-3" />
                          {isRTL ? 'غير موثق' : 'Unverified'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!account.is_verified && (
                        <button
                          onClick={() => handleVerify(account.id)}
                          disabled={verifyingId === account.id}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {verifyingId === account.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          {isRTL ? 'تحقق' : 'Verify'}
                        </button>
                      )}
                      {account.is_verified && (
                        <span className="text-sm text-gray-500">
                          {isRTL ? 'تم التحقق' : 'Already verified'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">
              {isRTL ? 'ملاحظة' : 'Note'}
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              {isRTL
                ? 'يتم عرض الحسابات البنكية المرتبطة بطلبات السحب فقط. للتحقق من حساب بنكي، تأكد من صحة المعلومات المقدمة قبل الموافقة.'
                : 'Only bank accounts associated with withdrawal requests are displayed. To verify a bank account, ensure the provided information is correct before approving.'}
            </p>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
