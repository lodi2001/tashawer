'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Building2,
  FileText,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserPlus,
  Scale,
  Send,
  RefreshCw,
  Download,
  ExternalLink,
  StickyNote,
  Gavel,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  getAdminDispute,
  assignDisputeAdmin,
  resolveDispute,
  escalateDispute,
  requestDisputeResponse,
  closeDispute,
  getInternalNotes,
  addInternalNote,
} from '@/lib/disputes';
import type {
  DisputeDetail,
  DisputeMessage,
  DisputeResolutionData,
  ResolutionType,
  DisputeStatus,
} from '@/types/dispute';
import { getDisputeStatusColor, RESOLUTION_TYPE_LABELS, RESOLUTION_TYPE_LABELS_AR } from '@/types/dispute';

export default function AdminDisputeDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const disputeNumber = params.disputeNumber as string;
  const isRTL = locale === 'ar';

  // State
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [internalNotes, setInternalNotes] = useState<DisputeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showRequestResponseModal, setShowRequestResponseModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Form states
  const [resolutionForm, setResolutionForm] = useState<DisputeResolutionData>({
    resolution_type: 'mutual_agreement',
    resolution_amount: '',
    resolution_notes: '',
  });
  const [escalateReason, setEscalateReason] = useState('');
  const [requestParty, setRequestParty] = useState<'client' | 'consultant'>('client');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestDeadlineDays, setRequestDeadlineDays] = useState(3);
  const [closeReason, setCloseReason] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Active tab
  const [activeTab, setActiveTab] = useState<'details' | 'messages' | 'evidence' | 'timeline' | 'notes'>('details');

  // Fetch dispute
  const fetchDispute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminDispute(disputeNumber);
      setDispute(data);
      // Also fetch internal notes
      const notes = await getInternalNotes(disputeNumber);
      setInternalNotes(notes);
    } catch (err) {
      console.error('Failed to fetch dispute:', err);
      setError(isRTL ? 'فشل في تحميل النزاع' : 'Failed to load dispute');
    } finally {
      setLoading(false);
    }
  }, [disputeNumber, isRTL]);

  useEffect(() => {
    fetchDispute();
  }, [fetchDispute]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format amount
  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(num);
  };

  // Handle assign to me
  const handleAssign = async () => {
    setActionLoading('assign');
    try {
      await assignDisputeAdmin(disputeNumber);
      await fetchDispute();
    } catch (err) {
      console.error('Failed to assign dispute:', err);
      setError(isRTL ? 'فشل في تعيين النزاع' : 'Failed to assign dispute');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle resolve
  const handleResolve = async () => {
    setActionLoading('resolve');
    try {
      await resolveDispute(disputeNumber, resolutionForm);
      setShowResolveModal(false);
      await fetchDispute();
    } catch (err) {
      console.error('Failed to resolve dispute:', err);
      setError(isRTL ? 'فشل في حل النزاع' : 'Failed to resolve dispute');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle escalate
  const handleEscalate = async () => {
    setActionLoading('escalate');
    try {
      await escalateDispute(disputeNumber, escalateReason);
      setShowEscalateModal(false);
      await fetchDispute();
    } catch (err) {
      console.error('Failed to escalate dispute:', err);
      setError(isRTL ? 'فشل في تصعيد النزاع' : 'Failed to escalate dispute');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle request response
  const handleRequestResponse = async () => {
    setActionLoading('request');
    try {
      await requestDisputeResponse(disputeNumber, requestParty, requestMessage, requestDeadlineDays);
      setShowRequestResponseModal(false);
      await fetchDispute();
    } catch (err) {
      console.error('Failed to request response:', err);
      setError(isRTL ? 'فشل في طلب الرد' : 'Failed to request response');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle close
  const handleClose = async () => {
    setActionLoading('close');
    try {
      await closeDispute(disputeNumber, closeReason);
      setShowCloseModal(false);
      await fetchDispute();
    } catch (err) {
      console.error('Failed to close dispute:', err);
      setError(isRTL ? 'فشل في إغلاق النزاع' : 'Failed to close dispute');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setActionLoading('note');
    try {
      await addInternalNote(disputeNumber, noteContent);
      setNoteContent('');
      setShowNoteModal(false);
      const notes = await getInternalNotes(disputeNumber);
      setInternalNotes(notes);
    } catch (err) {
      console.error('Failed to add note:', err);
      setError(isRTL ? 'فشل في إضافة الملاحظة' : 'Failed to add note');
    } finally {
      setActionLoading(null);
    }
  };

  // Resolution type options
  const resolutionTypes: { value: ResolutionType; label: string }[] = [
    { value: 'full_refund_client', label: isRTL ? RESOLUTION_TYPE_LABELS_AR.full_refund_client : RESOLUTION_TYPE_LABELS.full_refund_client },
    { value: 'partial_refund_client', label: isRTL ? RESOLUTION_TYPE_LABELS_AR.partial_refund_client : RESOLUTION_TYPE_LABELS.partial_refund_client },
    { value: 'release_to_consultant', label: isRTL ? RESOLUTION_TYPE_LABELS_AR.release_to_consultant : RESOLUTION_TYPE_LABELS.release_to_consultant },
    { value: 'partial_release_consultant', label: isRTL ? RESOLUTION_TYPE_LABELS_AR.partial_release_consultant : RESOLUTION_TYPE_LABELS.partial_release_consultant },
    { value: 'mutual_agreement', label: isRTL ? RESOLUTION_TYPE_LABELS_AR.mutual_agreement : RESOLUTION_TYPE_LABELS.mutual_agreement },
    { value: 'no_action', label: isRTL ? RESOLUTION_TYPE_LABELS_AR.no_action : RESOLUTION_TYPE_LABELS.no_action },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !dispute) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-gray-600">{error || (isRTL ? 'النزاع غير موجود' : 'Dispute not found')}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 text-teal-600 hover:underline"
          >
            {isRTL ? 'العودة' : 'Go back'}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const isOpen = dispute.status === 'open' || dispute.status === 'under_review' || dispute.status === 'awaiting_response' || dispute.status === 'in_mediation';

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isRTL ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isRTL ? 'النزاع' : 'Dispute'} #{dispute.dispute_number}
            </h1>
            <p className="text-sm text-gray-500">
              {isRTL ? 'الطلب:' : 'Order:'} {dispute.order.order_number}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDisputeStatusColor(
            dispute.status as DisputeStatus
          )}`}
        >
          {dispute.status_display}
        </span>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px overflow-x-auto">
                {[
                  { id: 'details', label: isRTL ? 'التفاصيل' : 'Details', icon: FileText },
                  { id: 'messages', label: isRTL ? 'الرسائل' : 'Messages', icon: MessageSquare },
                  { id: 'evidence', label: isRTL ? 'الأدلة' : 'Evidence', icon: FileText },
                  { id: 'timeline', label: isRTL ? 'الجدول الزمني' : 'Timeline', icon: Clock },
                  { id: 'notes', label: isRTL ? 'ملاحظات داخلية' : 'Internal Notes', icon: StickyNote },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Dispute Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {isRTL ? 'معلومات النزاع' : 'Dispute Information'}
                    </h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm text-gray-500">{isRTL ? 'السبب' : 'Reason'}</dt>
                        <dd className="text-sm font-medium text-gray-900">{dispute.reason_display}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">{isRTL ? 'المبلغ المتنازع عليه' : 'Disputed Amount'}</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatAmount(dispute.disputed_amount)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">{isRTL ? 'المبادر' : 'Initiated By'}</dt>
                        <dd className="text-sm font-medium text-gray-900">{dispute.initiated_by_info.full_name}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">{isRTL ? 'تاريخ الإنشاء' : 'Created At'}</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatDate(dispute.created_at)}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">{isRTL ? 'الوصف' : 'Description'}</h4>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {dispute.description}
                    </p>
                  </div>

                  {/* Desired Resolution */}
                  {dispute.desired_resolution && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        {isRTL ? 'الحل المطلوب' : 'Desired Resolution'}
                      </h4>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                        {dispute.desired_resolution}
                      </p>
                    </div>
                  )}

                  {/* Resolution Info (if resolved) */}
                  {dispute.resolution_type && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-800 mb-2">
                        {isRTL ? 'معلومات الحل' : 'Resolution Information'}
                      </h4>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm text-green-600">{isRTL ? 'نوع الحل' : 'Resolution Type'}</dt>
                          <dd className="text-sm font-medium text-green-900">{dispute.resolution_type_display}</dd>
                        </div>
                        {dispute.resolution_amount && (
                          <div>
                            <dt className="text-sm text-green-600">{isRTL ? 'المبلغ' : 'Amount'}</dt>
                            <dd className="text-sm font-medium text-green-900">{formatAmount(dispute.resolution_amount)}</dd>
                          </div>
                        )}
                        {dispute.resolved_by_info && (
                          <div>
                            <dt className="text-sm text-green-600">{isRTL ? 'تم الحل بواسطة' : 'Resolved By'}</dt>
                            <dd className="text-sm font-medium text-green-900">{dispute.resolved_by_info.full_name}</dd>
                          </div>
                        )}
                        {dispute.resolved_at && (
                          <div>
                            <dt className="text-sm text-green-600">{isRTL ? 'تاريخ الحل' : 'Resolved At'}</dt>
                            <dd className="text-sm font-medium text-green-900">{formatDate(dispute.resolved_at)}</dd>
                          </div>
                        )}
                      </dl>
                      {dispute.resolution_notes && (
                        <div className="mt-4">
                          <dt className="text-sm text-green-600 mb-1">{isRTL ? 'ملاحظات الحل' : 'Resolution Notes'}</dt>
                          <dd className="text-sm text-green-900 whitespace-pre-wrap">{dispute.resolution_notes}</dd>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div className="space-y-4">
                  {dispute.messages.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {isRTL ? 'لا توجد رسائل' : 'No messages yet'}
                    </p>
                  ) : (
                    dispute.messages
                      .filter((m) => !m.is_internal_note)
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 rounded-lg ${
                            message.is_admin_message
                              ? 'bg-teal-50 border border-teal-200'
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-gray-900">
                              {message.sender_name}
                              <span className="ml-2 text-xs text-gray-500">
                                ({message.sender_role === 'admin'
                                  ? isRTL ? 'مشرف' : 'Admin'
                                  : message.sender_role === 'client'
                                  ? isRTL ? 'عميل' : 'Client'
                                  : isRTL ? 'استشاري' : 'Consultant'})
                              </span>
                            </span>
                            <span className="text-xs text-gray-500">{formatDate(message.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.message}</p>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* Evidence Tab */}
              {activeTab === 'evidence' && (
                <div className="space-y-4">
                  {dispute.evidence.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {isRTL ? 'لا توجد أدلة' : 'No evidence uploaded'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {dispute.evidence.map((evidence) => (
                        <div
                          key={evidence.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                        >
                          <div className="flex items-start gap-3">
                            <FileText className="h-8 w-8 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {evidence.original_filename}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(evidence.file_size / 1024).toFixed(1)} KB
                              </p>
                              {evidence.description && (
                                <p className="text-xs text-gray-600 mt-1">{evidence.description}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {isRTL ? 'رفع بواسطة:' : 'Uploaded by:'} {evidence.uploaded_by_name}
                              </p>
                            </div>
                            <a
                              href={evidence.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-teal-600"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  {dispute.activities.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {isRTL ? 'لا يوجد نشاط' : 'No activity yet'}
                    </p>
                  ) : (
                    <div className="relative">
                      <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200"></div>
                      {dispute.activities.map((activity, index) => (
                        <div key={activity.id} className="relative flex gap-4 pb-4">
                          <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white border-2 border-gray-200 rounded-full">
                            <Clock className="h-4 w-4 text-gray-400" />
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm text-gray-900">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(activity.created_at)}
                              {activity.user_name && ` - ${activity.user_name}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Internal Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowNoteModal(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                    >
                      <StickyNote className="h-4 w-4" />
                      {isRTL ? 'إضافة ملاحظة' : 'Add Note'}
                    </button>
                  </div>
                  {internalNotes.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {isRTL ? 'لا توجد ملاحظات داخلية' : 'No internal notes'}
                    </p>
                  ) : (
                    internalNotes.map((note) => (
                      <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-yellow-900">
                            {note.sender_name}
                          </span>
                          <span className="text-xs text-yellow-700">{formatDate(note.created_at)}</span>
                        </div>
                        <p className="text-sm text-yellow-800 whitespace-pre-wrap">{note.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Parties & Actions */}
        <div className="space-y-6">
          {/* Parties */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isRTL ? 'الأطراف' : 'Parties'}
            </h3>
            <div className="space-y-4">
              {/* Client */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">{isRTL ? 'العميل' : 'Client'}</p>
                  <p className="text-sm font-medium text-gray-900">{dispute.client.full_name}</p>
                  <p className="text-xs text-gray-500">{dispute.client.email}</p>
                </div>
              </div>
              {/* Consultant */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">{isRTL ? 'الاستشاري' : 'Consultant'}</p>
                  <p className="text-sm font-medium text-gray-900">{dispute.consultant.full_name}</p>
                  <p className="text-xs text-gray-500">{dispute.consultant.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isRTL ? 'معلومات الطلب' : 'Order Information'}
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-500">{isRTL ? 'رقم الطلب' : 'Order Number'}</dt>
                <dd className="text-sm font-medium text-gray-900">{dispute.order.order_number}</dd>
              </div>
              {dispute.order.project_title && (
                <div>
                  <dt className="text-xs text-gray-500">{isRTL ? 'المشروع' : 'Project'}</dt>
                  <dd className="text-sm font-medium text-gray-900">{dispute.order.project_title}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-500">{isRTL ? 'المبلغ الإجمالي' : 'Total Amount'}</dt>
                <dd className="text-sm font-medium text-gray-900">{formatAmount(dispute.order.total_amount)}</dd>
              </div>
            </dl>
          </div>

          {/* Assigned Admin */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isRTL ? 'المشرف المسؤول' : 'Assigned Admin'}
            </h3>
            {dispute.assigned_admin_info ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{dispute.assigned_admin_info.full_name}</p>
                  <p className="text-xs text-gray-500">{dispute.assigned_admin_info.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">{isRTL ? 'غير معين' : 'Not assigned'}</p>
            )}
          </div>

          {/* Actions */}
          {isOpen && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isRTL ? 'الإجراءات' : 'Actions'}
              </h3>
              <div className="space-y-3">
                {!dispute.assigned_admin && (
                  <button
                    onClick={handleAssign}
                    disabled={actionLoading === 'assign'}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading === 'assign' ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {isRTL ? 'تعيين لي' : 'Assign to Me'}
                  </button>
                )}

                <button
                  onClick={() => setShowRequestResponseModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                >
                  <Send className="h-4 w-4" />
                  {isRTL ? 'طلب رد' : 'Request Response'}
                </button>

                <button
                  onClick={() => setShowResolveModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isRTL ? 'حل النزاع' : 'Resolve Dispute'}
                </button>

                <button
                  onClick={() => setShowEscalateModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  <AlertTriangle className="h-4 w-4" />
                  {isRTL ? 'تصعيد النزاع' : 'Escalate Dispute'}
                </button>

                <button
                  onClick={() => setShowCloseModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <XCircle className="h-4 w-4" />
                  {isRTL ? 'إغلاق بدون حل' : 'Close Without Resolution'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isRTL ? 'حل النزاع' : 'Resolve Dispute'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'نوع الحل' : 'Resolution Type'}
                </label>
                <select
                  value={resolutionForm.resolution_type}
                  onChange={(e) =>
                    setResolutionForm((prev) => ({
                      ...prev,
                      resolution_type: e.target.value as ResolutionType,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {resolutionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              {(resolutionForm.resolution_type === 'partial_refund_client' ||
                resolutionForm.resolution_type === 'partial_release_consultant') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isRTL ? 'المبلغ (ريال)' : 'Amount (SAR)'}
                  </label>
                  <input
                    type="number"
                    value={resolutionForm.resolution_amount}
                    onChange={(e) =>
                      setResolutionForm((prev) => ({
                        ...prev,
                        resolution_amount: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'ملاحظات الحل' : 'Resolution Notes'}
                </label>
                <textarea
                  value={resolutionForm.resolution_notes}
                  onChange={(e) =>
                    setResolutionForm((prev) => ({
                      ...prev,
                      resolution_notes: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowResolveModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleResolve}
                disabled={actionLoading === 'resolve'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === 'resolve' && <RefreshCw className="h-4 w-4 animate-spin" />}
                {isRTL ? 'حل' : 'Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isRTL ? 'تصعيد النزاع' : 'Escalate Dispute'}
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'سبب التصعيد' : 'Escalation Reason'}
              </label>
              <textarea
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                rows={3}
                placeholder={isRTL ? 'اشرح سبب التصعيد...' : 'Explain the reason for escalation...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleEscalate}
                disabled={actionLoading === 'escalate'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === 'escalate' && <RefreshCw className="h-4 w-4 animate-spin" />}
                {isRTL ? 'تصعيد' : 'Escalate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Response Modal */}
      {showRequestResponseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isRTL ? 'طلب رد' : 'Request Response'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'من' : 'From'}
                </label>
                <select
                  value={requestParty}
                  onChange={(e) => setRequestParty(e.target.value as 'client' | 'consultant')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="client">{isRTL ? 'العميل' : 'Client'}</option>
                  <option value="consultant">{isRTL ? 'الاستشاري' : 'Consultant'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'المهلة (أيام)' : 'Deadline (days)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={requestDeadlineDays}
                  onChange={(e) => setRequestDeadlineDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'رسالة (اختياري)' : 'Message (optional)'}
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={3}
                  placeholder={isRTL ? 'أضف رسالة للطرف...' : 'Add a message to the party...'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRequestResponseModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleRequestResponse}
                disabled={actionLoading === 'request'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {actionLoading === 'request' && <RefreshCw className="h-4 w-4 animate-spin" />}
                {isRTL ? 'إرسال الطلب' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isRTL ? 'إغلاق النزاع' : 'Close Dispute'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {isRTL
                ? 'سيتم إغلاق النزاع بدون حل رسمي. يرجى تقديم سبب.'
                : 'The dispute will be closed without a formal resolution. Please provide a reason.'}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'سبب الإغلاق' : 'Reason for Closing'}
              </label>
              <textarea
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                rows={3}
                placeholder={isRTL ? 'اشرح سبب الإغلاق...' : 'Explain the reason for closing...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleClose}
                disabled={actionLoading === 'close'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {actionLoading === 'close' && <RefreshCw className="h-4 w-4 animate-spin" />}
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isRTL ? 'إضافة ملاحظة داخلية' : 'Add Internal Note'}
            </h3>
            <div>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
                placeholder={isRTL ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleAddNote}
                disabled={actionLoading === 'note' || !noteContent.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {actionLoading === 'note' && <RefreshCw className="h-4 w-4 animate-spin" />}
                {isRTL ? 'إضافة' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
