'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, Spinner, Alert, AlertDescription, Select } from '@/components/ui';
import { ProposalCard } from '@/components/proposals';
import { Pagination } from '@/components/projects';
import { getMyProposals } from '@/lib/proposals';
import { handleApiError } from '@/lib/api';
import type { ProposalListItem } from '@/types';
import { FileText } from 'lucide-react';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export default function MyProposalsPage() {
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total_count: 0,
    total_pages: 0,
  });

  const loadProposals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getMyProposals(page, 10, status || undefined);
      setProposals(response.proposals);
      setPagination(response.pagination);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Proposals</h1>
            <p className="text-gray-600 mt-1">
              Track your submitted proposals and their status
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="w-48">
            <Select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              options={statusOptions}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : proposals.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No proposals yet
                </h3>
                <p className="mt-2 text-gray-500">
                  Browse open projects and submit your first proposal.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Proposal List */
          <div className="space-y-4">
            <div className="grid gap-4">
              {proposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} showProject />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              page={pagination.page}
              totalPages={pagination.total_pages}
              totalCount={pagination.total_count}
              pageSize={pagination.page_size}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
