import api from './api';
import type { ApiResponse } from '@/types';

// Analytics Types
export interface PlatformOverview {
  users: {
    total: number;
    clients: number;
    consultants: number;
    new_last_30_days: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    new_last_30_days: number;
    completion_rate: number;
  };
  orders: {
    total: number;
    active: number;
    completed: number;
  };
  revenue: {
    total_platform_fees: string;
    total_order_value: string;
  };
}

export interface UserGrowthData {
  period: string;
  days: number;
  growth: Array<{
    date: string;
    total: number;
    clients: number;
    consultants: number;
  }>;
}

export interface ProjectAnalytics {
  days: number;
  status_distribution: Array<{
    status: string;
    count: number;
  }>;
  projects_over_time: Array<{
    date: string;
    created: number;
    published: number;
  }>;
  category_distribution: Array<{
    category__name: string;
    count: number;
  }>;
  average_proposals_per_project: number;
  budget_stats: {
    average_min: string;
    average_max: string;
    total_value: string;
  };
}

export interface RevenueAnalytics {
  period: string;
  days: number;
  revenue_over_time: Array<{
    date: string;
    order_count: number;
    total_value: string;
    platform_fees: string;
  }>;
  revenue_by_category: Array<{
    category_name: string;
    total_value: string;
    platform_fees: string;
    order_count: number;
  }>;
  summary: {
    total_orders: number;
    total_value: string;
    total_fees: string;
    average_order_value: string;
  };
}

export interface ConsultantDashboard {
  proposals: {
    total: number;
    pending: number;
    accepted: number;
    success_rate: number;
    last_30_days: number;
  };
  orders: {
    active: number;
    completed: number;
    last_30_days: number;
  };
  earnings: {
    total: string;
    last_30_days: string;
  };
}

export interface ClientDashboard {
  projects: {
    total: number;
    draft: number;
    active: number;
    completed: number;
  };
  proposals: {
    total_received: number;
    pending_review: number;
  };
  orders: {
    active: number;
    completed: number;
  };
  spending: {
    total: string;
    last_30_days: string;
  };
}

// Admin Analytics API
export const getPlatformOverview = async (): Promise<PlatformOverview> => {
  const response = await api.get<ApiResponse<PlatformOverview>>(
    '/analytics/admin/overview/'
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch platform overview');
};

export const getUserGrowth = async (
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  days: number = 30
): Promise<UserGrowthData> => {
  const params = new URLSearchParams({
    period,
    days: days.toString(),
  });
  const response = await api.get<ApiResponse<UserGrowthData>>(
    `/analytics/admin/users/growth/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch user growth');
};

export const getProjectAnalytics = async (days: number = 30): Promise<ProjectAnalytics> => {
  const response = await api.get<ApiResponse<ProjectAnalytics>>(
    `/analytics/admin/projects/analytics/?days=${days}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch project analytics');
};

export const getRevenueAnalytics = async (
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  days: number = 30
): Promise<RevenueAnalytics> => {
  const params = new URLSearchParams({
    period,
    days: days.toString(),
  });
  const response = await api.get<ApiResponse<RevenueAnalytics>>(
    `/analytics/admin/revenue/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch revenue analytics');
};

// User Dashboard API
export const getConsultantDashboard = async (): Promise<ConsultantDashboard> => {
  const response = await api.get<ApiResponse<ConsultantDashboard>>(
    '/analytics/dashboard/consultant/'
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch consultant dashboard');
};

export const getClientDashboard = async (): Promise<ClientDashboard> => {
  const response = await api.get<ApiResponse<ClientDashboard>>(
    '/analytics/dashboard/client/'
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch client dashboard');
};
