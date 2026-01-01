import api from './api';
import type {
  ConsultantListResponse,
  ConsultantPublicProfile,
  ConsultantFilters,
  ConsultantPortfolio,
  PortfolioCreateData,
  ConsultantSkill,
  SkillCreateData,
  ConsultantCertification,
  CertificationCreateData,
  ProjectInvitation,
  InvitationCreateData,
  ConsultantDashboard,
  AvailabilityStatus,
} from '@/types';

// Browse Consultants
export const getConsultants = async (
  filters: ConsultantFilters = {}
): Promise<ConsultantListResponse> => {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.city) params.append('city', filters.city);
  if (filters.availability) params.append('availability', filters.availability);
  if (filters.skill) params.append('skill', filters.skill);
  if (filters.category) params.append('category', filters.category);
  if (filters.min_rating) params.append('min_rating', filters.min_rating.toString());
  if (filters.min_experience) params.append('min_experience', filters.min_experience.toString());
  if (filters.ordering) params.append('ordering', filters.ordering);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.page_size) params.append('page_size', filters.page_size.toString());

  const response = await api.get(`/consultants/?${params.toString()}`);
  return response.data;
};

// Get Consultant Public Profile
export const getConsultantProfile = async (
  userId: string
): Promise<ConsultantPublicProfile> => {
  const response = await api.get(`/consultants/${userId}/`);
  return response.data;
};

// Get Consultant Dashboard
export const getConsultantDashboard = async (): Promise<ConsultantDashboard> => {
  const response = await api.get('/consultants/dashboard/');
  return response.data;
};

// Portfolio Management
export const getMyPortfolio = async (): Promise<ConsultantPortfolio[]> => {
  const response = await api.get('/consultants/portfolio/');
  return response.data;
};

export const createPortfolioItem = async (
  data: PortfolioCreateData
): Promise<ConsultantPortfolio> => {
  const response = await api.post('/consultants/portfolio/', data);
  return response.data;
};

export const updatePortfolioItem = async (
  id: string,
  data: Partial<PortfolioCreateData>
): Promise<ConsultantPortfolio> => {
  const response = await api.put(`/consultants/portfolio/${id}/`, data);
  return response.data;
};

export const deletePortfolioItem = async (id: string): Promise<void> => {
  await api.delete(`/consultants/portfolio/${id}/`);
};

export const uploadPortfolioImages = async (
  portfolioId: string,
  images: File[],
  caption?: string
): Promise<void> => {
  const formData = new FormData();
  images.forEach((image) => {
    formData.append('images', image);
  });
  if (caption) {
    formData.append('caption', caption);
  }

  await api.post(`/consultants/portfolio/${portfolioId}/images/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deletePortfolioImage = async (
  portfolioId: string,
  imageId: string
): Promise<void> => {
  await api.delete(`/consultants/portfolio/${portfolioId}/images/${imageId}/`);
};

// Skills Management
export const getMySkills = async (): Promise<ConsultantSkill[]> => {
  const response = await api.get('/consultants/skills/');
  return response.data;
};

export const createSkill = async (data: SkillCreateData): Promise<ConsultantSkill> => {
  const response = await api.post('/consultants/skills/', data);
  return response.data;
};

export const updateSkill = async (
  id: string,
  data: Partial<SkillCreateData>
): Promise<ConsultantSkill> => {
  const response = await api.put(`/consultants/skills/${id}/`, data);
  return response.data;
};

export const deleteSkill = async (id: string): Promise<void> => {
  await api.delete(`/consultants/skills/${id}/`);
};

// Certifications Management
export const getMyCertifications = async (): Promise<ConsultantCertification[]> => {
  const response = await api.get('/consultants/certifications/');
  return response.data;
};

export const createCertification = async (
  data: CertificationCreateData
): Promise<ConsultantCertification> => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('issuing_organization', data.issuing_organization);
  formData.append('issue_date', data.issue_date);

  if (data.name_ar) formData.append('name_ar', data.name_ar);
  if (data.credential_id) formData.append('credential_id', data.credential_id);
  if (data.credential_url) formData.append('credential_url', data.credential_url);
  if (data.expiry_date) formData.append('expiry_date', data.expiry_date);
  if (data.document) formData.append('document', data.document);

  const response = await api.post('/consultants/certifications/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateCertification = async (
  id: string,
  data: Partial<CertificationCreateData>
): Promise<ConsultantCertification> => {
  const formData = new FormData();

  if (data.name) formData.append('name', data.name);
  if (data.name_ar) formData.append('name_ar', data.name_ar);
  if (data.issuing_organization) formData.append('issuing_organization', data.issuing_organization);
  if (data.credential_id) formData.append('credential_id', data.credential_id);
  if (data.credential_url) formData.append('credential_url', data.credential_url);
  if (data.issue_date) formData.append('issue_date', data.issue_date);
  if (data.expiry_date) formData.append('expiry_date', data.expiry_date);
  if (data.document) formData.append('document', data.document);

  const response = await api.put(`/consultants/certifications/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteCertification = async (id: string): Promise<void> => {
  await api.delete(`/consultants/certifications/${id}/`);
};

// Availability Status
export const updateAvailabilityStatus = async (
  status: AvailabilityStatus
): Promise<{ availability_status: AvailabilityStatus }> => {
  const response = await api.put('/consultants/availability/', {
    availability_status: status,
  });
  return response.data;
};

// Project Invitations (for consultants)
export const getMyInvitations = async (): Promise<ProjectInvitation[]> => {
  const response = await api.get('/consultants/invitations/');
  return response.data;
};

export const acceptInvitation = async (
  invitationId: string
): Promise<{ message: string; invitation: ProjectInvitation }> => {
  const response = await api.post(`/consultants/invitations/${invitationId}/accept/`);
  return response.data;
};

export const declineInvitation = async (
  invitationId: string
): Promise<{ message: string; invitation: ProjectInvitation }> => {
  const response = await api.post(`/consultants/invitations/${invitationId}/decline/`);
  return response.data;
};

// Project Invitations (for clients)
export const getProjectInvitations = async (
  projectId: string
): Promise<ProjectInvitation[]> => {
  const response = await api.get(`/projects/${projectId}/invitations/`);
  return response.data;
};

export const createProjectInvitation = async (
  projectId: string,
  data: InvitationCreateData
): Promise<ProjectInvitation> => {
  const response = await api.post(`/projects/${projectId}/invitations/`, data);
  return response.data;
};
