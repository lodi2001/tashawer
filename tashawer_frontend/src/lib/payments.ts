import api from './api';
import type {
  ApiResponse,
  TransactionListItem,
  TransactionDetail,
  TransactionListResponse,
  TransactionSummary,
  EscrowListItem,
  EscrowDetail,
  EscrowListResponse,
  EscrowCreateData,
  InvoiceListItem,
  InvoiceDetail,
  InvoiceListResponse,
  PaymentInitializeResponse,
} from '@/types';

// ============ Transactions ============

// Get transaction list
export const getTransactions = async (
  page = 1,
  pageSize = 20
): Promise<TransactionListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  const response = await api.get<ApiResponse<TransactionListResponse>>(
    `/payments/transactions/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch transactions');
};

// Get transaction detail
export const getTransaction = async (id: string): Promise<TransactionDetail> => {
  const response = await api.get<ApiResponse<TransactionDetail>>(
    `/payments/transactions/${id}/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch transaction');
};

// Get transaction summary
export const getTransactionSummary = async (): Promise<TransactionSummary> => {
  const response = await api.get<ApiResponse<TransactionSummary>>(
    '/payments/transactions/summary/'
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch summary');
};

// ============ Escrows ============

// Get escrow list
export const getEscrows = async (
  page = 1,
  pageSize = 20
): Promise<EscrowListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  const response = await api.get<ApiResponse<EscrowListResponse>>(
    `/payments/escrow/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch escrows');
};

// Get escrow detail
export const getEscrow = async (id: string): Promise<EscrowDetail> => {
  const response = await api.get<ApiResponse<EscrowDetail>>(
    `/payments/escrow/${id}/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch escrow');
};

// Create escrow
export const createEscrow = async (data: EscrowCreateData): Promise<EscrowDetail> => {
  const response = await api.post<ApiResponse<EscrowDetail>>(
    '/payments/escrow/create/',
    data
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to create escrow');
};

// Release escrow
export const releaseEscrow = async (id: string, note?: string): Promise<EscrowDetail> => {
  const response = await api.post<ApiResponse<EscrowDetail>>(
    `/payments/escrow/${id}/release/`,
    { note }
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to release escrow');
};

// Refund escrow
export const refundEscrow = async (id: string, reason?: string): Promise<EscrowDetail> => {
  const response = await api.post<ApiResponse<EscrowDetail>>(
    `/payments/escrow/${id}/refund/`,
    { reason }
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to refund escrow');
};

// Initialize payment for escrow
export const initializePayment = async (
  escrowId: string
): Promise<PaymentInitializeResponse> => {
  const response = await api.post<ApiResponse<PaymentInitializeResponse>>(
    '/payments/initialize/',
    { escrow_id: escrowId }
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to initialize payment');
};

// ============ Invoices ============

// Get invoice list
export const getInvoices = async (
  page = 1,
  pageSize = 20
): Promise<InvoiceListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  const response = await api.get<ApiResponse<InvoiceListResponse>>(
    `/payments/invoices/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch invoices');
};

// Get invoice detail
export const getInvoice = async (id: string): Promise<InvoiceDetail> => {
  const response = await api.get<ApiResponse<InvoiceDetail>>(
    `/payments/invoices/${id}/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch invoice');
};

// Download invoice
export const downloadInvoice = async (id: string): Promise<Blob> => {
  const response = await api.get(`/payments/invoices/${id}/download/`, {
    responseType: 'blob',
  });
  return response.data;
};
