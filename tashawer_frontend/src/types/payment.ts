// Transaction types
export type TransactionType = 'payment' | 'escrow_hold' | 'escrow_release' | 'refund' | 'platform_fee';
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

// Payment initialize response
export interface PaymentInitializeResponse {
  payment_url: string;
  reference_number: string;
}
