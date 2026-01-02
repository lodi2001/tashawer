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
  PaymentInitializeRequest,
  PaymentInitializeResponse,
  PaymentStatusResponse,
  PaymentMethod,
  MockPaymentAction,
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
  escrowId: string,
  paymentMethod: PaymentMethod = 'credit_card',
  returnUrl?: string
): Promise<PaymentInitializeResponse> => {
  const data: PaymentInitializeRequest = {
    escrow_id: escrowId,
    payment_method: paymentMethod,
  };

  if (returnUrl) {
    data.return_url = returnUrl;
  }

  const response = await api.post<ApiResponse<PaymentInitializeResponse>>(
    '/payments/initialize/',
    data
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to initialize payment');
};

// Check payment status
export const getPaymentStatus = async (
  referenceNumber: string
): Promise<PaymentStatusResponse> => {
  const response = await api.get<ApiResponse<PaymentStatusResponse>>(
    `/payments/status/${referenceNumber}/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to get payment status');
};

// Mock payment for testing (only works in test mode)
export const mockPayment = async (
  referenceNumber: string,
  action: MockPaymentAction = 'complete'
): Promise<{ transaction_reference: string; status: string }> => {
  const response = await api.post<ApiResponse<{ transaction_reference: string; status: string }>>(
    `/payments/mock-payment/${referenceNumber}/`,
    { action }
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to process mock payment');
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
