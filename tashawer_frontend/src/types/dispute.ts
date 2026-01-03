// Dispute types

export type DisputeReason =
  | 'quality_issues'
  | 'incomplete_work'
  | 'missed_deadline'
  | 'communication_issues'
  | 'scope_disagreement'
  | 'payment_dispute'
  | 'unresponsive_party'
  | 'other';

export type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'awaiting_response'
  | 'in_mediation'
  | 'resolved'
  | 'closed'
  | 'escalated';

export type ResolutionType =
  | 'full_refund_client'
  | 'partial_refund_client'
  | 'release_to_consultant'
  | 'partial_release_consultant'
  | 'mutual_agreement'
  | 'no_action';

export interface DisputeUserInfo {
  id: string;
  full_name: string;
  email: string;
}

export interface DisputeOrderInfo {
  id: string;
  order_number: string;
  project_title: string | null;
  total_amount: string;
  status: string;
}

export interface DisputeEvidence {
  id: string;
  file: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  description: string;
  uploaded_by: string;
  uploaded_by_name: string;
  created_at: string;
}

export interface DisputeMessage {
  id: string;
  message: string;
  sender: string;
  sender_name: string;
  sender_role: 'admin' | 'client' | 'consultant';
  is_admin_message: boolean;
  is_internal_note: boolean;
  created_at: string;
}

export interface DisputeActivity {
  id: string;
  activity_type: string;
  description: string;
  user_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DisputeListItem {
  id: string;
  dispute_number: string;
  order_number: string;
  project_title: string | null;
  client_name: string;
  consultant_name: string;
  initiated_by: string;
  initiated_by_name: string;
  reason: DisputeReason;
  reason_display: string;
  status: DisputeStatus;
  status_display: string;
  disputed_amount: string;
  created_at: string;
  response_deadline: string | null;
}

export interface DisputeDetail {
  id: string;
  dispute_number: string;
  order: DisputeOrderInfo;
  client: DisputeUserInfo;
  consultant: DisputeUserInfo;
  initiated_by: string;
  initiated_by_info: DisputeUserInfo;
  assigned_admin: string | null;
  assigned_admin_info: DisputeUserInfo | null;
  reason: DisputeReason;
  reason_display: string;
  description: string;
  desired_resolution: string;
  status: DisputeStatus;
  status_display: string;
  disputed_amount: string;
  resolution_type: ResolutionType | null;
  resolution_type_display: string | null;
  resolution_amount: string | null;
  resolution_notes: string;
  resolved_by: string | null;
  resolved_by_info: DisputeUserInfo | null;
  resolved_at: string | null;
  response_deadline: string | null;
  evidence: DisputeEvidence[];
  messages: DisputeMessage[];
  activities: DisputeActivity[];
  is_initiator: boolean;
  can_respond: boolean;
  can_resolve: boolean;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDisputeData {
  order_id: string;
  reason: DisputeReason;
  description: string;
  desired_resolution?: string;
}

export interface DisputeResponseData {
  response: string;
}

export interface DisputeMessageData {
  message: string;
  is_internal_note?: boolean;
}

export interface DisputeResolutionData {
  resolution_type: ResolutionType;
  resolution_amount?: string;
  resolution_notes?: string;
}

// Display helpers
export const DISPUTE_REASON_LABELS: Record<DisputeReason, string> = {
  quality_issues: 'Quality Issues',
  incomplete_work: 'Incomplete Work',
  missed_deadline: 'Missed Deadline',
  communication_issues: 'Communication Issues',
  scope_disagreement: 'Scope Disagreement',
  payment_dispute: 'Payment Dispute',
  unresponsive_party: 'Unresponsive Party',
  other: 'Other',
};

export const DISPUTE_REASON_LABELS_AR: Record<DisputeReason, string> = {
  quality_issues: 'مشاكل في الجودة',
  incomplete_work: 'عمل غير مكتمل',
  missed_deadline: 'تجاوز الموعد النهائي',
  communication_issues: 'مشاكل في التواصل',
  scope_disagreement: 'خلاف على النطاق',
  payment_dispute: 'نزاع على الدفع',
  unresponsive_party: 'طرف غير متجاوب',
  other: 'أخرى',
};

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  open: 'Open',
  under_review: 'Under Review',
  awaiting_response: 'Awaiting Response',
  in_mediation: 'In Mediation',
  resolved: 'Resolved',
  closed: 'Closed',
  escalated: 'Escalated',
};

export const DISPUTE_STATUS_LABELS_AR: Record<DisputeStatus, string> = {
  open: 'مفتوح',
  under_review: 'قيد المراجعة',
  awaiting_response: 'في انتظار الرد',
  in_mediation: 'في الوساطة',
  resolved: 'تم الحل',
  closed: 'مغلق',
  escalated: 'تم التصعيد',
};

export const RESOLUTION_TYPE_LABELS: Record<ResolutionType, string> = {
  full_refund_client: 'Full Refund to Client',
  partial_refund_client: 'Partial Refund to Client',
  release_to_consultant: 'Release to Consultant',
  partial_release_consultant: 'Partial Release to Consultant',
  mutual_agreement: 'Mutual Agreement',
  no_action: 'No Action Required',
};

export const RESOLUTION_TYPE_LABELS_AR: Record<ResolutionType, string> = {
  full_refund_client: 'استرداد كامل للعميل',
  partial_refund_client: 'استرداد جزئي للعميل',
  release_to_consultant: 'تحويل للاستشاري',
  partial_release_consultant: 'تحويل جزئي للاستشاري',
  mutual_agreement: 'اتفاق متبادل',
  no_action: 'لا يتطلب إجراء',
};

export function getDisputeStatusColor(status: DisputeStatus): string {
  const colors: Record<DisputeStatus, string> = {
    open: 'bg-orange-100 text-orange-800',
    under_review: 'bg-blue-100 text-blue-800',
    awaiting_response: 'bg-yellow-100 text-yellow-800',
    in_mediation: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    escalated: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
