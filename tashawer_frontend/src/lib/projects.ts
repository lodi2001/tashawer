import api from './api';
import type {
  ApiResponse,
  Category,
  ProjectListItem,
  ProjectDetail,
  ProjectCreateData,
  ProjectUpdateData,
  ProjectListResponse,
  BrowseProjectsResponse,
  ProjectFilters,
  ProjectAttachment,
} from '@/types';

// Get all active categories
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<ApiResponse<Category[]>>('/projects/categories/');
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch categories');
};

// Get client's projects (My Projects)
export const getMyProjects = async (
  page = 1,
  pageSize = 20,
  status?: string
): Promise<ProjectListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (status) {
    params.append('status', status);
  }

  const response = await api.get<ApiResponse<ProjectListResponse>>(
    `/projects/my-projects/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch projects');
};

// Browse open projects (for consultants)
export const browseProjects = async (
  filters: ProjectFilters = {}
): Promise<BrowseProjectsResponse> => {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', filters.page.toString());
  if (filters.page_size) params.append('page_size', filters.page_size.toString());
  if (filters.category) params.append('category', filters.category);
  if (filters.budget_min) params.append('budget_min', filters.budget_min.toString());
  if (filters.budget_max) params.append('budget_max', filters.budget_max.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.location) params.append('location', filters.location);
  if (filters.deadline_before) params.append('deadline_before', filters.deadline_before);
  if (filters.deadline_after) params.append('deadline_after', filters.deadline_after);
  if (filters.sort) params.append('sort', filters.sort);

  const response = await api.get<ApiResponse<BrowseProjectsResponse>>(
    `/projects/browse/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to browse projects');
};

// Create a new project
export const createProject = async (data: ProjectCreateData): Promise<ProjectDetail> => {
  const response = await api.post<ApiResponse<ProjectDetail>>('/projects/', data);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to create project');
};

// Get project details
export const getProject = async (id: string): Promise<ProjectDetail> => {
  const response = await api.get<ApiResponse<ProjectDetail>>(`/projects/${id}/`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch project');
};

// Update project
export const updateProject = async (
  id: string,
  data: ProjectUpdateData
): Promise<ProjectDetail> => {
  const response = await api.patch<ApiResponse<ProjectDetail>>(`/projects/${id}/update/`, data);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to update project');
};

// Delete project (draft only)
export const deleteProject = async (id: string): Promise<void> => {
  const response = await api.delete<ApiResponse<null>>(`/projects/${id}/delete/`);
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete project');
  }
};

// Publish project (draft -> open)
export const publishProject = async (id: string): Promise<ProjectDetail> => {
  const response = await api.post<ApiResponse<ProjectDetail>>(`/projects/${id}/publish/`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to publish project');
};

// Cancel project
export const cancelProject = async (id: string): Promise<ProjectDetail> => {
  const response = await api.post<ApiResponse<ProjectDetail>>(`/projects/${id}/cancel/`);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to cancel project');
};

// Get project attachments
export const getAttachments = async (projectId: string): Promise<ProjectAttachment[]> => {
  const response = await api.get<ApiResponse<ProjectAttachment[]>>(
    `/projects/${projectId}/attachments/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch attachments');
};

// Upload attachment
export const uploadAttachment = async (
  projectId: string,
  file: File
): Promise<ProjectAttachment> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ApiResponse<ProjectAttachment>>(
    `/projects/${projectId}/attachments/upload/`,
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
  throw new Error(response.data.error?.message || 'Failed to upload attachment');
};

// Delete attachment
export const deleteAttachment = async (
  projectId: string,
  attachmentId: string
): Promise<void> => {
  const response = await api.delete<ApiResponse<null>>(
    `/projects/${projectId}/attachments/${attachmentId}/`
  );
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete attachment');
  }
};
