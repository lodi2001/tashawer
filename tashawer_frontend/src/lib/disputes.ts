import api from './api';
import type {
  DisputeListItem,
  DisputeDetail,
  CreateDisputeData,
  DisputeResponseData,
  DisputeMessageData,
  DisputeMessage,
  DisputeEvidence,
  DisputeResolutionData,
} from '@/types/dispute';

// ============ User Dispute APIs ============

/**
 * Get list of user's disputes
 */
export async function getDisputes(status?: string): Promise<DisputeListItem[]> {
  const params = status ? { status } : {};
  const response = await api.get<{ success: boolean; data: DisputeListItem[] }>(
    '/disputes/',
    { params }
  );
  return response.data.data;
}

/**
 * Get dispute details
 */
export async function getDispute(disputeNumber: string): Promise<DisputeDetail> {
  const response = await api.get<{ success: boolean; data: DisputeDetail }>(
    `/disputes/${disputeNumber}/`
  );
  return response.data.data;
}

/**
 * Create a new dispute
 */
export async function createDispute(data: CreateDisputeData): Promise<DisputeDetail> {
  const response = await api.post<{ success: boolean; data: DisputeDetail }>(
    '/disputes/create/',
    data
  );
  return response.data.data;
}

/**
 * Respond to a dispute
 */
export async function respondToDispute(
  disputeNumber: string,
  data: DisputeResponseData
): Promise<{ status: string }> {
  const response = await api.post<{ success: boolean; data: { status: string } }>(
    `/disputes/${disputeNumber}/respond/`,
    data
  );
  return response.data.data;
}

/**
 * Upload evidence for a dispute
 */
export async function uploadEvidence(
  disputeNumber: string,
  file: File,
  description?: string
): Promise<DisputeEvidence> {
  const formData = new FormData();
  formData.append('file', file);
  if (description) {
    formData.append('description', description);
  }

  const response = await api.post<{ success: boolean; data: DisputeEvidence }>(
    `/disputes/${disputeNumber}/evidence/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
}

/**
 * Get dispute messages
 */
export async function getDisputeMessages(disputeNumber: string): Promise<DisputeMessage[]> {
  const response = await api.get<{ success: boolean; data: DisputeMessage[] }>(
    `/disputes/${disputeNumber}/messages/`
  );
  return response.data.data;
}

/**
 * Add message to dispute
 */
export async function addDisputeMessage(
  disputeNumber: string,
  data: DisputeMessageData
): Promise<DisputeMessage> {
  const response = await api.post<{ success: boolean; data: DisputeMessage }>(
    `/disputes/${disputeNumber}/messages/`,
    data
  );
  return response.data.data;
}

// ============ Admin Dispute APIs ============

export interface DisputeFilters {
  status?: string;
  assigned_to?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedDisputeResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DisputeListItem[];
}

/**
 * Get all disputes (admin) with pagination
 */
export async function getAdminDisputes(filters?: DisputeFilters): Promise<PaginatedDisputeResponse> {
  const response = await api.get<{ success: boolean; data: PaginatedDisputeResponse }>(
    '/disputes/admin/list/',
    { params: filters }
  );
  return response.data.data;
}

/**
 * Get dispute details (admin)
 */
export async function getAdminDispute(disputeNumber: string): Promise<DisputeDetail> {
  const response = await api.get<{ success: boolean; data: DisputeDetail }>(
    `/disputes/admin/${disputeNumber}/`
  );
  return response.data.data;
}

/**
 * Assign admin to dispute
 */
export async function assignDisputeAdmin(
  disputeNumber: string,
  adminId?: string
): Promise<{ assigned_admin: string }> {
  const response = await api.post<{ success: boolean; data: { assigned_admin: string } }>(
    `/disputes/admin/${disputeNumber}/assign/`,
    adminId ? { admin_id: adminId } : {}
  );
  return response.data.data;
}

/**
 * Resolve a dispute (admin)
 */
export async function resolveDispute(
  disputeNumber: string,
  data: DisputeResolutionData
): Promise<DisputeDetail> {
  const response = await api.post<{ success: boolean; data: DisputeDetail }>(
    `/disputes/admin/${disputeNumber}/resolve/`,
    data
  );
  return response.data.data;
}

/**
 * Escalate a dispute (admin)
 */
export async function escalateDispute(
  disputeNumber: string,
  reason?: string
): Promise<{ status: string }> {
  const response = await api.post<{ success: boolean; data: { status: string } }>(
    `/disputes/admin/${disputeNumber}/escalate/`,
    { reason }
  );
  return response.data.data;
}

/**
 * Request response from a party (admin)
 */
export async function requestDisputeResponse(
  disputeNumber: string,
  party: 'client' | 'consultant',
  message?: string,
  deadlineDays?: number
): Promise<{ status: string; response_deadline: string }> {
  const response = await api.post<{
    success: boolean;
    data: { status: string; response_deadline: string };
  }>(`/disputes/admin/${disputeNumber}/request-response/`, {
    party,
    message,
    deadline_days: deadlineDays,
  });
  return response.data.data;
}

/**
 * Close a dispute without resolution (admin)
 */
export async function closeDispute(
  disputeNumber: string,
  reason?: string
): Promise<{ status: string }> {
  const response = await api.post<{ success: boolean; data: { status: string } }>(
    `/disputes/admin/${disputeNumber}/close/`,
    { reason }
  );
  return response.data.data;
}

/**
 * Get internal notes for a dispute (admin)
 */
export async function getInternalNotes(disputeNumber: string): Promise<DisputeMessage[]> {
  const response = await api.get<{ success: boolean; data: DisputeMessage[] }>(
    `/disputes/admin/${disputeNumber}/internal-notes/`
  );
  return response.data.data;
}

/**
 * Add internal note to a dispute (admin)
 */
export async function addInternalNote(
  disputeNumber: string,
  message: string
): Promise<DisputeMessage> {
  const response = await api.post<{ success: boolean; data: DisputeMessage }>(
    `/disputes/admin/${disputeNumber}/internal-notes/`,
    { message }
  );
  return response.data.data;
}
