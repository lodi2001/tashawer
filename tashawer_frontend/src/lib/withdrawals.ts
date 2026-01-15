import api from './api';
import type { ApiResponse, PaginatedResponse } from '@/types';

// Types
export type WithdrawalStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';

export interface BankAccount {
  id: string;
  bank_name: string;
  bank_name_ar: string;
  account_holder_name: string;
  iban: string;
  masked_iban: string;
  swift_code: string;
  is_verified: boolean;
  is_primary: boolean;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  reference_number: string;
  user_email: string;
  user_name: string;
  amount: string;
  fee: string;
  net_amount: string;
  currency: string;
  status: WithdrawalStatus;
  bank_account: BankAccount;
  bank_account_display?: string;
  bank_reference: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  approved_at: string | null;
  processed_at: string | null;
  completed_at: string | null;
  user_note: string | null;
  admin_note: string | null;
  created_at: string;
}

export interface WithdrawalFilters {
  status?: WithdrawalStatus;
  search?: string;
  page?: number;
  page_size?: number;
}

// Admin Withdrawal API Functions

/**
 * Get list of all withdrawals (admin only)
 */
export const getAdminWithdrawals = async (
  filters: WithdrawalFilters = {}
): Promise<PaginatedResponse<Withdrawal>> => {
  const params = new URLSearchParams();

  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.page_size) params.append('page_size', String(filters.page_size));

  const response = await api.get<ApiResponse<PaginatedResponse<Withdrawal>>>(
    `/payments/admin/withdrawals/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch withdrawals');
};

/**
 * Get withdrawal details by reference number (admin only)
 */
export const getAdminWithdrawalDetail = async (
  referenceNumber: string
): Promise<Withdrawal> => {
  const response = await api.get<ApiResponse<Withdrawal>>(
    `/payments/admin/withdrawals/${referenceNumber}/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch withdrawal');
};

/**
 * Approve withdrawal request (admin only)
 */
export const approveWithdrawal = async (
  referenceNumber: string,
  note?: string
): Promise<void> => {
  const response = await api.post<ApiResponse<null>>(
    `/payments/admin/withdrawals/${referenceNumber}/approve/`,
    { note }
  );
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to approve withdrawal');
  }
};

/**
 * Reject withdrawal request (admin only)
 */
export const rejectWithdrawal = async (
  referenceNumber: string,
  reason: string
): Promise<void> => {
  const response = await api.post<ApiResponse<null>>(
    `/payments/admin/withdrawals/${referenceNumber}/reject/`,
    { reason }
  );
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to reject withdrawal');
  }
};

/**
 * Start processing withdrawal (admin only)
 */
export const processWithdrawal = async (
  referenceNumber: string
): Promise<void> => {
  const response = await api.post<ApiResponse<null>>(
    `/payments/admin/withdrawals/${referenceNumber}/process/`
  );
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to process withdrawal');
  }
};

/**
 * Complete withdrawal with bank reference (admin only)
 */
export const completeWithdrawal = async (
  referenceNumber: string,
  bankReference: string
): Promise<void> => {
  const response = await api.post<ApiResponse<null>>(
    `/payments/admin/withdrawals/${referenceNumber}/complete/`,
    { bank_reference: bankReference }
  );
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to complete withdrawal');
  }
};

/**
 * Verify bank account (admin only)
 */
export const verifyBankAccount = async (
  bankAccountId: string
): Promise<void> => {
  const response = await api.post<ApiResponse<null>>(
    `/payments/admin/bank-accounts/${bankAccountId}/verify/`
  );
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to verify bank account');
  }
};
