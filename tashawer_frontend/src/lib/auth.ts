import api, { setTokens, clearTokens, getAccessToken } from './api';
import type {
  ApiResponse,
  LoginCredentials,
  LoginResponse,
  RegisterIndividualData,
  RegisterOrganizationData,
  RegisterConsultantData,
  RegistrationResponse,
  User,
  UserTypeOption,
  UserRolesResponse,
  UserProfile,
} from '@/types';

// Get user types for registration (legacy)
export const getUserTypes = async (): Promise<UserTypeOption[]> => {
  const response = await api.get<ApiResponse<UserTypeOption[]>>('/auth/user-types/');
  return response.data.data || [];
};

// Get user roles and types for new 2-step registration flow
export const getUserRoles = async (): Promise<UserRolesResponse> => {
  const response = await api.get<ApiResponse<UserRolesResponse>>('/auth/user-roles/');
  return response.data.data || { roles: [], types: [] };
};

// Login
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await api.post<ApiResponse<LoginResponse>>('/auth/login/', credentials);
  if (response.data.success && response.data.data) {
    const { tokens } = response.data.data;
    setTokens(tokens.access, tokens.refresh);
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Login failed');
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout/');
  } catch {
    // Ignore logout errors
  } finally {
    clearTokens();
  }
};

// Register Individual
export const registerIndividual = async (
  data: RegisterIndividualData
): Promise<RegistrationResponse> => {
  const response = await api.post<ApiResponse<RegistrationResponse>>(
    '/auth/register/individual/',
    data
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Registration failed');
};

// Register Organization
export const registerOrganization = async (
  data: RegisterOrganizationData
): Promise<RegistrationResponse> => {
  const response = await api.post<ApiResponse<RegistrationResponse>>(
    '/auth/register/organization/',
    data
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Registration failed');
};

// Register Consultant
export const registerConsultant = async (
  data: RegisterConsultantData
): Promise<RegistrationResponse> => {
  const response = await api.post<ApiResponse<RegistrationResponse>>(
    '/auth/register/consultant/',
    data
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Registration failed');
};

// Email verification
export const verifyEmail = async (token: string): Promise<void> => {
  const response = await api.post<ApiResponse<null>>('/auth/verify-email/', { token });
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Verification failed');
  }
};

// Resend verification email
export const resendVerification = async (email: string): Promise<void> => {
  const response = await api.post<ApiResponse<null>>('/auth/resend-verification/', { email });
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to resend verification');
  }
};

// Forgot password
export const forgotPassword = async (email: string): Promise<void> => {
  await api.post<ApiResponse<null>>('/auth/forgot-password/', { email });
};

// Reset password
export const resetPassword = async (
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> => {
  const response = await api.post<ApiResponse<null>>('/auth/reset-password/', {
    token,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Password reset failed');
  }
};

// Get current user profile
export const getProfile = async (): Promise<UserProfile> => {
  const response = await api.get<ApiResponse<UserProfile>>('/auth/profile/');
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to get profile');
};

// Update profile
export const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await api.patch<ApiResponse<UserProfile>>('/auth/profile/', data);
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to update profile');
};

// Upload avatar
export const uploadAvatar = async (file: File): Promise<{ avatar_url: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ApiResponse<{ avatar_url: string }>>(
    '/auth/profile/avatar/',
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
  throw new Error(response.data.error?.message || 'Failed to upload avatar');
};

// Delete avatar
export const deleteAvatar = async (): Promise<void> => {
  const response = await api.delete<ApiResponse<null>>('/auth/profile/avatar/');
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete avatar');
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};
