import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Token management
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const getAccessToken = (): string | undefined => {
  if (typeof window !== 'undefined') {
    return Cookies.get(ACCESS_TOKEN_KEY);
  }
  return undefined;
};

export const getRefreshToken = (): string | undefined => {
  if (typeof window !== 'undefined') {
    return Cookies.get(REFRESH_TOKEN_KEY);
  }
  return undefined;
};

export const setTokens = (access: string, refresh: string): void => {
  Cookies.set(ACCESS_TOKEN_KEY, access, { expires: 1 }); // 1 day
  Cookies.set(REFRESH_TOKEN_KEY, refresh, { expires: 7 }); // 7 days
};

export const clearTokens = (): void => {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data.data;
          Cookies.set(ACCESS_TOKEN_KEY, access, { expires: 1 });

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API helper functions
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      error?: { message?: string };
      message?: string;
      errors?: Record<string, string[]>;
    }>;
    const data = axiosError.response?.data;

    // Check for validation errors with field-specific messages
    if (data?.errors) {
      const errorMessages = Object.entries(data.errors)
        .map(([field, messages]) => {
          const fieldName = field.replace(/_/g, ' ');
          return messages.map(msg => `${msg}`).join(', ');
        })
        .join('. ');
      return errorMessages || 'Validation error';
    }

    // Check for error object with message
    if (data?.error?.message) {
      return data.error.message;
    }

    // Check for direct message
    if (data?.message) {
      return data.message;
    }

    return axiosError.message || 'An error occurred';
  }
  return 'An unexpected error occurred';
};
