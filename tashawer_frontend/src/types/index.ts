// User Types
export type UserRole = 'client' | 'consultant' | 'admin';
export type UserType = 'individual' | 'organization';
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'deactivated';
export type ConsultantType = 'individual' | 'office';
export type CompanyType = 'company' | 'engineering_office' | 'government' | 'other';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code?: number;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// User Types
export interface User {
  id: string;
  email: string;
  mobile: string | null;
  role: UserRole;
  user_type: UserType;
  registration_no: string;
  is_verified: boolean;
  is_approved: boolean;
  account_status: AccountStatus;
  preferred_language: 'ar' | 'en';
  full_name: string;
  created_at: string;
  last_login_at: string | null;
}

export interface UserTypeOption {
  value: UserType;
  label: string;
  label_ar: string;
  description: string;
  description_ar: string;
}

export interface UserRoleOption {
  value: UserRole;
  label: string;
  label_ar: string;
  description: string;
  description_ar: string;
}

export interface UserRolesResponse {
  roles: UserRoleOption[];
  types: UserTypeOption[];
}

// Profile Types
export interface IndividualProfile {
  id: string;
  user: User;
  full_name: string;
  full_name_ar: string | null;
  national_id: string | null;
  date_of_birth: string | null;
  city: string | null;
  address: string | null;
  avatar: string | null;
  bio: string | null;
  total_projects_posted: number;
  total_spent: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationProfile {
  id: string;
  user: User;
  company_name: string;
  company_name_ar: string | null;
  company_type: CompanyType;
  commercial_registration_no: string | null;
  vat_number: string | null;
  representative_name: string;
  representative_position: string | null;
  representative_mobile: string | null;
  city: string | null;
  address: string | null;
  logo: string | null;
  commercial_registration_doc: string | null;
  total_projects_posted: number;
  total_spent: string;
  created_at: string;
  updated_at: string;
}

export interface ConsultantProfile {
  id: string;
  user: User;
  consultant_type: ConsultantType;
  full_name: string;
  full_name_ar: string | null;
  specialization: string | null;
  experience_years: number;
  hourly_rate: string | null;
  saudi_engineering_license_no: string | null;
  license_document: string | null;
  skills: string[];
  certifications: string[];
  avatar: string | null;
  bio: string | null;
  bio_ar: string | null;
  portfolio_url: string | null;
  city: string | null;
  availability_status: 'available' | 'busy' | 'not_available';
  rating: string;
  total_reviews: number;
  total_projects_completed: number;
  total_earned: string;
  commercial_registration_no: string | null;
  created_at: string;
  updated_at: string;
}

export type UserProfile = IndividualProfile | OrganizationProfile | ConsultantProfile;

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface RegisterIndividualData {
  email: string;
  mobile: string;
  password: string;
  confirm_password: string;
  full_name: string;
  full_name_ar?: string;
  national_id?: string;
  city?: string;
}

export interface RegisterOrganizationData {
  email: string;
  mobile: string;
  password: string;
  confirm_password: string;
  company_name: string;
  company_name_ar?: string;
  company_type: CompanyType;
  commercial_registration_no?: string;
  vat_number?: string;
  representative_name: string;
  representative_position?: string;
  representative_mobile?: string;
  city?: string;
  address?: string;
}

export interface RegisterConsultantData {
  email: string;
  mobile: string;
  password: string;
  confirm_password: string;
  consultant_type: ConsultantType;
  full_name: string;
  full_name_ar?: string;
  specialization?: string;
  experience_years?: number;
  hourly_rate?: number;
  saudi_engineering_license_no?: string;
  bio?: string;
  bio_ar?: string;
  city?: string;
  commercial_registration_no?: string;
}

export interface RegistrationResponse {
  user_id: string;
  email: string;
  registration_no: string;
  role: UserRole;
  user_type: UserType;
}

// Admin Types
export interface AdminUserListItem {
  id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  role: UserRole;
  user_type: UserType;
  account_status: AccountStatus;
  is_verified: boolean;
  is_approved: boolean;
  registration_no: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_email: string | null;
  target_user_email: string | null;
  action: string;
  action_display: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

// Re-export project types
export * from './project';

// Re-export proposal types
export * from './proposal';

// Re-export message types
export * from './message';

// Re-export payment types
export * from './payment';

// Re-export review types
export * from './review';

// Re-export consultant types
export * from './consultant';

// Re-export order types
export * from './order';
