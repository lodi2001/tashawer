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
import { getEscrows } from '@/lib/payments';
import { handleApiError } from '@/lib/api';
import type { EscrowListItem, EscrowStatus } from '@/types';
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusConfig: Record<EscrowStatus, { label: string; className: string; icon: typeof Shield }> = {
  pending: { label: 'Pending Payment', className: 'text-brand-gray bg-secondary/20', icon: Clock },
  funded: { label: 'Funded', className: 'text-primary bg-primary/10', icon: Shield },
  held: { label: 'Held in Escrow', className: 'text-primary bg-primary/10', icon: Shield },
  released: { label: 'Released', className: 'text-primary bg-primary/10', icon: CheckCircle },
  refunded: { label: 'Refunded', className: 'text-accent bg-accent/10', icon: XCircle },
  disputed: { label: 'Disputed', className: 'text-destructive bg-destructive/10', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', className: 'text-muted-foreground bg-muted', icon: XCircle },
};

export default function EscrowListPage() {
  const [escrows, setEscrows] = useState<EscrowListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 0,
  });

  const loadEscrows = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getEscrows(page);
      setEscrows(response.escrows);
      setPagination(response.pagination);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadEscrows();
  }, [loadEscrows]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escrow Payments</h1>
          <p className="text-gray-600 mt-1">
            Secure payments held until project completion
          </p>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Escrow List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              All Escrows
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : escrows.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Shield className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No escrow payments yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {escrows.map((escrow) => {
                  const status = statusConfig[escrow.status];
                  const StatusIcon = status.icon;
                  return (
                    <Link
                      key={escrow.id}
                      href={`/payments/escrow/${escrow.id}`}
                      className="block"
                    >
                      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </span>
                              <span className="text-xs text-gray-500 font-mono">
                                {escrow.escrow_reference}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 truncate">
                              {escrow.project_title}
                            </h3>
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                              <span>Client: {escrow.client_name}</span>
                              <span>Consultant: {escrow.consultant_name}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-semibold text-gray-900">
                              {parseFloat(escrow.amount).toLocaleString()} SAR
                            </p>
                            <p className="text-xs text-gray-500">
                              Fee: {parseFloat(escrow.platform_fee).toLocaleString()} SAR
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(escrow.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
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
