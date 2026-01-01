// Project Status Types
export type ProjectStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';

// Category Types
export interface Category {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  order: number;
}

// Project Attachment Types
export interface ProjectAttachment {
  id: string;
  file: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

// Client Info (minimal for public display)
export interface ClientInfo {
  id: string;
  full_name: string;
  user_type: string;
}

// Project List Item (for listing pages)
export interface ProjectListItem {
  id: string;
  title: string;
  category: Category;
  client: ClientInfo;
  budget_min: string;
  budget_max: string;
  budget_range: string;
  deadline: string;
  location: string;
  status: ProjectStatus;
  proposals_count: number;
  created_at: string;
  published_at: string | null;
}

// Accepted Proposal Info (minimal for project detail)
export interface AcceptedProposalInfo {
  id: string;
  consultant: {
    id: string;
    full_name: string;
  };
  proposed_budget: string;
  proposed_timeline: string;
  accepted_at: string;
}

// Project Detail (full project info)
export interface ProjectDetail extends ProjectListItem {
  description: string;
  requirements: string | null;
  attachments: ProjectAttachment[];
  is_editable: boolean;
  is_open: boolean;
  is_owner: boolean;
  updated_at: string;
  completed_at: string | null;
  accepted_proposal: AcceptedProposalInfo | null;
}

// Project Create/Update Request
export interface ProjectCreateData {
  title: string;
  description: string;
  category_id: string;
  budget_min: number;
  budget_max: number;
  deadline: string;
  location: string;
  requirements?: string;
  publish?: boolean;
}

export interface ProjectUpdateData {
  title?: string;
  description?: string;
  category_id?: string;
  budget_min?: number;
  budget_max?: number;
  deadline?: string;
  location?: string;
  requirements?: string;
}

// Project List Response
export interface ProjectListResponse {
  projects: ProjectListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

// Project Filters
export interface ProjectFilters {
  category?: string;
  status?: ProjectStatus;
  budget_min?: number;
  budget_max?: number;
  search?: string;
  page?: number;
  page_size?: number;
}

// Browse Projects Response
export interface BrowseProjectsResponse {
  projects: ProjectListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  filters_applied: {
    category: string | null;
    budget_min: number | null;
    budget_max: number | null;
    search: string | null;
  };
}
