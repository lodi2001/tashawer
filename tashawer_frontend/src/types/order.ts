// Order Status Types
export type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'in_progress'
  | 'under_review'
  | 'revision_requested'
  | 'completed'
  | 'cancelled'
  | 'disputed';

// Milestone Status Types
export type MilestoneStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'revision_requested'
  | 'approved'
  | 'completed'
  | 'cancelled';

// Minimal info types
export interface OrderClientInfo {
  id: string;
  full_name: string;
  email: string;
}

export interface OrderConsultantInfo {
  id: string;
  full_name: string;
  email: string;
}

export interface OrderProjectInfo {
  id: string;
  title: string;
  category: string;
}

// Deliverable
export interface Deliverable {
  id: string;
  milestone_id: string;
  file: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  description: string | null;
  uploaded_by: string;
  uploaded_by_name: string;
  created_at: string;
}

// Milestone
export interface MilestoneListItem {
  id: string;
  order_id: string;
  title: string;
  description: string;
  sequence: number;
  status: MilestoneStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface MilestoneDetail extends MilestoneListItem {
  consultant_notes: string | null;
  client_feedback: string | null;
  revision_notes: string | null;
  deliverables: Deliverable[];
  can_start: boolean;
  can_submit: boolean;
  can_approve: boolean;
  can_request_revision: boolean;
  started_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
}

// Order Activity
export interface OrderActivity {
  id: string;
  activity_type: string;
  description: string;
  user_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Order List Item
export interface OrderListItem {
  id: string;
  order_number: string;
  project: OrderProjectInfo;
  client: OrderClientInfo;
  consultant: OrderConsultantInfo;
  status: OrderStatus;
  total_amount: string;
  expected_delivery_date: string;
  progress_percentage: number;
  created_at: string;
}

// Order Detail
export interface OrderDetail extends OrderListItem {
  proposal_id: string;
  escrow_id: string | null;
  description: string | null;
  consultant_notes: string | null;
  client_notes: string | null;
  max_revisions: number;
  revisions_used: number;
  original_delivery_date: string | null;
  started_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  milestones: MilestoneListItem[];
  activities: OrderActivity[];
  is_client: boolean;
  is_consultant: boolean;
  can_start: boolean;
  can_deliver: boolean;
  can_complete: boolean;
  can_cancel: boolean;
  can_request_revision: boolean;
  is_active: boolean;
  updated_at: string;
}

// Order List Response
export interface OrderListResponse {
  results: OrderListItem[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Order Filters
export interface OrderFilters {
  status?: OrderStatus;
  role?: 'client' | 'consultant';
  page?: number;
  page_size?: number;
}

// Milestone Create Data
export interface MilestoneCreateData {
  title: string;
  description?: string;
  due_date?: string;
  sequence?: number;
}

// Order Action Data
export interface OrderStartData {
  notes?: string;
}

export interface OrderDeliverData {
  notes?: string;
}

export interface OrderRevisionData {
  feedback: string;
}

export interface OrderCancelData {
  reason: string;
}

export interface OrderExtendDeadlineData {
  new_deadline: string;
  reason?: string;
}

// Milestone Action Data
export interface MilestoneSubmitData {
  notes?: string;
}

export interface MilestoneApproveData {
  feedback?: string;
}

export interface MilestoneRevisionData {
  feedback: string;
}
