// Consultant Discovery Types

export type AvailabilityStatus = 'available' | 'busy' | 'not_available';
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

// Portfolio Image
export interface PortfolioImage {
  id: string;
  image: string;
  caption: string | null;
  is_primary: boolean;
  order: number;
}

// Portfolio Item
export interface ConsultantPortfolio {
  id: string;
  title: string;
  title_ar: string | null;
  description: string;
  description_ar: string | null;
  category: string | null;
  category_name: string | null;
  client_name: string | null;
  project_url: string | null;
  completion_date: string | null;
  project_value: string | null;
  is_featured: boolean;
  order: number;
  images: PortfolioImage[];
  created_at: string;
}

// Portfolio Create/Update Data
export interface PortfolioCreateData {
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  category?: string;
  client_name?: string;
  project_url?: string;
  completion_date?: string;
  project_value?: number;
  is_featured?: boolean;
  order?: number;
}

// Consultant Skill
export interface ConsultantSkill {
  id: string;
  name: string;
  name_ar: string | null;
  category: string | null;
  category_name: string | null;
  proficiency: ProficiencyLevel;
  years_experience: number;
  is_verified: boolean;
}

// Skill Create/Update Data
export interface SkillCreateData {
  name: string;
  name_ar?: string;
  category?: string;
  proficiency?: ProficiencyLevel;
  years_experience?: number;
}

// Consultant Certification
export interface ConsultantCertification {
  id: string;
  name: string;
  name_ar: string | null;
  issuing_organization: string;
  credential_id: string | null;
  credential_url: string | null;
  issue_date: string;
  expiry_date: string | null;
  document: string | null;
  is_verified: boolean;
  is_expired: boolean;
  is_valid: boolean;
  created_at: string;
}

// Certification Create/Update Data
export interface CertificationCreateData {
  name: string;
  name_ar?: string;
  issuing_organization: string;
  credential_id?: string;
  credential_url?: string;
  issue_date: string;
  expiry_date?: string;
  document?: File;
}

// Consultant Public Profile (full detail)
export interface ConsultantPublicProfile {
  id: string;
  user_id: string;
  email: string;
  consultant_type: 'individual' | 'office';
  full_name: string;
  full_name_ar: string | null;
  specialization: string | null;
  experience_years: number;
  hourly_rate: string | null;
  avatar: string | null;
  bio: string | null;
  bio_ar: string | null;
  portfolio_url: string | null;
  city: string | null;
  availability_status: AvailabilityStatus;
  rating: number;
  total_reviews: number;
  total_projects_completed: number;
  portfolio_items: ConsultantPortfolio[];
  skill_items: ConsultantSkill[];
  certification_items: ConsultantCertification[];
  created_at: string;
}

// Consultant List Item (for browse page)
export interface ConsultantListItem {
  id: string;
  user_id: string;
  consultant_type: 'individual' | 'office';
  full_name: string;
  specialization: string | null;
  experience_years: number;
  hourly_rate: string | null;
  avatar: string | null;
  bio: string | null;
  city: string | null;
  availability_status: AvailabilityStatus;
  rating: number;
  total_reviews: number;
  total_projects_completed: number;
  skills_count: number;
  top_skills: string[];
}

// Consultant List Response
export interface ConsultantListResponse {
  consultants: ConsultantListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

// Consultant Filters
export interface ConsultantFilters {
  search?: string;
  city?: string;
  availability?: AvailabilityStatus;
  skill?: string;
  category?: string;
  min_rating?: number;
  min_experience?: number;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// Project Invitation
export interface ProjectInvitation {
  id: string;
  project: string;
  project_title: string;
  consultant: string;
  consultant_name: string;
  invited_by: string;
  invited_by_name: string;
  message: string | null;
  status: InvitationStatus;
  responded_at: string | null;
  expires_at: string;
  is_expired: boolean;
  created_at: string;
}

// Invitation Create Data
export interface InvitationCreateData {
  consultant: string;
  message?: string;
  expires_at: string;
}

// Consultant Dashboard
export interface ConsultantDashboard {
  profile: {
    full_name: string;
    avatar: string | null;
    availability_status: AvailabilityStatus;
    rating: number;
    total_reviews: number;
    total_projects_completed: number;
    total_earned: number;
  };
  stats: {
    pending_invitations: number;
    active_proposals: number;
    portfolio_items: number;
    skills: number;
    certifications: number;
  };
}
