import api from './api';
import type {
  ApiResponse,
  ProposalListItem,
  ProposalDetail,
  ProposalCreateData,
  ProposalUpdateData,
  ProposalListResponse,
  ProposalFilters,
} from '@/types';

// Get consultant's proposals (My Proposals)
export const getMyProposals = async (
  page = 1,
  pageSize = 20,
  status?: string
): Promise<ProposalListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (status) {
    params.append('status', status);
  }

  const response = await api.get<ApiResponse<ProposalListResponse>>(
    `/proposals/my-proposals/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch proposals');
};

// Get proposals for a project (for clients)
export const getProjectProposals = async (
  projectId: string,
  page = 1,
  pageSize = 20
): Promise<ProposalListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  const response = await api.get<ApiResponse<ProposalListResponse>>(
    `/proposals/project/${projectId}/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch proposals');
};

// Create a new proposal
export const createProposal = async (data: ProposalCreateData): Promise<ProposalDetail> => {
  const response = await api.post<ApiResponse<ProposalDetail>>('/proposals/', data);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to create proposal');
};

// Get proposal details
export const getProposal = async (id: string): Promise<ProposalDetail> => {
  const response = await api.get<ApiResponse<ProposalDetail>>(`/proposals/${id}/`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch proposal');
};

// Update proposal
export const updateProposal = async (
  id: string,
  data: ProposalUpdateData
): Promise<ProposalDetail> => {
  const response = await api.patch<ApiResponse<ProposalDetail>>(`/proposals/${id}/update/`, data);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to update proposal');
};

// Accept proposal (client)
export const acceptProposal = async (id: string): Promise<ProposalDetail> => {
  const response = await api.post<ApiResponse<ProposalDetail>>(`/proposals/${id}/accept/`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to accept proposal');
};

// Reject proposal (client)
export const rejectProposal = async (id: string, reason?: string): Promise<ProposalDetail> => {
  const response = await api.post<ApiResponse<ProposalDetail>>(`/proposals/${id}/reject/`, {
    reason,
  });
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to reject proposal');
};

// Withdraw proposal (consultant)
export const withdrawProposal = async (id: string): Promise<ProposalDetail> => {
  const response = await api.post<ApiResponse<ProposalDetail>>(`/proposals/${id}/withdraw/`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to withdraw proposal');
};
