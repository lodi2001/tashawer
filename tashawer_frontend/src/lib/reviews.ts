import api from './api';
import type {
  ApiResponse,
  ReviewListItem,
  ReviewDetail,
  ReviewCreateData,
  ReviewListResponse,
  ConsultantReviewsResponse,
  ConsultantRatingStats,
  ReceivedReviewsResponse,
} from '@/types';

// Create a review
export const createReview = async (data: ReviewCreateData): Promise<ReviewDetail> => {
  const response = await api.post<ApiResponse<ReviewDetail>>('/reviews/', data);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to create review');
};

// Get review detail
export const getReview = async (id: string): Promise<ReviewDetail> => {
  const response = await api.get<ApiResponse<ReviewDetail>>(`/reviews/${id}/`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch review');
};

// Add response to review (consultant)
export const addReviewResponse = async (
  id: string,
  responseText: string
): Promise<ReviewDetail> => {
  const response = await api.post<ApiResponse<ReviewDetail>>(`/reviews/${id}/respond/`, {
    response: responseText,
  });
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to add response');
};

// Get my reviews (written by me)
export const getMyReviews = async (
  page = 1,
  pageSize = 20
): Promise<ReviewListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  const response = await api.get<ApiResponse<ReviewListResponse>>(
    `/reviews/my-reviews/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch reviews');
};

// Get received reviews (for consultants)
export const getReceivedReviews = async (
  page = 1,
  pageSize = 20
): Promise<ReceivedReviewsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  const response = await api.get<ApiResponse<ReceivedReviewsResponse>>(
    `/reviews/received/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch reviews');
};

// Get consultant's public reviews
export const getConsultantReviews = async (
  userId: string,
  page = 1,
  pageSize = 20,
  rating?: number
): Promise<ConsultantReviewsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (rating) {
    params.append('rating', rating.toString());
  }

  const response = await api.get<ApiResponse<ConsultantReviewsResponse>>(
    `/reviews/consultant/${userId}/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch reviews');
};

// Get consultant rating stats
export const getConsultantRatingStats = async (
  userId: string
): Promise<ConsultantRatingStats> => {
  const response = await api.get<ApiResponse<ConsultantRatingStats>>(
    `/reviews/consultant/${userId}/stats/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch stats');
};
