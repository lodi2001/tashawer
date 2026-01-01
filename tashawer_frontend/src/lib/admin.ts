import api from './api';
import type {
  ApiResponse,
  PaginatedResponse,
  AdminUserListItem,
  AuditLog,
} from '@/types';

export interface AdminUserFilters {
  user_type?: string;
  account_status?: string;
  is_verified?: boolean;
  is_approved?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

// List users with filters
export const getUsers = async (
  filters: AdminUserFilters = {}
): Promise<PaginatedResponse<AdminUserListItem>> => {
  const params = new URLSearchParams();

  if (filters.user_type) params.append('user_type', filters.user_type);
  if (filters.account_status) params.append('account_status', filters.account_status);
  if (filters.is_verified !== undefined) params.append('is_verified', String(filters.is_verified));
  if (filters.is_approved !== undefined) params.append('is_approved', String(filters.is_approved));
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.page_size) params.append('page_size', String(filters.page_size));

  const response = await api.get<ApiResponse<PaginatedResponse<AdminUserListItem>>>(
    `/admin/users/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch users');
};

// Get user details
export const getUser = async (userId: string): Promise<AdminUserListItem> => {
  const response = await api.get<ApiResponse<AdminUserListItem>>(
    `/admin/users/${userId}/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch user');
};

// Approve user
export const approveUser = async (userId: string): Promise<void> => {
  const response = await api.post<ApiResponse<null>>(
    `/admin/users/${userId}/approve/`
  );
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to approve user');
  }
};

// Suspend user
export const suspendUser = async (userId: string, reason?: string): Promise<void> => {
  const response = await api.post<ApiResponse<null>>(
    `/admin/users/${userId}/suspend/`,
    { reason }
  );
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to suspend user');
  }
};

// Activate user
export const activateUser = async (userId: string): Promise<void> => {
  const response = await api.post<ApiResponse<null>>(
    `/admin/users/${userId}/activate/`
  );
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to activate user');
  }
};

// Edit user
export const editUser = async (
  userId: string,
  data: Partial<AdminUserListItem>
): Promise<AdminUserListItem> => {
  const response = await api.patch<ApiResponse<AdminUserListItem>>(
    `/admin/users/${userId}/edit/`,
    data
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to update user');
};

// Get audit logs
export const getAuditLogs = async (
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<AuditLog>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<AuditLog>>>(
    `/admin/audit-logs/?page=${page}&page_size=${pageSize}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch audit logs');
};
