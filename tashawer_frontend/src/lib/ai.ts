import api from './api';

// ============ Types ============

export interface ScopeGenerateRequest {
  description: string;
  language?: 'ar' | 'en';
  category?: string;
  budget_range?: string;
}

export interface ScopeRefineRequest {
  current_scope: string;
  improvement_focus?: string;
}

export interface DeliverablesGenerateRequest {
  scope: string;
  num_milestones?: number;
  additional_requirements?: string;
}

export interface ProposalGenerateRequest {
  project_id?: string;
  project_title?: string;
  project_scope?: string;
  proposed_amount?: number;
  duration?: string;
  additional_notes?: string;
  language?: 'ar' | 'en';
}

export interface ProposalPDFRequest {
  proposal_id?: string;
  proposal_content?: string;
  project_title?: string;
  consultant_name?: string;
  proposed_amount?: string;
}

export interface AIGenerationResult {
  success: boolean;
  scope?: string;
  refined_scope?: string;
  deliverables?: string;
  proposal?: string;
  tokens_used: number;
  processing_time_ms: number;
  error?: string;
}

export interface ScopeGenerateResult {
  title: string | null;
  description: string | null;
  scope: string;
  budget_min: number | null;
  budget_max: number | null;
  estimated_duration_days: number | null;
  budget_reasoning: string | null;
  tokens_used: number;
  processing_time_ms: number;
}

export interface UsageStats {
  limits: {
    daily_limit: number;
    daily_used: number;
    daily_remaining: number;
    monthly_limit: number;
    monthly_used: number;
    monthly_remaining: number;
  };
  totals: {
    total_generations: number;
    total_tokens_used: number;
  };
  recent_generations: Array<{
    id: string;
    type: string;
    status: string;
    tokens_used: number;
    created_at: string;
  }>;
}

// ============ AI APIs ============

/**
 * Generate project scope from description
 */
export async function generateScope(data: ScopeGenerateRequest): Promise<ScopeGenerateResult> {
  const response = await api.post<{ success: boolean; data: ScopeGenerateResult }>(
    '/ai/scope/generate/',
    data
  );
  return response.data.data;
}

/**
 * Refine existing scope
 */
export async function refineScope(data: ScopeRefineRequest): Promise<{ refined_scope: string; tokens_used: number; processing_time_ms: number }> {
  const response = await api.post<{ success: boolean; data: { refined_scope: string; tokens_used: number; processing_time_ms: number } }>(
    '/ai/scope/refine/',
    data
  );
  return response.data.data;
}

/**
 * Generate deliverables from scope
 */
export async function generateDeliverables(data: DeliverablesGenerateRequest): Promise<{ deliverables: string; tokens_used: number; processing_time_ms: number }> {
  const response = await api.post<{ success: boolean; data: { deliverables: string; tokens_used: number; processing_time_ms: number } }>(
    '/ai/scope/deliverables/',
    data
  );
  return response.data.data;
}

export interface ProposalGenerateResult {
  proposal: string;
  estimated_duration_days: number | null;
  estimated_amount: number | null;
  estimation_reasoning: string | null;
  tokens_used: number;
  processing_time_ms: number;
}

/**
 * Generate proposal
 */
export async function generateProposal(data: ProposalGenerateRequest): Promise<ProposalGenerateResult> {
  const response = await api.post<{ success: boolean; data: ProposalGenerateResult }>(
    '/ai/proposal/generate/',
    data
  );
  return response.data.data;
}

/**
 * Generate proposal PDF
 */
export async function generateProposalPDF(data: ProposalPDFRequest): Promise<Blob> {
  const response = await api.post<Blob>(
    '/ai/proposal/pdf/',
    data,
    { responseType: 'blob' }
  );
  return response.data;
}

/**
 * Get AI usage statistics
 */
export async function getUsageStats(): Promise<UsageStats> {
  const response = await api.get<{ success: boolean; data: UsageStats }>(
    '/ai/usage/'
  );
  return response.data.data;
}

/**
 * Download proposal PDF
 */
export function downloadProposalPDF(blob: Blob, filename?: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `proposal_${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
