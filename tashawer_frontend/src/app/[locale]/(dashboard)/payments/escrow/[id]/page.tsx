'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
import { getEscrow, releaseEscrow, refundEscrow, initializePayment } from '@/lib/payments';
import { handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { EscrowDetail, EscrowStatus } from '@/types';
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  XCircle,
  CreditCard,
  DollarSign,
  FileText,
  User,
  Calendar,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const statusConfig: Record<EscrowStatus, { label: string; className: string }> = {
  pending: { label: 'Pending Payment', className: 'text-brand-gray bg-secondary/20' },
  funded: { label: 'Funded', className: 'text-primary bg-primary/10' },
  held: { label: 'Held in Escrow', className: 'text-primary bg-primary/10' },
  released: { label: 'Released', className: 'text-primary bg-primary/10' },
  refunded: { label: 'Refunded', className: 'text-accent bg-accent/10' },
  disputed: { label: 'Disputed', className: 'text-destructive bg-destructive/10' },
  cancelled: { label: 'Cancelled', className: 'text-muted-foreground bg-muted' },
};

export default function EscrowDetailPage() {
  const params = useParams();
  const escrowId = params.id as string;
  const { user } = useAuthStore();

  const [escrow, setEscrow] = useState<EscrowDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [releaseNote, setReleaseNote] = useState('');
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    const loadEscrow = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getEscrow(escrowId);
        setEscrow(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    loadEscrow();
  }, [escrowId]);

  const handlePay = async () => {
    try {
      setActionLoading('pay');
      const { payment_url } = await initializePayment(escrowId);
      window.location.href = payment_url;
    } catch (err) {
      setError(handleApiError(err));
      setActionLoading(null);
    }
  };

  const handleRelease = async () => {
    try {
      setActionLoading('release');
      const updated = await releaseEscrow(escrowId, releaseNote);
      setEscrow(updated);
      setShowReleaseModal(false);
      setReleaseNote('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefund = async () => {
    try {
      setActionLoading('refund');
      const updated = await refundEscrow(escrowId, refundReason);
      setEscrow(updated);
      setShowRefundModal(false);
      setRefundReason('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
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

  if (!escrow) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Escrow not found'}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const isClient = escrow.client.id === user?.id;
  const canPay = isClient && escrow.status === 'pending';
  const canRelease = isClient && escrow.can_release;
  const canRefund = isClient && escrow.can_refund;
  const status = statusConfig[escrow.status];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link href="/payments/escrow">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}>
                  <Shield className="h-3 w-3" />
                  {status.label}
                </span>
                <span className="text-sm text-gray-500 font-mono">
                  {escrow.escrow_reference}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Escrow Details</h1>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canPay && (
              <Button onClick={handlePay} disabled={actionLoading === 'pay'}>
                <CreditCard className="h-4 w-4 mr-2" />
                {actionLoading === 'pay' ? 'Processing...' : 'Pay Now'}
              </Button>
            )}
            {canRelease && (
              <Button onClick={() => setShowReleaseModal(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Release Payment
              </Button>
            )}
            {canRefund && (
              <Button variant="outline" onClick={() => setShowRefundModal(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                Request Refund
              </Button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Release Modal */}
        {showReleaseModal && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Release Payment to Consultant</h3>
              <p className="text-sm text-gray-600 mb-4">
                This will release {parseFloat(escrow.consultant_amount).toLocaleString()} SAR to {escrow.consultant.full_name}.
                This action cannot be undone.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Release Note (Optional)
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  placeholder="Add a note for this release..."
                  value={releaseNote}
                  onChange={(e) => setReleaseNote(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowReleaseModal(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleRelease} disabled={actionLoading === 'release'}>
                  {actionLoading === 'release' ? 'Releasing...' : 'Confirm Release'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Refund Modal */}
        {showRefundModal && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Request Refund</h3>
              <p className="text-sm text-gray-600 mb-4">
                This will refund {parseFloat(escrow.amount).toLocaleString()} SAR back to you.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Refund
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  placeholder="Please provide a reason for the refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowRefundModal(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={handleRefund} disabled={actionLoading === 'refund'}>
                  {actionLoading === 'refund' ? 'Processing...' : 'Confirm Refund'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/projects/${escrow.project.id}`}
                  className="text-lg font-semibold text-primary hover:underline"
                >
                  {escrow.project.title}
                </Link>
                <p className="text-sm text-gray-500 mt-1 capitalize">
                  Status: {escrow.project.status.replace('_', ' ')}
                </p>
              </CardContent>
            </Card>

            {/* Payment Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Escrow Amount</span>
                    <span className="font-semibold">
                      {parseFloat(escrow.amount).toLocaleString()} {escrow.currency}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Platform Fee (10%)</span>
                    <span className="text-destructive">
                      -{parseFloat(escrow.platform_fee).toLocaleString()} {escrow.currency}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold">
                    <span>Consultant Receives</span>
                    <span className="text-primary">
                      {parseFloat(escrow.consultant_amount).toLocaleString()} {escrow.currency}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {(escrow.release_note || escrow.refund_reason) && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {escrow.release_note && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500">Release Note</p>
                      <p className="mt-1">{escrow.release_note}</p>
                    </div>
                  )}
                  {escrow.refund_reason && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Refund Reason</p>
                      <p className="mt-1">{escrow.refund_reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Parties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Parties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Client</p>
                  <p className="font-medium">{escrow.client.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Consultant</p>
                  <p className="font-medium">{escrow.consultant.full_name}</p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Created</dt>
                    <dd>{formatDistanceToNow(new Date(escrow.created_at), { addSuffix: true })}</dd>
                  </div>
                  {escrow.funded_at && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Funded</dt>
                      <dd>{format(new Date(escrow.funded_at), 'MMM d, yyyy')}</dd>
                    </div>
                  )}
                  {escrow.released_at && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Released</dt>
                      <dd>{format(new Date(escrow.released_at), 'MMM d, yyyy')}</dd>
                    </div>
                  )}
                  {escrow.refunded_at && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Refunded</dt>
                      <dd>{format(new Date(escrow.refunded_at), 'MMM d, yyyy')}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
