// Proposal Status Types
export type ProposalStatus = 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';

// Minimal info types
export interface ConsultantInfo {
  id: string;
  full_name: string;
  user_type: string;
}

export interface ProjectInfo {
  id: string;
  title: string;
  budget_range: string;
  deadline: string;
  status: string;
  client_id: string;
}

// Proposal List Item
export interface ProposalListItem {
  id: string;
  project: ProjectInfo;
  consultant: ConsultantInfo;
  proposed_amount: string;
  estimated_duration: number;
  delivery_date: string;
  status: ProposalStatus;
  submitted_at: string | null;
  created_at: string;
}

// Proposal Detail
export interface ProposalDetail extends ProposalListItem {
  cover_letter: string;
  rejection_reason: string | null;
  is_editable: boolean;
  can_withdraw: boolean;
  is_owner: boolean;
  is_project_owner: boolean;
  reviewed_at: string | null;
  updated_at: string;
}

// Proposal Create/Update Request
export interface ProposalCreateData {
  project_id: string;
  cover_letter: string;
  proposed_amount: number;
  estimated_duration: number;
  delivery_date: string;
}

export interface ProposalUpdateData {
  cover_letter?: string;
  proposed_amount?: number;
  estimated_duration?: number;
  delivery_date?: string;
}

// Proposal List Response
export interface ProposalListResponse {
  proposals: ProposalListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

// Proposal Filters
export interface ProposalFilters {
  status?: ProposalStatus;
  page?: number;
  page_size?: number;
}
