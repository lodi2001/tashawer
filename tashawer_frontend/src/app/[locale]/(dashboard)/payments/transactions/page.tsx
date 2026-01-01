'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { Pagination } from '@/components/projects';
import { getTransactions, getTransactionSummary } from '@/lib/payments';
import { handleApiError } from '@/lib/api';
import type { TransactionListItem, TransactionSummary } from '@/types';
import { ArrowUpRight, ArrowDownLeft, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusConfig: Record<string, { className: string; icon: typeof CheckCircle }> = {
  completed: { className: 'text-primary bg-primary/10', icon: CheckCircle },
  pending: { className: 'text-brand-gray bg-secondary/20', icon: Clock },
  processing: { className: 'text-primary bg-primary/10', icon: Clock },
  failed: { className: 'text-destructive bg-destructive/10', icon: XCircle },
  cancelled: { className: 'text-muted-foreground bg-muted', icon: XCircle },
  refunded: { className: 'text-accent bg-accent/10', icon: ArrowDownLeft },
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [transactionsData, summaryData] = await Promise.all([
        getTransactions(page),
        getTransactionSummary(),
      ]);
      setTransactions(transactionsData.transactions);
      setPagination(transactionsData.pagination);
      setSummary(summaryData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-600 mt-1">View all your payment transactions</p>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ArrowUpRight className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Paid</p>
                    <p className="text-lg font-semibold">{summary.total_payments} SAR</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ArrowDownLeft className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Received</p>
                    <p className="text-lg font-semibold">{summary.total_received} SAR</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Platform Fees</p>
                    <p className="text-lg font-semibold">{summary.total_platform_fees} SAR</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pending Escrow</p>
                    <p className="text-lg font-semibold">{summary.pending_escrow} SAR</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No transactions yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-gray-500">Reference</th>
                      <th className="pb-3 font-medium text-gray-500">Type</th>
                      <th className="pb-3 font-medium text-gray-500">Project</th>
                      <th className="pb-3 font-medium text-gray-500">Amount</th>
                      <th className="pb-3 font-medium text-gray-500">Status</th>
                      <th className="pb-3 font-medium text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((txn) => {
                      const status = statusConfig[txn.status] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      return (
                        <tr key={txn.id} className="hover:bg-gray-50">
                          <td className="py-3">
                            <Link
                              href={`/payments/transactions/${txn.id}`}
                              className="text-primary hover:underline font-mono text-sm"
                            >
                              {txn.reference_number}
                            </Link>
                          </td>
                          <td className="py-3 capitalize text-sm">
                            {txn.transaction_type.replace('_', ' ')}
                          </td>
                          <td className="py-3 text-sm text-gray-600 max-w-xs truncate">
                            {txn.project_title || '-'}
                          </td>
                          <td className="py-3 font-medium">
                            {parseFloat(txn.amount).toLocaleString()} {txn.currency}
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                              <StatusIcon className="h-3 w-3" />
                              {txn.status}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-500">
                            {formatDistanceToNow(new Date(txn.created_at), { addSuffix: true })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.total_pages}
            totalCount={pagination.total_count}
            pageSize={pagination.page_size}
            onPageChange={setPage}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
