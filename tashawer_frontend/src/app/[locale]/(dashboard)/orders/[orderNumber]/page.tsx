'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
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
import { FileUpload, SelectedFile, formatFileSize } from '@/components/ui/FileUpload';
import { FilePreview, FilePreviewItem } from '@/components/ui/FilePreview';
import {
  getOrder,
  startOrderWork,
  deliverOrder,
  requestOrderRevision,
  completeOrder,
  cancelOrder,
  getOrderStatusColor,
  getOrderStatusLabel,
  getMilestoneStatusColor,
  getMilestoneStatusLabel,
  startMilestone,
  submitMilestone,
  approveMilestone,
  requestMilestoneRevision,
  createMilestone,
  uploadDeliverable,
  deleteDeliverable,
} from '@/lib/orders';
import { handleApiError } from '@/lib/api';
import { createPreviewUrl, revokePreviewUrl } from '@/lib/fileValidation';
import { useAuthStore } from '@/store/authStore';
import type { OrderDetail, MilestoneListItem, Deliverable, MilestoneDetail } from '@/types';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Send,
  FileText,
  Upload,
  Trash2,
  Download,
  Plus,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const { user } = useAuthStore();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState<string | null>(null);
  const [showMilestoneRevisionModal, setShowMilestoneRevisionModal] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getOrder(orderNumber);
      setOrder(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Order Actions
  const handleStartWork = async () => {
    if (!order) return;
    try {
      setActionLoading('start');
      await startOrderWork(order.order_number);
      await loadOrder();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async () => {
    if (!order) return;
    try {
      setActionLoading('deliver');
      await deliverOrder(order.order_number);
      await loadOrder();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    if (!order) return;
    if (!confirm('Are you sure you want to complete this order? This will release the payment to the consultant.')) return;
    try {
      setActionLoading('complete');
      await completeOrder(order.order_number);
      await loadOrder();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevision = async (feedback: string) => {
    if (!order) return;
    try {
      setActionLoading('revision');
      await requestOrderRevision(order.order_number, { feedback });
      await loadOrder();
      setShowRevisionModal(false);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (reason: string) => {
    if (!order) return;
    try {
      setActionLoading('cancel');
      await cancelOrder(order.order_number, { reason });
      await loadOrder();
      setShowCancelModal(false);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  // Milestone Actions
  const handleStartMilestone = async (milestoneId: string) => {
    try {
      setActionLoading(`start-${milestoneId}`);
      await startMilestone(milestoneId);
      await loadOrder();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitMilestone = async (milestoneId: string) => {
    try {
      setActionLoading(`submit-${milestoneId}`);
      await submitMilestone(milestoneId);
      await loadOrder();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    try {
      setActionLoading(`approve-${milestoneId}`);
      await approveMilestone(milestoneId);
      await loadOrder();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleMilestoneRevision = async (milestoneId: string, feedback: string) => {
    try {
      setActionLoading(`revision-${milestoneId}`);
      await requestMilestoneRevision(milestoneId, { feedback });
      await loadOrder();
      setShowMilestoneRevisionModal(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateMilestone = async (data: { title: string; description?: string; due_date?: string }) => {
    if (!order) return;
    try {
      setActionLoading('create-milestone');
      await createMilestone(order.order_number, data);
      await loadOrder();
      setShowMilestoneModal(false);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUploadDeliverable = async (milestoneId: string, file: File, description?: string) => {
    try {
      setActionLoading(`upload-${milestoneId}`);
      await uploadDeliverable(milestoneId, file, description);
      await loadOrder();
      setShowUploadModal(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDeliverable = async (deliverableId: string) => {
    if (!confirm('Are you sure you want to delete this deliverable?')) return;
    try {
      setActionLoading(`delete-${deliverableId}`);
      await deleteDeliverable(deliverableId);
      await loadOrder();
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

  if (!order) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Order not found'}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link href="/orders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-sm text-gray-500">
                  #{order.order_number}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getOrderStatusColor(
                    order.status
                  )}`}
                >
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{order.project.title}</h1>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {order.is_consultant && order.can_start && (
              <Button
                onClick={handleStartWork}
                disabled={actionLoading === 'start'}
              >
                <Play className="h-4 w-4 mr-2" />
                {actionLoading === 'start' ? 'Starting...' : 'Start Work'}
              </Button>
            )}
            {order.is_consultant && order.can_deliver && (
              <Button
                onClick={handleDeliver}
                disabled={actionLoading === 'deliver'}
              >
                <Send className="h-4 w-4 mr-2" />
                {actionLoading === 'deliver' ? 'Delivering...' : 'Deliver Order'}
              </Button>
            )}
            {order.is_client && order.can_complete && (
              <Button
                onClick={handleComplete}
                disabled={actionLoading === 'complete'}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {actionLoading === 'complete' ? 'Completing...' : 'Complete & Pay'}
              </Button>
            )}
            {order.is_client && order.can_request_revision && (
              <Button
                variant="outline"
                onClick={() => setShowRevisionModal(true)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Request Revision
              </Button>
            )}
            {order.can_cancel && (
              <Button
                variant="destructive"
                onClick={() => setShowCancelModal(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
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

        {/* Progress Bar */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Order Progress</span>
              <span className="text-sm text-gray-500">{order.progress_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-brand-blue h-3 rounded-full transition-all"
                style={{ width: `${order.progress_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Milestones */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Milestones ({order.milestones.length})
                </CardTitle>
                {order.is_consultant && order.is_active && (
                  <Button size="sm" onClick={() => setShowMilestoneModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {order.milestones.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No milestones yet. {order.is_consultant && 'Add milestones to track progress.'}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {order.milestones.map((milestone) => (
                      <MilestoneCard
                        key={milestone.id}
                        milestone={milestone}
                        isConsultant={order.is_consultant}
                        isClient={order.is_client}
                        actionLoading={actionLoading}
                        onStart={() => handleStartMilestone(milestone.id)}
                        onSubmit={() => handleSubmitMilestone(milestone.id)}
                        onApprove={() => handleApproveMilestone(milestone.id)}
                        onRequestRevision={() => setShowMilestoneRevisionModal(milestone.id)}
                        onUpload={() => setShowUploadModal(milestone.id)}
                        onDeleteDeliverable={handleDeleteDeliverable}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.activities.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No activity yet.</p>
                ) : (
                  <div className="space-y-4">
                    {order.activities.map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-gray-500" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.user_name && `${activity.user_name} - `}
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="font-medium">SAR {order.total_amount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Expected Delivery</p>
                    <p className="font-medium">
                      {format(new Date(order.expected_delivery_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Revisions</p>
                    <p className="font-medium">
                      {order.revisions_used} / {order.max_revisions} used
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client/Consultant Info */}
            <Card>
              <CardHeader>
                <CardTitle>{order.is_client ? 'Consultant' : 'Client'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-semibold">
                    {(order.is_client ? order.consultant : order.client).full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">
                      {(order.is_client ? order.consultant : order.client).full_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(order.is_client ? order.consultant : order.client).email}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href={`/messages?user=${(order.is_client ? order.consultant : order.client).id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardContent className="pt-6">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Created</dt>
                    <dd>
                      {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                    </dd>
                  </div>
                  {order.started_at && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Started</dt>
                      <dd>
                        {formatDistanceToNow(new Date(order.started_at), { addSuffix: true })}
                      </dd>
                    </div>
                  )}
                  {order.delivered_at && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Delivered</dt>
                      <dd>
                        {formatDistanceToNow(new Date(order.delivered_at), { addSuffix: true })}
                      </dd>
                    </div>
                  )}
                  {order.completed_at && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Completed</dt>
                      <dd>
                        {formatDistanceToNow(new Date(order.completed_at), { addSuffix: true })}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRevisionModal && (
        <RevisionModal
          onClose={() => setShowRevisionModal(false)}
          onSubmit={handleRevision}
          loading={actionLoading === 'revision'}
          revisionsRemaining={order.max_revisions - order.revisions_used}
        />
      )}

      {showCancelModal && (
        <CancelModal
          onClose={() => setShowCancelModal(false)}
          onSubmit={handleCancel}
          loading={actionLoading === 'cancel'}
        />
      )}

      {showMilestoneModal && (
        <MilestoneModal
          onClose={() => setShowMilestoneModal(false)}
          onSubmit={handleCreateMilestone}
          loading={actionLoading === 'create-milestone'}
        />
      )}

      {showUploadModal && (
        <UploadModal
          milestoneId={showUploadModal}
          onClose={() => setShowUploadModal(null)}
          onSubmit={handleUploadDeliverable}
          loading={actionLoading?.startsWith('upload-')}
          isRTL={isRTL}
        />
      )}

      {showMilestoneRevisionModal && (
        <MilestoneRevisionModal
          onClose={() => setShowMilestoneRevisionModal(null)}
          onSubmit={(feedback) => handleMilestoneRevision(showMilestoneRevisionModal, feedback)}
          loading={actionLoading?.startsWith('revision-')}
        />
      )}
    </DashboardLayout>
  );
}

// Milestone Card Component
interface MilestoneCardProps {
  milestone: MilestoneListItem;
  isConsultant: boolean;
  isClient: boolean;
  actionLoading: string | null;
  onStart: () => void;
  onSubmit: () => void;
  onApprove: () => void;
  onRequestRevision: () => void;
  onUpload: () => void;
  onDeleteDeliverable: (id: string) => void;
}

function MilestoneCard({
  milestone,
  isConsultant,
  isClient,
  actionLoading,
  onStart,
  onSubmit,
  onApprove,
  onRequestRevision,
  onUpload,
  onDeleteDeliverable,
}: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-500">#{milestone.sequence}</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getMilestoneStatusColor(
                milestone.status
              )}`}
            >
              {getMilestoneStatusLabel(milestone.status)}
            </span>
          </div>
          <h4 className="font-medium text-gray-900">{milestone.title}</h4>
          {milestone.description && (
            <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
          )}
          {milestone.due_date && (
            <p className="text-xs text-gray-400 mt-2">
              Due: {format(new Date(milestone.due_date), 'MMM d, yyyy')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isConsultant && milestone.status === 'pending' && (
            <Button
              size="sm"
              onClick={onStart}
              disabled={actionLoading === `start-${milestone.id}`}
            >
              <Play className="h-3 w-3 mr-1" />
              Start
            </Button>
          )}
          {isConsultant && milestone.status === 'in_progress' && (
            <>
              <Button size="sm" variant="outline" onClick={onUpload}>
                <Upload className="h-3 w-3 mr-1" />
                Upload
              </Button>
              <Button
                size="sm"
                onClick={onSubmit}
                disabled={actionLoading === `submit-${milestone.id}`}
              >
                <Send className="h-3 w-3 mr-1" />
                Submit
              </Button>
            </>
          )}
          {isClient && milestone.status === 'submitted' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onRequestRevision}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Revision
              </Button>
              <Button
                size="sm"
                onClick={onApprove}
                disabled={actionLoading === `approve-${milestone.id}`}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Approve
              </Button>
            </>
          )}
          {isConsultant && milestone.status === 'revision_requested' && (
            <>
              <Button size="sm" variant="outline" onClick={onUpload}>
                <Upload className="h-3 w-3 mr-1" />
                Upload
              </Button>
              <Button
                size="sm"
                onClick={onSubmit}
                disabled={actionLoading === `submit-${milestone.id}`}
              >
                <Send className="h-3 w-3 mr-1" />
                Re-submit
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Modal Components
function RevisionModal({
  onClose,
  onSubmit,
  loading,
  revisionsRemaining,
}: {
  onClose: () => void;
  onSubmit: (feedback: string) => void;
  loading: boolean;
  revisionsRemaining: number;
}) {
  const [feedback, setFeedback] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Request Revision</h3>
        <p className="text-sm text-gray-500 mb-4">
          You have {revisionsRemaining} revision{revisionsRemaining !== 1 ? 's' : ''} remaining.
        </p>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Describe what changes you need..."
          className="w-full border rounded-md p-3 h-32 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          required
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(feedback)} disabled={loading || !feedback.trim()}>
            {loading ? 'Submitting...' : 'Request Revision'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CancelModal({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4 text-red-600 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Cancel Order
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          This action may trigger a refund process. Please provide a reason for cancellation.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for cancellation..."
          className="w-full border rounded-md p-3 h-32 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          required
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Keep Order
          </Button>
          <Button
            variant="destructive"
            onClick={() => onSubmit(reason)}
            disabled={loading || !reason.trim()}
          >
            {loading ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MilestoneModal({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string; due_date?: string }) => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add Milestone</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-md p-2 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              placeholder="Milestone title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-md p-2 h-24 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border rounded-md p-2 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit({ title, description: description || undefined, due_date: dueDate || undefined })}
            disabled={loading || !title.trim()}
          >
            {loading ? 'Creating...' : 'Create Milestone'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UploadModal({
  milestoneId,
  onClose,
  onSubmit,
  loading,
  isRTL = false,
}: {
  milestoneId: string;
  onClose: () => void;
  onSubmit: (milestoneId: string, file: File, description?: string) => void;
  loading?: boolean;
  isRTL?: boolean;
}) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [description, setDescription] = useState('');

  const t = {
    en: {
      uploadDeliverable: 'Upload Deliverable',
      file: 'File',
      description: 'Description',
      optionalDesc: 'Optional description of the deliverable...',
      cancel: 'Cancel',
      upload: 'Upload',
      uploading: 'Uploading...',
    },
    ar: {
      uploadDeliverable: 'رفع ملف التسليم',
      file: 'الملف',
      description: 'الوصف',
      optionalDesc: 'وصف اختياري للملف المسلم...',
      cancel: 'إلغاء',
      upload: 'رفع',
      uploading: 'جاري الرفع...',
    },
  };

  const text = t[isRTL ? 'ar' : 'en'];

  const handleFilesSelected = useCallback((files: File[]) => {
    // Only allow one file at a time for deliverables
    const file = files[0];
    if (file) {
      const preview = createPreviewUrl(file);
      setSelectedFiles([{
        file,
        preview: preview || undefined,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }]);
    }
  }, []);

  const handleFileRemove = useCallback((fileId: string) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) {
        revokePreviewUrl(file.preview);
      }
      return [];
    });
  }, []);

  const handleSubmit = () => {
    if (selectedFiles.length > 0) {
      onSubmit(milestoneId, selectedFiles[0].file, description || undefined);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <h3 className="text-lg font-semibold mb-4 text-brand-gray">{text.uploadDeliverable}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-2">{text.file} *</label>
            <FileUpload
              onFilesSelected={handleFilesSelected}
              onFileRemove={handleFileRemove}
              selectedFiles={selectedFiles}
              multiple={false}
              maxFiles={1}
              showPreview={true}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1">{text.description}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-brand-yellow/30 rounded-md p-3 h-20 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              placeholder={text.optionalDesc}
              disabled={loading}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {text.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || selectedFiles.length === 0}
          >
            {loading ? text.uploading : text.upload}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MilestoneRevisionModal({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (feedback: string) => void;
  loading?: boolean;
}) {
  const [feedback, setFeedback] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Request Milestone Revision</h3>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Describe what changes you need for this milestone..."
          className="w-full border rounded-md p-3 h-32 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          required
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(feedback)} disabled={loading || !feedback.trim()}>
            {loading ? 'Submitting...' : 'Request Revision'}
          </Button>
        </div>
      </div>
    </div>
  );
}
