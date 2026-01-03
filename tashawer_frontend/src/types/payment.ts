// Transaction types
export type TransactionType = 'payment' | 'deposit' | 'withdrawal' | 'escrow_hold' | 'escrow_release' | 'refund' | 'platform_fee';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'mada' | 'apple_pay' | 'stc_pay';

// Escrow types
export type EscrowStatus = 'pending' | 'funded' | 'held' | 'released' | 'refunded' | 'disputed' | 'cancelled';

// Transaction list item
export interface TransactionListItem {
  id: string;
  transaction_type: TransactionType;
  status: TransactionStatus;
  amount: string;
  currency: string;
  reference_number: string;
  project_title: string | null;
  created_at: string;
}

// Transaction detail
export interface TransactionDetail extends TransactionListItem {
  payer: { id: string; full_name: string };
  payee: { id: string; full_name: string } | null;
  payment_method: PaymentMethod | null;
  description: string | null;
  gateway_transaction_id: string | null;
  completed_at: string | null;
  updated_at: string;
}

// Escrow list item
export interface EscrowListItem {
  id: string;
  escrow_reference: string;
  project_title: string;
  consultant_name: string;
  client_name: string;
  amount: string;
  consultant_amount: string;
  platform_fee: string;
  status: EscrowStatus;
  created_at: string;
}

// Escrow detail
export interface EscrowDetail extends EscrowListItem {
  project: { id: string; title: string; status: string };
  proposal: { id: string; status: string };
  client: { id: string; full_name: string };
  consultant: { id: string; full_name: string };
  currency: string;
  can_release: boolean;
  can_refund: boolean;
  funded_at: string | null;
  released_at: string | null;
  refunded_at: string | null;
  release_note: string | null;
  refund_reason: string | null;
  updated_at: string;
}

// Invoice list item
export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  amount: string;
  status: string;
  invoice_type: string;
  created_at: string;
}

// Invoice detail
export interface InvoiceDetail extends InvoiceListItem {
  project: { id: string; title: string };
  payer: { id: string; full_name: string; email: string };
  payee: { id: string; full_name: string; email: string } | null;
  escrow: { id: string; escrow_reference: string } | null;
  currency: string;
  platform_fee: string;
  subtotal: string;
  total: string;
  description: string | null;
  due_date: string;
  paid_at: string | null;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: string;
    amount: string;
  }>;
  updated_at: string;
}

// Transaction summary
export interface TransactionSummary {
  total_payments: string;
  total_received: string;
  total_platform_fees: string;
  pending_escrow: string;
}

// Payment list responses
export interface TransactionListResponse {
  transactions: TransactionListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

export interface EscrowListResponse {
  escrows: EscrowListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

export interface InvoiceListResponse {
  invoices: InvoiceListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

// Create escrow request
export interface EscrowCreateData {
  proposal_id: string;
}

// Payment initialize request
export interface PaymentInitializeRequest {
  escrow_id: string;
  payment_method: PaymentMethod;
  return_url?: string;
}

// Payment initialize response
export interface PaymentInitializeResponse {
  transaction_reference: string;
  escrow_reference: string;
  amount: string;
  currency: string;
  payment_url: string;
  charge_id?: string;
  status: string;
  test_mode?: boolean;
}

// Payment status response
export interface PaymentStatusResponse {
  reference_number: string;
  status: TransactionStatus;
  amount: string;
  currency: string;
  completed_at: string | null;
  escrow_status: EscrowStatus | null;
}

// Mock payment action
export type MockPaymentAction = 'complete' | 'fail' | 'cancel';

// Wallet types
export type WalletStatus = 'active' | 'frozen' | 'suspended';
export type DepositStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Wallet
export interface Wallet {
  id: string;
  user_email: string;
  user_name: string;
  balance: string;
  pending_balance: string;
  available_balance: string;
  currency: string;
  status: WalletStatus;
  is_active: boolean;
  total_deposited: string;
  total_withdrawn: string;
  total_earned: string;
  total_spent: string;
  created_at: string;
  updated_at: string;
}

// Wallet balance (lightweight)
export interface WalletBalance {
  balance: string;
  pending_balance: string;
  available_balance: string;
  currency: string;
  status: WalletStatus;
}

// Deposit list item
export interface DepositListItem {
  id: string;
  reference_number: string;
  amount: string;
  currency: string;
  status: DepositStatus;
  payment_method: string | null;
  created_at: string;
  completed_at: string | null;
}

// Deposit detail
export interface DepositDetail extends DepositListItem {
  gateway_charge_id: string | null;
  failure_reason: string | null;
}

// Deposit list response
export interface DepositListResponse {
  results: DepositListItem[];
  count: number;
}

// Deposit initialize request
export interface DepositInitializeRequest {
  amount: number;
  payment_method?: PaymentMethod;
  return_url?: string;
}

// Deposit initialize response
export interface DepositInitializeResponse {
  deposit_reference: string;
  amount: string;
  currency: string;
  payment_url: string;
  charge_id?: string;
  status: string;
  test_mode?: boolean;
}

// Deposit status response
export interface DepositStatusResponse {
  reference_number: string;
  status: DepositStatus;
  amount: string;
  currency: string;
  completed_at: string | null;
  wallet_balance: string | null;
}

// Withdrawal types
export type WithdrawalStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled';

// Bank Account
export interface BankAccount {
  id: string;
  bank_name: string;
  bank_name_ar: string | null;
  account_holder_name: string;
  iban: string;
  masked_iban: string;
  swift_code: string | null;
  is_verified: boolean;
  is_primary: boolean;
  created_at: string;
}

// Bank Account Create
export interface BankAccountCreateData {
  bank_name: string;
  bank_name_ar?: string;
  account_holder_name: string;
  iban: string;
  swift_code?: string;
  is_primary?: boolean;
}

// Withdrawal list item
export interface WithdrawalListItem {
  id: string;
  reference_number: string;
  amount: string;
  fee: string;
  net_amount: string;
  currency: string;
  status: WithdrawalStatus;
  bank_account_display: string;
  created_at: string;
  completed_at: string | null;
}

// Withdrawal detail
export interface WithdrawalDetail extends Omit<WithdrawalListItem, 'bank_account_display'> {
  bank_account: BankAccount;
  bank_reference: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  approved_at: string | null;
  processed_at: string | null;
  user_note: string | null;
}

// Withdrawal list response
export interface WithdrawalListResponse {
  results: WithdrawalListItem[];
  count: number;
}

// Withdrawal create request
export interface WithdrawalCreateRequest {
  amount: number;
  bank_account_id: string;
  note?: string;
}
