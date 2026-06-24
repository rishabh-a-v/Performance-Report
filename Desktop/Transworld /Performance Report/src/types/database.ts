export type UserRole = 'executive' | 'manager' | 'director' | 'managing_director'
export type TaskStatus = 'in_progress' | 'blocked' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type AuditStatus = 'assigned' | 'in_progress' | 'completed' | 'pending'
export type MeasurementType =
  | 'count' | 'currency' | 'percentage' | 'hours'
  | 'documents' | 'invoices' | 'audits' | 'calls'
  | 'emails' | 'leads' | 'custom'
export type ProgressModel = 'quantity' | 'value' | 'milestone'
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED'

// ─── Core entities ────────────────────────────────────────────────────────────

export interface Department {
  id: string
  name: string
  head_id: string | null
  budget: number | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string           // matches auth.users.id
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  department_id: string | null
  manager_id: string | null
  employee_code: string | null
  designation: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  department?: Department
  manager?: Profile
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assignee_id: string
  created_by: string
  department_id: string | null
  due_date: string | null
  started_at: string | null
  completed_at: string | null
  cycle_time_hours: number | null
  estimated_hours: number | null
  tags: string[]
  created_at: string
  updated_at: string
  // measurable outcome fields
  progress_model?: ProgressModel | null        // 'quantity' | 'value' | 'milestone'
  measurement_type?: MeasurementType | null    // subtype for quantity model
  target_quantity?: number | null
  completed_quantity?: number | null
  unit?: string | null
  // value-model fields
  target_value?: number | null
  current_value?: number | null
  currency?: CurrencyCode | null
  // joined
  assignee?: Profile
  department?: Department
}

export interface Milestone {
  id: string
  task_id: string
  title: string
  weight: number          // 0–100, sum across milestones = 100
  completed: boolean
  completed_at: string | null
  sort_order: number
  created_at: string
}

export interface TaskProgressHistory {
  id: string
  task_id: string
  recorded_date: string
  completed_quantity: number
  progress_percentage: number
  daily_delta: number
  created_at: string
}

export interface ForecastResult {
  dailyThroughput: number
  remaining: number
  daysToComplete: number
  forecastDate: Date
  isOnTrack: boolean
  isAtRisk: boolean
  isBehind: boolean
  daysUntilDue: number | null
  pct?: number
}

export interface DailyCheckin {
  id: string
  user_id: string
  checkin_date: string   // YYYY-MM-DD
  completed_yesterday: string
  focus_today: string
  is_blocked: boolean
  blocker_description: string | null
  mood_score: number | null  // 1-5
  created_at: string
  updated_at: string
  // joined
  user?: Profile
  tasks?: Task[]
}

export interface CheckinTaskLink {
  checkin_id: string
  task_id: string
}

export interface Blocker {
  id: string
  employee_id: string
  task_id: string | null
  description: string
  reported_at: string
  resolved_at: string | null
  resolved_by: string | null
  resolution_notes: string | null
  hours_blocked: number | null
  created_at: string
  blocked_by_user_id?: string | null   // person identified as causing the block
  // joined
  employee?: Profile
  task?: Task
  resolver?: Profile
  blocked_by?: Profile
}

// ─── KPI & Performance ────────────────────────────────────────────────────────

export interface KPI {
  id: string
  user_id: string | null
  department_id: string | null
  metric_name: string
  target_value: number
  actual_value: number
  unit: string
  period: string   // e.g. '2024-W24'
  created_at: string
}

export interface PerformanceSnapshot {
  id: string
  user_id: string
  snapshot_date: string
  tasks_assigned: number
  tasks_completed: number
  tasks_blocked: number
  avg_cycle_time_hours: number | null
  completion_rate: number
  kpi_score: number
  created_at: string
}

export interface DepartmentSnapshot {
  id: string
  department_id: string
  snapshot_date: string
  active_tasks: number
  completed_tasks: number
  blocked_tasks: number
  avg_cycle_time_hours: number | null
  utilization_pct: number
  efficiency_score: number
  kpi_score: number
  created_at: string
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  amount: number
  currency: string
  status: 'pending' | 'processed' | 'overdue' | 'cancelled'
  issued_date: string
  due_date: string
  paid_date: string | null
  department_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Audit {
  id: string
  title: string
  description: string | null
  status: AuditStatus
  assigned_to: string
  department_id: string | null
  due_date: string | null
  completed_date: string | null
  created_by: string
  created_at: string
  updated_at: string
  // joined
  assignee?: Profile
}

export interface FinanceKPI {
  id: string
  department_id: string | null
  period: string
  dso_days: number | null
  invoice_processing_time_hrs: number | null
  cost_per_invoice: number | null
  audit_completion_rate: number | null
  collection_rate: number | null
  created_at: string
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: 'info' | 'warning' | 'danger' | 'success'
  read: boolean
  action_url: string | null
  created_at: string
}


// ─── Job Directions ───────────────────────────────────────────────────────────

export type JobDirectionStatus = 'draft' | 'active' | 'submitted' | 'approved' | 'rejected' | 'completed'
export type JobDirectionProgressType = 'quantity' | 'value' | 'milestone'
export type SpecialTaskStatus = 'pending' | 'in_progress' | 'on_hold' | 'completed'

export interface JobDirection {
  id: string
  title: string
  description: string | null
  employee_id: string
  manager_id: string
  department_id: string | null
  progress_type: JobDirectionProgressType
  target_value: number | null
  current_value: number | null
  unit: string | null
  progress_percentage: number
  status: JobDirectionStatus
  review_notes: string | null
  due_date?: string | null
  submitted_for_review_at: string | null
  approved_at: string | null
  rejected_at: string | null
  created_at: string
  updated_at: string
  pendingEdits?: {
    title: string
    description: string | null
    target_value: number | null
  } | null
}

export interface JDMilestone {
  id: string
  job_direction_id: string
  title: string
  weight: number          // 0–100, weights across a JD sum to 100
  completed: boolean
  completed_at: string | null
  sort_order: number
  created_at: string
}

export interface SpecialTask {
  id: string
  title: string
  description: string | null
  assigned_to: string
  assigned_by: string
  priority: TaskPriority  // reuse existing: low | medium | high | critical
  due_date: string | null
  status: SpecialTaskStatus
  created_at: string
  updated_at: string
}

// ─── Branch ───────────────────────────────────────────────────────────────────
export interface Branch {
  id: string
  name: string
  city: string
  state: string
  head_id: string | null
}

// ─── CSC Daily Report ─────────────────────────────────────────────────────────
export interface CSCDailyReport {
  id: string
  employee_id: string
  branch_id: string
  report_date: string
  hhg_packing_jobs: number
  customers_called_packing: number
  or_dc_commercial_moves: number
  customers_called_move: number
  in_transit_shipments: number
  customers_called_transit: number
  challenges: string | null
  created_at: string
  updated_at: string
}

// ─── CET Daily Report ─────────────────────────────────────────────────────────
export interface CETDailyReport {
  id: string
  employee_id: string
  branch_id: string
  report_date: string
  estimations_reviewed: number
  estimations_corrected: number
  jobs_confirmed: number
  quotes_pending: number
  total_estimate_value: number
  challenges: string | null
  created_at: string
  updated_at: string
}

// ─── EQB Order ───────────────────────────────────────────────────────────────
export interface EQBOrder {
  id: string
  branch_id: string
  employee_id: string
  order_date: string
  order_value: number
  customer_name: string
  status: 'generated' | 'confirmed' | 'cancelled'
  created_at: string
}

// ─── Unbilled Report ─────────────────────────────────────────────────────────
export interface UnbilledReport {
  id: string
  branch_id: string
  employee_id: string
  report_date: string
  pending_pos: number
  pending_po_value: number
  completed_jobs_not_billed: number
  unbilled_job_value: number
  damages_pending: number
  damage_value: number
  billed_jobs: number
  total_completed_jobs: number
  resolved_damages: number
  closed_pos: number
  remarks: string | null
  created_at: string
}

// ─── DPR (Daily Performance Report) ──────────────────────────────────────────
export interface DailyPerformanceReport {
  id: string
  branch_id: string
  submitted_by: string
  report_date: string
  daily_revenue: number
  jobs_completed: number
  jobs_open: number
  jobs_delayed: number
  pending_billing: number
  pending_damage_claims: number
  customer_followups: number
  challenges: string | null
  created_at: string
}

// ─── Employee Performance Score ───────────────────────────────────────────────
export type PerformanceCategory =
  | 'exceptional'
  | 'exceeds_expectations'
  | 'meets_expectations'
  | 'needs_improvement'
  | 'critical_attention'

export interface EmployeePerformanceScore {
  user_id: string
  period: string
  task_completion_score: number
  kpi_achievement_score: number
  productivity_score: number
  timeliness_score: number
  manager_feedback_score: number
  total_score: number
  category: PerformanceCategory
  computed_at: string
}

export type ReviewType = 'self' | 'subordinate' | 'company'
export type ReviewStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export interface PerformanceReview {
  id: string
  employee_id: string
  employee_name: string
  employee_role: string
  review_period: string
  review_type: ReviewType
  
  // Subordinate targets
  reviewed_employee_id?: string | null
  reviewed_employee_name?: string | null

  // Self Review / Template fields
  objectives_assigned?: string | null
  objectives_completed?: string | null
  progress_percentage?: number | null
  achievements?: string | null
  challenges?: string | null
  support_required?: string | null
  next_period_goals?: string | null
  
  // Company Review (MD specific)
  company_performance?: string | null
  branch_performance?: string | null
  department_performance?: string | null
  major_risks?: string | null
  strategic_decisions?: string | null
  future_plans?: string | null

  // Subordinate Review fields
  rating?: number | null // 1-5 scale
  areas_for_improvement?: string | null
  manager_comments?: string | null
  recommended_action?: string | null

  status: ReviewStatus
  submitted_at: string | null
  created_at: string
  rejection_note?: string | null
}
