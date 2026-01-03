'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardContent,
  Spinner,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { getDisputes } from '@/lib/disputes';
import { handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { DisputeListItem, DisputeStatus } from '@/types/dispute';
import { getDisputeStatusColor } from '@/types/dispute';
import {
  AlertTriangle,
  Filter,
  ChevronRight,
  Calendar,
  DollarSign,
  User,
  Clock,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const statusOptions: { value: DisputeStatus | ''; label: string }[] = [
  { value: '', label: 'All Disputes' },
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'awaiting_response', label: 'Awaiting Response' },
  { value: 'in_mediation', label: 'In Mediation' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'escalated', label: 'Escalated' },
];

export default function DisputesPage() {
  const { user } = useAuthStore();
  const [disputes, setDisputes] = useState<DisputeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | ''>('');

  useEffect(() => {
    const loadDisputes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getDisputes(statusFilter || undefined);
        setDisputes(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    loadDisputes();
  }, [statusFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
            <p className="text-sm text-gray-500">
              Track and manage your dispute cases
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter:</span>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DisputeStatus | '')}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <span className="text-sm text-gray-500">
                {disputes.length} dispute{disputes.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && disputes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No disputes found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {statusFilter
                  ? 'Try changing the filter to see more disputes.'
                  : 'No disputes have been filed for your orders.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Disputes List */}
        {!isLoading && disputes.length > 0 && (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <DisputeCard key={dispute.id} dispute={dispute} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

interface DisputeCardProps {
  dispute: DisputeListItem;
  currentUserId?: string;
}

function DisputeCard({ dispute, currentUserId }: DisputeCardProps) {
  const isInitiator = dispute.initiated_by === currentUserId;
  const isClient = dispute.client_name === dispute.initiated_by_name && isInitiator;

  return (
    <Link href={`/disputes/${dispute.dispute_number}`}>
      <Card className="transition-shadow hover:shadow-md cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              {/* Dispute Number & Status */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-sm text-gray-500">
                  #{dispute.dispute_number}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getDisputeStatusColor(
                    dispute.status
                  )}`}
                >
                  {dispute.status_display}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {dispute.reason_display}
                </span>
                {isInitiator && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Initiated by you
                  </span>
                )}
              </div>

              {/* Project Title */}
              <h3 className="text-lg font-semibold text-gray-900">
                {dispute.project_title || `Order #${dispute.order_number}`}
              </h3>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>
                    {isClient ? dispute.consultant_name : dispute.client_name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>SAR {dispute.disputed_amount}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{format(new Date(dispute.created_at), 'MMM d, yyyy')}</span>
                </div>
                {dispute.response_deadline && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <span className="text-orange-600">
                      Due {formatDistanceToNow(new Date(dispute.response_deadline), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <ChevronRight className="h-5 w-5 text-gray-400 mt-2" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
