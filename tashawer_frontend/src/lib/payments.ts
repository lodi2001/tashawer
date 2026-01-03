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
  Wallet,
  WalletBalance,
  DepositListItem,
  DepositDetail,
  DepositListResponse,
  DepositInitializeRequest,
  DepositInitializeResponse,
  DepositStatusResponse,
  BankAccount,
  BankAccountCreateData,
  WithdrawalListItem,
  WithdrawalDetail,
  WithdrawalListResponse,
  WithdrawalCreateRequest,
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

// ============ Wallet ============

// Get wallet details
export const getWallet = async (): Promise<Wallet> => {
  const response = await api.get<ApiResponse<Wallet>>('/payments/wallet/');
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch wallet');
};

// Get wallet balance (lightweight)
export const getWalletBalance = async (): Promise<WalletBalance> => {
  const response = await api.get<ApiResponse<WalletBalance>>('/payments/wallet/balance/');
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch wallet balance');
};

// ============ Deposits ============

// Get deposit list
export const getDeposits = async (
  page = 1,
  pageSize = 20
): Promise<DepositListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  const response = await api.get<ApiResponse<DepositListResponse>>(
    `/payments/deposits/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch deposits');
};

// Get deposit detail
export const getDeposit = async (referenceNumber: string): Promise<DepositDetail> => {
  const response = await api.get<ApiResponse<DepositDetail>>(
    `/payments/deposits/${referenceNumber}/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch deposit');
};

// Initialize deposit
export const initializeDeposit = async (
  data: DepositInitializeRequest
): Promise<DepositInitializeResponse> => {
  const response = await api.post<ApiResponse<DepositInitializeResponse>>(
    '/payments/deposits/initialize/',
    data
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to initialize deposit');
};

// Get deposit status
export const getDepositStatus = async (
  referenceNumber: string
): Promise<DepositStatusResponse> => {
  const response = await api.get<ApiResponse<DepositStatusResponse>>(
    `/payments/deposits/${referenceNumber}/status/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to get deposit status');
};

// Mock deposit for testing
export const mockDeposit = async (
  referenceNumber: string,
  action: MockPaymentAction = 'complete'
): Promise<{ deposit_reference: string; status: string; wallet_balance?: string }> => {
  const response = await api.post<ApiResponse<{ deposit_reference: string; status: string; wallet_balance?: string }>>(
    `/payments/deposits/mock/${referenceNumber}/`,
    { action }
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to process mock deposit');
};

// ============ Bank Accounts ============

// Get bank account list
export const getBankAccounts = async (): Promise<BankAccount[]> => {
  const response = await api.get<ApiResponse<BankAccount[]>>('/payments/bank-accounts/');
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch bank accounts');
};

// Create bank account
export const createBankAccount = async (data: BankAccountCreateData): Promise<BankAccount> => {
  const response = await api.post<ApiResponse<BankAccount>>(
    '/payments/bank-accounts/create/',
    data
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to create bank account');
};

// Delete bank account
export const deleteBankAccount = async (id: string): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>(`/payments/bank-accounts/${id}/`);
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete bank account');
  }
};

// Set bank account as primary
export const setBankAccountPrimary = async (id: string): Promise<void> => {
  const response = await api.post<ApiResponse<void>>(`/payments/bank-accounts/${id}/set-primary/`);
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to set primary bank account');
  }
};

// ============ Withdrawals ============

// Get withdrawal list
export const getWithdrawals = async (
  page = 1,
  pageSize = 20
): Promise<WithdrawalListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  const response = await api.get<ApiResponse<WithdrawalListResponse>>(
    `/payments/withdrawals/?${params.toString()}`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch withdrawals');
};

// Get withdrawal detail
export const getWithdrawal = async (referenceNumber: string): Promise<WithdrawalDetail> => {
  const response = await api.get<ApiResponse<WithdrawalDetail>>(
    `/payments/withdrawals/${referenceNumber}/`
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to fetch withdrawal');
};

// Create withdrawal
export const createWithdrawal = async (data: WithdrawalCreateRequest): Promise<WithdrawalDetail> => {
  const response = await api.post<ApiResponse<WithdrawalDetail>>(
    '/payments/withdrawals/create/',
    data
  );
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'Failed to create withdrawal');
};

// Cancel withdrawal
export const cancelWithdrawal = async (referenceNumber: string): Promise<void> => {
  const response = await api.post<ApiResponse<void>>(
    `/payments/withdrawals/${referenceNumber}/cancel/`
  );
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to cancel withdrawal');
  }
};
