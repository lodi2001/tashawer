'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Pagination } from '@/components/projects';
import { getInvoices, downloadInvoice } from '@/lib/payments';
import { handleApiError } from '@/lib/api';
import type { InvoiceListItem } from '@/types';
import { FileText, Download, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusConfig: Record<string, { className: string; icon: typeof CheckCircle }> = {
  paid: { className: 'text-primary bg-primary/10', icon: CheckCircle },
  pending: { className: 'text-brand-gray bg-secondary/20', icon: Clock },
  overdue: { className: 'text-destructive bg-destructive/10', icon: XCircle },
  cancelled: { className: 'text-muted-foreground bg-muted', icon: XCircle },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 0,
  });

  const loadInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getInvoices(page);
      setInvoices(response.invoices);
      setPagination(response.pagination);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleDownload = async (id: string, invoiceNumber: string) => {
    try {
      setDownloadingId(id);
      const blob = await downloadInvoice(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">View and download your invoices</p>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Invoice List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No invoices yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-gray-500">Invoice #</th>
                      <th className="pb-3 font-medium text-gray-500">Type</th>
                      <th className="pb-3 font-medium text-gray-500">Amount</th>
                      <th className="pb-3 font-medium text-gray-500">Status</th>
                      <th className="pb-3 font-medium text-gray-500">Date</th>
                      <th className="pb-3 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((invoice) => {
                      const status = statusConfig[invoice.status] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      return (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="py-3">
                            <Link
                              href={`/payments/invoices/${invoice.id}`}
                              className="text-primary hover:underline font-mono text-sm"
                            >
                              {invoice.invoice_number}
                            </Link>
                          </td>
                          <td className="py-3 capitalize text-sm">
                            {invoice.invoice_type.replace('_', ' ')}
                          </td>
                          <td className="py-3 font-medium">
                            {parseFloat(invoice.amount).toLocaleString()} SAR
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                              <StatusIcon className="h-3 w-3" />
                              {invoice.status}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-500">
                            {formatDistanceToNow(new Date(invoice.created_at), { addSuffix: true })}
                          </td>
                          <td className="py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(invoice.id, invoice.invoice_number)}
                              disabled={downloadingId === invoice.id}
                            >
                              {downloadingId === invoice.id ? (
                                <Spinner size="sm" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
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
