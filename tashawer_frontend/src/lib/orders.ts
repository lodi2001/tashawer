import api from './api';
import type {
  ApiResponse,
  OrderListItem,
  OrderDetail,
  OrderListResponse,
  OrderFilters,
  OrderStartData,
  OrderDeliverData,
  OrderRevisionData,
  OrderCancelData,
  OrderExtendDeadlineData,
  MilestoneDetail,
  MilestoneListItem,
  MilestoneCreateData,
  MilestoneSubmitData,
  MilestoneApproveData,
  MilestoneRevisionData,
  Deliverable,
} from '@/types';

// ================== ORDER API ==================

// Get orders list
export const getOrders = async (filters: OrderFilters = {}): Promise<OrderListResponse> => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.role) params.append('role', filters.role);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.page_size) params.append('page_size', filters.page_size.toString());

  const response = await api.get<ApiResponse<OrderListResponse>>(
    `/orders/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch orders');
};

// Get order details
export const getOrder = async (orderNumber: string): Promise<OrderDetail> => {
  const response = await api.get<ApiResponse<OrderDetail>>(`/orders/${orderNumber}/`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch order');
};

// Create order from proposal
export const createOrder = async (proposalId: string): Promise<OrderDetail> => {
  const response = await api.post<ApiResponse<OrderDetail>>('/orders/create/', {
    proposal_id: proposalId,
  });
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to create order');
};

// Start work on order (consultant)
export const startOrderWork = async (
  orderNumber: string,
  data?: OrderStartData
): Promise<{ status: string }> => {
  const response = await api.post<ApiResponse<{ status: string }>>(
    `/orders/${orderNumber}/start/`,
    data || {}
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to start work');
};

// Deliver order (consultant)
export const deliverOrder = async (
  orderNumber: string,
  data?: OrderDeliverData
): Promise<{ status: string }> => {
  const response = await api.post<ApiResponse<{ status: string }>>(
    `/orders/${orderNumber}/deliver/`,
    data || {}
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to deliver order');
};

// Request revision (client)
export const requestOrderRevision = async (
  orderNumber: string,
  data: OrderRevisionData
): Promise<{ status: string; revisions_used: number; revisions_remaining: number }> => {
  const response = await api.post<
    ApiResponse<{ status: string; revisions_used: number; revisions_remaining: number }>
  >(`/orders/${orderNumber}/revision/`, data);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to request revision');
};

// Complete order (client)
export const completeOrder = async (orderNumber: string): Promise<{ status: string }> => {
  const response = await api.post<ApiResponse<{ status: string }>>(
    `/orders/${orderNumber}/complete/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to complete order');
};

// Cancel order
export const cancelOrder = async (
  orderNumber: string,
  data: OrderCancelData
): Promise<{ status: string }> => {
  const response = await api.post<ApiResponse<{ status: string }>>(
    `/orders/${orderNumber}/cancel/`,
    data
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to cancel order');
};

// Extend deadline
export const extendOrderDeadline = async (
  orderNumber: string,
  data: OrderExtendDeadlineData
): Promise<{ expected_delivery_date: string; original_delivery_date: string | null }> => {
  const response = await api.post<
    ApiResponse<{ expected_delivery_date: string; original_delivery_date: string | null }>
  >(`/orders/${orderNumber}/extend-deadline/`, data);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to extend deadline');
};

// ================== MILESTONE API ==================

// Get milestones for an order
export const getOrderMilestones = async (orderNumber: string): Promise<MilestoneListItem[]> => {
  const response = await api.get<ApiResponse<MilestoneListItem[]>>(
    `/orders/${orderNumber}/milestones/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch milestones');
};

// Create milestone
export const createMilestone = async (
  orderNumber: string,
  data: MilestoneCreateData
): Promise<MilestoneDetail> => {
  const response = await api.post<ApiResponse<MilestoneDetail>>(
    `/orders/${orderNumber}/milestones/create/`,
    data
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to create milestone');
};

// Get milestone details
export const getMilestone = async (milestoneId: string): Promise<MilestoneDetail> => {
  const response = await api.get<ApiResponse<MilestoneDetail>>(
    `/orders/milestones/${milestoneId}/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch milestone');
};

// Update milestone
export const updateMilestone = async (
  milestoneId: string,
  data: Partial<MilestoneCreateData>
): Promise<MilestoneDetail> => {
  const response = await api.patch<ApiResponse<MilestoneDetail>>(
    `/orders/milestones/${milestoneId}/`,
    data
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to update milestone');
};

// Delete milestone
export const deleteMilestone = async (milestoneId: string): Promise<void> => {
  const response = await api.delete<ApiResponse<null>>(`/orders/milestones/${milestoneId}/`);
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete milestone');
  }
};

// Start milestone (consultant)
export const startMilestone = async (milestoneId: string): Promise<{ status: string }> => {
  const response = await api.post<ApiResponse<{ status: string }>>(
    `/orders/milestones/${milestoneId}/start/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to start milestone');
};

// Submit milestone (consultant)
export const submitMilestone = async (
  milestoneId: string,
  data?: MilestoneSubmitData
): Promise<{ status: string }> => {
  const response = await api.post<ApiResponse<{ status: string }>>(
    `/orders/milestones/${milestoneId}/submit/`,
    data || {}
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to submit milestone');
};

// Approve milestone (client)
export const approveMilestone = async (
  milestoneId: string,
  data?: MilestoneApproveData
): Promise<{ status: string; order_progress: number }> => {
  const response = await api.post<ApiResponse<{ status: string; order_progress: number }>>(
    `/orders/milestones/${milestoneId}/approve/`,
    data || {}
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to approve milestone');
};

// Request milestone revision (client)
export const requestMilestoneRevision = async (
  milestoneId: string,
  data: MilestoneRevisionData
): Promise<{ status: string }> => {
  const response = await api.post<ApiResponse<{ status: string }>>(
    `/orders/milestones/${milestoneId}/revision/`,
    data
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to request revision');
};

// ================== DELIVERABLE API ==================

// Get deliverables for a milestone
export const getMilestoneDeliverables = async (milestoneId: string): Promise<Deliverable[]> => {
  const response = await api.get<ApiResponse<Deliverable[]>>(
    `/orders/milestones/${milestoneId}/deliverables/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch deliverables');
};

// Upload deliverable
export const uploadDeliverable = async (
  milestoneId: string,
  file: File,
  description?: string
): Promise<Deliverable> => {
  const formData = new FormData();
  formData.append('file', file);
  if (description) {
    formData.append('description', description);
  }

  const response = await api.post<ApiResponse<Deliverable>>(
    `/orders/milestones/${milestoneId}/deliverables/upload/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to upload deliverable');
};

// Delete deliverable
export const deleteDeliverable = async (deliverableId: string): Promise<void> => {
  const response = await api.delete<ApiResponse<null>>(
    `/orders/deliverables/${deliverableId}/`
  );
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete deliverable');
  }
};

// ================== HELPER FUNCTIONS ==================

export const getOrderStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    under_review: 'bg-indigo-100 text-indigo-800',
    revision_requested: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    disputed: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getOrderStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending_payment: 'Pending Payment',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    under_review: 'Under Review',
    revision_requested: 'Revision Requested',
    completed: 'Completed',
    cancelled: 'Cancelled',
    disputed: 'Disputed',
  };
  return labels[status] || status;
};

export const getMilestoneStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    submitted: 'bg-purple-100 text-purple-800',
    revision_requested: 'bg-orange-100 text-orange-800',
    approved: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getMilestoneStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    revision_requested: 'Revision Requested',
    approved: 'Approved',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
};
