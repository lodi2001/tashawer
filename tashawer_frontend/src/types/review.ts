// Reviewer/Reviewee info
export interface ReviewerInfo {
  id: string;
  full_name: string;
  user_type: string;
}

// Review list item
export interface ReviewListItem {
  id: string;
  reviewer: ReviewerInfo;
  reviewee: ReviewerInfo;
  project: { id: string; title: string };
  rating: number;
  title: string;
  content: string;
  is_public: boolean;
  has_response: boolean;
  created_at: string;
}

// Review detail
export interface ReviewDetail extends ReviewListItem {
  response: string | null;
  response_at: string | null;
  updated_at: string;
}

// Review create request
export interface ReviewCreateData {
  project_id: string;
  rating: number;
  title: string;
  content: string;
  is_public?: boolean;
}

// Review response request
export interface ReviewResponseData {
  response: string;
}

// Consultant rating stats
export interface ConsultantRatingStats {
  consultant: { id: string; name: string };
  average_rating: number;
  total_reviews: number;
  rating_breakdown: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

// Review list response
export interface ReviewListResponse {
  reviews: ReviewListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

// Consultant reviews response
export interface ConsultantReviewsResponse {
  consultant: { id: string; name: string };
  reviews: ReviewListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

// Received reviews response (for consultants)
export interface ReceivedReviewsResponse {
  reviews: ReviewListItem[];
  stats: {
    average_rating: number;
    total_reviews: number;
  };
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}
