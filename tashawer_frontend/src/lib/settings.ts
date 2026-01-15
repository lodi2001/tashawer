import api from './api';

// ============ Types ============

export interface AISettings {
  anthropic_api_key_set: boolean;
  ai_enabled: boolean;
  ai_daily_limit_per_user: number;
  ai_monthly_limit_per_user: number;
}

export interface PaymentSettings {
  tap_secret_key_set: boolean;
  tap_public_key: string;
}

export interface PlatformSettingsData {
  platform_fee_percentage: number;
  maintenance_mode: boolean;
  maintenance_message: string;
}

export interface PlatformSettings {
  ai_settings: AISettings;
  payment_settings: PaymentSettings;
  platform_settings: PlatformSettingsData;
  updated_at: string;
}

export interface UpdateSettingsRequest {
  // AI Settings
  anthropic_api_key?: string;
  ai_enabled?: boolean;
  ai_daily_limit_per_user?: number;
  ai_monthly_limit_per_user?: number;
  // Payment Settings
  tap_secret_key?: string;
  tap_public_key?: string;
  // Platform Settings
  platform_fee_percentage?: number;
  maintenance_mode?: boolean;
  maintenance_message?: string;
}

export interface TestAIResponse {
  success: boolean;
  message: string;
  connected: boolean;
  test_response?: string;
}

// ============ API Functions ============

/**
 * Get platform settings (admin only)
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const response = await api.get<{ success: boolean; data: PlatformSettings }>(
    '/analytics/admin/settings/'
  );
  return response.data.data;
}

/**
 * Update platform settings (admin only)
 */
export async function updatePlatformSettings(data: UpdateSettingsRequest): Promise<PlatformSettings> {
  const response = await api.patch<{ success: boolean; data: PlatformSettings }>(
    '/analytics/admin/settings/',
    data
  );
  return response.data.data;
}

/**
 * Test AI connection (admin only)
 */
export async function testAIConnection(): Promise<TestAIResponse> {
  const response = await api.post<TestAIResponse>(
    '/analytics/admin/settings/test-ai/'
  );
  return response.data;
}
