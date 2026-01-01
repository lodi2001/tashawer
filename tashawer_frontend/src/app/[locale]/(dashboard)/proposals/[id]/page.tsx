'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
} from '@/components/ui';
import { ProposalStatusBadge } from '@/components/proposals';
import { ProjectStatusBadge } from '@/components/projects';
import {
  getProposal,
  acceptProposal,
  rejectProposal,
  withdrawProposal,
} from '@/lib/proposals';
import { handleApiError } from '@/lib/api';
import type { ProposalDetail } from '@/types';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  User,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const loadProposal = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getProposal(proposalId);
        setProposal(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    loadProposal();
  }, [proposalId]);

  const handleAccept = async () => {
    if (!proposal) return;
    if (!confirm('Are you sure you want to accept this proposal? This will reject all other proposals for this project.')) return;
    try {
      setActionLoading('accept');
      const updated = await acceptProposal(proposal.id);
      setProposal(updated);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!proposal) return;
    try {
      setActionLoading('reject');
      const updated = await rejectProposal(proposal.id, rejectReason);
      setProposal(updated);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdraw = async () => {
    if (!proposal) return;
    if (!confirm('Are you sure you want to withdraw this proposal?')) return;
    try {
      setActionLoading('withdraw');
      const updated = await withdrawProposal(proposal.id);
      setProposal(updated);
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

  if (!proposal) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Proposal not found'}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const isOwner = proposal.is_owner;
  const isProjectOwner = proposal.is_project_owner;
  const canAccept = isProjectOwner && ['submitted', 'under_review'].includes(proposal.status);
  const canReject = isProjectOwner && ['submitted', 'under_review'].includes(proposal.status);
  const canWithdraw = isOwner && proposal.can_withdraw;
  const amount = parseFloat(proposal.proposed_amount);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link href={isOwner ? '/proposals/my' : `/projects/${proposal.project.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ProposalStatusBadge status={proposal.status} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Proposal Details</h1>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canAccept && (
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={actionLoading === 'accept'}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {actionLoading === 'accept' ? 'Accepting...' : 'Accept'}
              </Button>
            )}
            {canReject && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading === 'reject'}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            )}
            {canWithdraw && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleWithdraw}
                disabled={actionLoading === 'withdraw'}
              >
                {actionLoading === 'withdraw' ? 'Withdrawing...' : 'Withdraw'}
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

        {/* Reject Modal */}
        {showRejectModal && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Reject Proposal</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  placeholder="Provide a reason for rejecting this proposal..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  disabled={actionLoading === 'reject'}
                >
                  {actionLoading === 'reject' ? 'Rejecting...' : 'Confirm Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Project</span>
                  <ProjectStatusBadge status={proposal.project.status as any} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/projects/${proposal.project.id}`}
                  className="text-lg font-semibold text-primary hover:underline"
                >
                  {proposal.project.title}
                </Link>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                  <span>{proposal.project.budget_range}</span>
                  <span>Deadline: {proposal.project.deadline}</span>
                </div>
              </CardContent>
            </Card>

            {/* Cover Letter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Cover Letter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {proposal.cover_letter}
                </p>
              </CardContent>
            </Card>

            {/* Rejection Reason */}
            {proposal.rejection_reason && proposal.status === 'rejected' && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-700">Rejection Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{proposal.rejection_reason}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Proposal Info */}
            <Card>
              <CardHeader>
                <CardTitle>Proposal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Proposed Amount</p>
                    <p className="font-semibold text-lg">{amount.toLocaleString()} SAR</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Estimated Duration</p>
                    <p className="font-medium">{proposal.estimated_duration} days</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Delivery Date</p>
                    <p className="font-medium">
                      {format(new Date(proposal.delivery_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consultant Info (for project owners) */}
            {isProjectOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Consultant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {proposal.consultant.full_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="font-medium">{proposal.consultant.full_name}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {proposal.consultant.user_type}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardContent className="pt-6">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Created</dt>
                    <dd>
                      {formatDistanceToNow(new Date(proposal.created_at), {
                        addSuffix: true,
                      })}
                    </dd>
                  </div>
                  {proposal.submitted_at && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Submitted</dt>
                      <dd>
                        {formatDistanceToNow(new Date(proposal.submitted_at), {
                          addSuffix: true,
                        })}
                      </dd>
                    </div>
                  )}
                  {proposal.reviewed_at && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Reviewed</dt>
                      <dd>
                        {formatDistanceToNow(new Date(proposal.reviewed_at), {
                          addSuffix: true,
                        })}
                      </dd>
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
