'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Alert,
  AlertDescription,
  Spinner,
} from '@/components/ui';
import {
  getAdminWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  processWithdrawal,
  completeWithdrawal,
  type Withdrawal,
  type WithdrawalStatus,
} from '@/lib/withdrawals';
import { handleApiError } from '@/lib/api';
import {
  CreditCard,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowRight,
  Banknote,
  X,
} from 'lucide-react';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [rejectModal, setRejectModal] = useState<{ open: boolean; referenceNumber: string }>({
    open: false,
    referenceNumber: '',
  });
  const [rejectReason, setRejectReason] = useState('');
  const [completeModal, setCompleteModal] = useState<{ open: boolean; referenceNumber: string }>({
    open: false,
    referenceNumber: '',
  });
  const [bankReference, setBankReference] = useState('');

  const pageSize = 10;

  useEffect(() => {
    loadWithdrawals();
  }, [page, statusFilter]);

  const loadWithdrawals = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filters: { status?: WithdrawalStatus; search?: string; page?: number; page_size?: number } = {
        page,
        page_size: pageSize,
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter as WithdrawalStatus;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await getAdminWithdrawals(filters);
      setWithdrawals(response.results);
      setTotalCount(response.count);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadWithdrawals();
  };

  const handleApprove = async (referenceNumber: string) => {
    try {
      setActionLoading(referenceNumber);
      await approveWithdrawal(referenceNumber);
      setSuccess('Withdrawal approved successfully');
      setTimeout(() => setSuccess(null), 3000);
      loadWithdrawals();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    try {
      setActionLoading(rejectModal.referenceNumber);
      await rejectWithdrawal(rejectModal.referenceNumber, rejectReason);
      setSuccess('Withdrawal rejected');
      setTimeout(() => setSuccess(null), 3000);
      setRejectModal({ open: false, referenceNumber: '' });
      setRejectReason('');
      loadWithdrawals();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcess = async (referenceNumber: string) => {
    try {
      setActionLoading(referenceNumber);
      await processWithdrawal(referenceNumber);
      setSuccess('Withdrawal is now being processed');
      setTimeout(() => setSuccess(null), 3000);
      loadWithdrawals();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    if (!bankReference.trim()) {
      setError('Please provide the bank reference number');
      return;
    }
    try {
      setActionLoading(completeModal.referenceNumber);
      await completeWithdrawal(completeModal.referenceNumber, bankReference);
      setSuccess('Withdrawal completed successfully');
      setTimeout(() => setSuccess(null), 3000);
      setCompleteModal({ open: false, referenceNumber: '' });
      setBankReference('');
      loadWithdrawals();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
    const statusConfig: Record<WithdrawalStatus, { icon: React.ElementType; className: string; label: string }> = {
      pending: {
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-700',
        label: 'Pending',
      },
      approved: {
        icon: CheckCircle,
        className: 'bg-blue-100 text-blue-700',
        label: 'Approved',
      },
      processing: {
        icon: ArrowRight,
        className: 'bg-purple-100 text-purple-700',
        label: 'Processing',
      },
      completed: {
        icon: CheckCircle,
        className: 'bg-green-100 text-green-700',
        label: 'Completed',
      },
      rejected: {
        icon: XCircle,
        className: 'bg-red-100 text-red-700',
        label: 'Rejected',
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(parseFloat(amount));
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              Withdrawals Management
            </h1>
            <p className="text-muted-foreground">
              Manage consultant withdrawal requests
            </p>
          </div>
          <Button variant="outline" onClick={loadWithdrawals}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="success">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by reference number or consultant..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                className="px-3 py-2 border rounded-md"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
              <Button type="submit">Search</Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdrawals Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No withdrawal requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Reference</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Consultant</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Bank</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm">{withdrawal.reference_number}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{withdrawal.user_name}</p>
                            <p className="text-sm text-muted-foreground">{withdrawal.user_email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{formatCurrency(withdrawal.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              Fee: {formatCurrency(withdrawal.fee)} | Net: {formatCurrency(withdrawal.net_amount)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <p>{withdrawal.bank_account?.bank_name}</p>
                            <p className="text-muted-foreground font-mono">
                              {withdrawal.bank_account?.masked_iban}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(withdrawal.status)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {withdrawal.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleApprove(withdrawal.reference_number)}
                                  disabled={actionLoading === withdrawal.reference_number}
                                >
                                  {actionLoading === withdrawal.reference_number ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => setRejectModal({ open: true, referenceNumber: withdrawal.reference_number })}
                                  disabled={actionLoading === withdrawal.reference_number}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {withdrawal.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProcess(withdrawal.reference_number)}
                                disabled={actionLoading === withdrawal.reference_number}
                              >
                                {actionLoading === withdrawal.reference_number ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <>
                                    <ArrowRight className="h-4 w-4 mr-1" />
                                    Process
                                  </>
                                )}
                              </Button>
                            )}
                            {withdrawal.status === 'processing' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => setCompleteModal({ open: true, referenceNumber: withdrawal.reference_number })}
                                disabled={actionLoading === withdrawal.reference_number}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            )}
                            {withdrawal.status === 'completed' && withdrawal.bank_reference && (
                              <span className="text-xs text-muted-foreground">
                                Ref: {withdrawal.bank_reference}
                              </span>
                            )}
                            {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
                              <span className="text-xs text-red-600 max-w-[150px] truncate" title={withdrawal.rejection_reason}>
                                {withdrawal.rejection_reason}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} withdrawals
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reject Withdrawal</h3>
              <button
                onClick={() => {
                  setRejectModal({ open: false, referenceNumber: '' });
                  setRejectReason('');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rejection Reason</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Please provide a reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectModal({ open: false, referenceNumber: '' });
                    setRejectReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={actionLoading === rejectModal.referenceNumber}
                >
                  {actionLoading === rejectModal.referenceNumber ? (
                    <Spinner size="sm" />
                  ) : (
                    'Reject Withdrawal'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {completeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Complete Withdrawal</h3>
              <button
                onClick={() => {
                  setCompleteModal({ open: false, referenceNumber: '' });
                  setBankReference('');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bank Reference Number</label>
                <Input
                  placeholder="Enter the bank transaction reference..."
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This is the reference number from the bank transfer
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCompleteModal({ open: false, referenceNumber: '' });
                    setBankReference('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={actionLoading === completeModal.referenceNumber}
                >
                  {actionLoading === completeModal.referenceNumber ? (
                    <Spinner size="sm" />
                  ) : (
                    'Complete Withdrawal'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
