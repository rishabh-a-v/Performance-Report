import type { Profile, Department, Task, DailyCheckin, Blocker, Invoice, Audit, FinanceKPI, PerformanceSnapshot, DepartmentSnapshot, TaskProgressHistory, Milestone } from '@/types/database'

export const DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Engineering',  head_id: 'u3', budget: 2000000, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'd2', name: 'Finance',      head_id: 'u4', budget: 800000,  created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'd3', name: 'Sales',        head_id: 'u5', budget: 1200000, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'd4', name: 'Operations',   head_id: 'u6', budget: 600000,  created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'd5', name: 'HR',           head_id: 'u7', budget: 400000,  created_at: '2024-01-01', updated_at: '2024-01-01' },
]

export const PROFILES: Profile[] = [
  { id: 'u1',  email: 'md@transworld.com',          full_name: 'Arjun Mehta',       role: 'executive',        department_id: null, manager_id: null,  employee_code: 'EX001', designation: 'Managing Director',     is_active: true, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u2',  email: 'cfo@transworld.com',         full_name: 'Priya Sharma',      role: 'executive',        department_id: 'd2', manager_id: null,  employee_code: 'EX002', designation: 'CFO',                   is_active: true, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u3',  email: 'eng.head@transworld.com',    full_name: 'Rahul Verma',       role: 'department_head',  department_id: 'd1', manager_id: 'u1',  employee_code: 'DH001', designation: 'VP Engineering',        is_active: true, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u4',  email: 'fin.head@transworld.com',    full_name: 'Neha Gupta',        role: 'department_head',  department_id: 'd2', manager_id: 'u2',  employee_code: 'DH002', designation: 'Head of Finance',       is_active: true, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u5',  email: 'sales.head@transworld.com',  full_name: 'Karan Singh',       role: 'department_head',  department_id: 'd3', manager_id: 'u1',  employee_code: 'DH003', designation: 'VP Sales',              is_active: true, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u6',  email: 'ops.head@transworld.com',    full_name: 'Divya Patel',       role: 'department_head',  department_id: 'd4', manager_id: 'u1',  employee_code: 'DH004', designation: 'Head of Operations',    is_active: true, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u7',  email: 'hr.head@transworld.com',     full_name: 'Ananya Roy',        role: 'department_head',  department_id: 'd5', manager_id: 'u1',  employee_code: 'DH005', designation: 'Head of HR',            is_active: true, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u8',  email: 'mgr1@transworld.com',        full_name: 'Vikram Joshi',      role: 'manager',          department_id: 'd1', manager_id: 'u3',  employee_code: 'MG001', designation: 'Engineering Manager',   is_active: true, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u9',  email: 'mgr2@transworld.com',        full_name: 'Sunita Reddy',      role: 'manager',          department_id: 'd3', manager_id: 'u5',  employee_code: 'MG002', designation: 'Sales Manager',         is_active: true, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u10', email: 'emp1@transworld.com',        full_name: 'Amit Kumar',        role: 'employee',         department_id: 'd1', manager_id: 'u8',  employee_code: 'EM001', designation: 'Senior Developer',      is_active: true, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u11', email: 'emp2@transworld.com',        full_name: 'Sneha Iyer',        role: 'employee',         department_id: 'd1', manager_id: 'u8',  employee_code: 'EM002', designation: 'Frontend Developer',    is_active: true, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u12', email: 'emp3@transworld.com',        full_name: 'Rohit Nair',        role: 'employee',         department_id: 'd3', manager_id: 'u9',  employee_code: 'EM003', designation: 'Sales Executive',       is_active: true, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u13', email: 'emp4@transworld.com',        full_name: 'Pooja Bhatt',       role: 'employee',         department_id: 'd2', manager_id: 'u4',  employee_code: 'EM004', designation: 'Finance Analyst',       is_active: true, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u14', email: 'demo@transworld.com',        full_name: 'Demo User',         role: 'employee',         department_id: 'd1', manager_id: 'u8',  employee_code: 'EM005', designation: 'Full Stack Developer',  is_active: true, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
]

export const TASKS: Task[] = [
  { id: 't1',  title: 'Migrate auth service to Supabase',        description: 'Replace legacy JWT with Supabase Auth',       status: 'in_progress', priority: 'high',     assignee_id: 'u10', created_by: 'u8',  department_id: 'd1', due_date: '2026-06-28', started_at: '2026-06-10', completed_at: null, cycle_time_hours: null, estimated_hours: 40, tags: ['backend', 'auth'],  created_at: '2026-06-01', updated_at: '2026-06-18' },
  { id: 't2',  title: 'Dashboard performance optimisation',       description: 'Reduce TTI by 30% via code splitting',        status: 'blocked',     priority: 'high',     assignee_id: 'u11', created_by: 'u8',  department_id: 'd1', due_date: '2026-06-25', started_at: '2026-06-08', completed_at: null, cycle_time_hours: null, estimated_hours: 20, tags: ['frontend'],        created_at: '2026-06-01', updated_at: '2026-06-20' },
  { id: 't3',  title: 'Q2 financial reconciliation',              description: 'Reconcile all Q2 ledgers',                    status: 'done',        priority: 'critical', assignee_id: 'u13', created_by: 'u4',  department_id: 'd2', due_date: '2026-06-20', started_at: '2026-06-15', completed_at: '2026-06-19', cycle_time_hours: 96, estimated_hours: 80, tags: ['finance'],        created_at: '2026-06-01', updated_at: '2026-06-19' },
  { id: 't4',  title: 'Enterprise client onboarding (ACME)',      description: 'Coordinate full onboarding for ACME Corp',     status: 'in_progress', priority: 'critical', assignee_id: 'u12', created_by: 'u9',  department_id: 'd3', due_date: '2026-06-30', started_at: '2026-06-18', completed_at: null, cycle_time_hours: null, estimated_hours: 60, tags: ['sales', 'client'], created_at: '2026-06-10', updated_at: '2026-06-22' },
  { id: 't5',  title: 'API rate limiting implementation',         description: 'Add token-bucket rate limiting to REST APIs',  status: 'ready',       priority: 'medium',   assignee_id: 'u10', created_by: 'u8',  department_id: 'd1', due_date: '2026-07-05', started_at: null, completed_at: null, cycle_time_hours: null, estimated_hours: 16, tags: ['backend', 'infra'], created_at: '2026-06-15', updated_at: '2026-06-15' },
  { id: 't6',  title: 'Monthly KPI report — June',                description: 'Generate and distribute June KPI summary',    status: 'backlog',     priority: 'high',     assignee_id: 'u14', created_by: 'u8',  department_id: 'd1', due_date: '2026-07-03', started_at: null, completed_at: null, cycle_time_hours: null, estimated_hours: 8,  tags: ['reporting'],       created_at: '2026-06-20', updated_at: '2026-06-20' },
  { id: 't7',  title: 'Invoice processing automation',            description: 'Automate invoice extraction via OCR',          status: 'in_progress', priority: 'high',     assignee_id: 'u13', created_by: 'u4',  department_id: 'd2', due_date: '2026-07-10', started_at: '2026-06-20', completed_at: null, cycle_time_hours: null, estimated_hours: 32, tags: ['finance', 'automation'], created_at: '2026-06-12', updated_at: '2026-06-22' },
  { id: 't8',  title: 'Sales pipeline CRM cleanup',               description: 'Remove stale leads from CRM',                  status: 'done',        priority: 'low',      assignee_id: 'u12', created_by: 'u9',  department_id: 'd3', due_date: '2026-06-18', started_at: '2026-06-14', completed_at: '2026-06-17', cycle_time_hours: 48, estimated_hours: 12, tags: ['sales'],           created_at: '2026-06-10', updated_at: '2026-06-17' },
  { id: 't9',  title: 'Implement dark mode across app',           description: 'Tailwind dark mode token pass',                status: 'backlog',     priority: 'low',      assignee_id: 'u14', created_by: 'u8',  department_id: 'd1', due_date: '2026-07-15', started_at: null, completed_at: null, cycle_time_hours: null, estimated_hours: 12, tags: ['frontend'],        created_at: '2026-06-22', updated_at: '2026-06-22' },
  { id: 't10', title: 'Annual audit preparation',                 description: 'Prepare documents for statutory audit',        status: 'in_progress', priority: 'critical', assignee_id: 'u13', created_by: 'u4',  department_id: 'd2', due_date: '2026-06-30', started_at: '2026-06-16', completed_at: null, cycle_time_hours: null, estimated_hours: 48, tags: ['audit'],            created_at: '2026-06-10', updated_at: '2026-06-22' },
]

export const DAILY_CHECKINS: DailyCheckin[] = [
  {
    id: 'dc1', user_id: 'u14', checkin_date: '2026-06-22',
    completed_yesterday: 'Completed API endpoint tests and fixed 3 bugs in the auth flow. Reviewed PR from Amit.',
    focus_today: 'Start working on the monthly KPI report template and fix remaining blocked issues.',
    is_blocked: false, blocker_description: null, mood_score: 4,
    created_at: '2026-06-22T09:15:00Z', updated_at: '2026-06-22T09:15:00Z',
  },
  {
    id: 'dc2', user_id: 'u11', checkin_date: '2026-06-22',
    completed_yesterday: 'Worked on component refactoring. Started performance profiling.',
    focus_today: 'Continuing dashboard performance work. Need design specs first.',
    is_blocked: true, blocker_description: 'Waiting on updated design mockups from the design team before I can continue the performance optimisation work.', mood_score: 3,
    created_at: '2026-06-22T09:30:00Z', updated_at: '2026-06-22T09:30:00Z',
  },
  {
    id: 'dc3', user_id: 'u10', checkin_date: '2026-06-22',
    completed_yesterday: 'Migrated user auth endpoints to Supabase. All tests passing.',
    focus_today: 'Continue Supabase migration — roles and RLS setup.',
    is_blocked: false, blocker_description: null, mood_score: 5,
    created_at: '2026-06-22T08:55:00Z', updated_at: '2026-06-22T08:55:00Z',
  },
]

export const BLOCKERS: Blocker[] = [
  {
    id: 'b1', employee_id: 'u11', task_id: 't2',
    description: 'Waiting on updated design mockups from the design team before I can continue the performance optimisation work.',
    reported_at: '2026-06-20T09:30:00Z', resolved_at: null, resolved_by: null, resolution_notes: null, hours_blocked: 56,
    created_at: '2026-06-20T09:30:00Z',
  },
  {
    id: 'b2', employee_id: 'u12', task_id: 't4',
    description: 'Legal clearance pending for enterprise contract terms with ACME Corp.',
    reported_at: '2026-06-21T14:00:00Z', resolved_at: null, resolved_by: null, resolution_notes: null, hours_blocked: 20,
    created_at: '2026-06-21T14:00:00Z',
  },
  {
    id: 'b3', employee_id: 'u14', task_id: null,
    description: 'Waiting on API spec from Vikram before I can implement the new integration module.',
    blocked_by_user_id: 'u8',
    reported_at: '2026-06-22T08:00:00Z', resolved_at: null, resolved_by: null, resolution_notes: null, hours_blocked: 4,
    created_at: '2026-06-22T08:00:00Z',
  },
]

export const INVOICES: Invoice[] = [
  { id: 'i1',  invoice_number: 'INV-2026-001', client_name: 'ACME Corp',        amount: 450000, currency: 'INR', status: 'processed', issued_date: '2026-05-01', due_date: '2026-05-31', paid_date: '2026-05-28', department_id: 'd3', created_by: 'u4', created_at: '2026-05-01', updated_at: '2026-05-28' },
  { id: 'i2',  invoice_number: 'INV-2026-002', client_name: 'Zenith Ltd',       amount: 280000, currency: 'INR', status: 'processed', issued_date: '2026-05-05', due_date: '2026-06-04', paid_date: '2026-06-02', department_id: 'd3', created_by: 'u4', created_at: '2026-05-05', updated_at: '2026-06-02' },
  { id: 'i3',  invoice_number: 'INV-2026-003', client_name: 'Horizon Pvt Ltd',  amount: 175000, currency: 'INR', status: 'pending',   issued_date: '2026-06-01', due_date: '2026-06-30', paid_date: null,          department_id: 'd3', created_by: 'u4', created_at: '2026-06-01', updated_at: '2026-06-01' },
  { id: 'i4',  invoice_number: 'INV-2026-004', client_name: 'Pinnacle Systems', amount: 320000, currency: 'INR', status: 'overdue',   issued_date: '2026-05-10', due_date: '2026-06-09', paid_date: null,          department_id: 'd3', created_by: 'u4', created_at: '2026-05-10', updated_at: '2026-06-10' },
  { id: 'i5',  invoice_number: 'INV-2026-005', client_name: 'Delta Solutions',  amount: 95000,  currency: 'INR', status: 'processed', issued_date: '2026-06-05', due_date: '2026-07-05', paid_date: '2026-06-20', department_id: 'd3', created_by: 'u4', created_at: '2026-06-05', updated_at: '2026-06-20' },
  { id: 'i6',  invoice_number: 'INV-2026-006', client_name: 'Vertex Inc',       amount: 220000, currency: 'INR', status: 'pending',   issued_date: '2026-06-15', due_date: '2026-07-15', paid_date: null,          department_id: 'd3', created_by: 'u4', created_at: '2026-06-15', updated_at: '2026-06-15' },
]

export const AUDITS: Audit[] = [
  { id: 'a1', title: 'Q1 Revenue Audit',              description: null, status: 'completed',   assigned_to: 'u13', department_id: 'd2', due_date: '2026-04-30', completed_date: '2026-04-28', created_by: 'u4', created_at: '2026-04-01', updated_at: '2026-04-28' },
  { id: 'a2', title: 'Statutory Annual Audit 2026',   description: null, status: 'in_progress', assigned_to: 'u13', department_id: 'd2', due_date: '2026-06-30', completed_date: null,         created_by: 'u4', created_at: '2026-06-10', updated_at: '2026-06-22' },
  { id: 'a3', title: 'Vendor Payment Audit',          description: null, status: 'pending',     assigned_to: 'u13', department_id: 'd2', due_date: '2026-07-15', completed_date: null,         created_by: 'u4', created_at: '2026-06-20', updated_at: '2026-06-20' },
  { id: 'a4', title: 'Payroll Compliance Review',     description: null, status: 'assigned',    assigned_to: 'u13', department_id: 'd5', due_date: '2026-07-10', completed_date: null,         created_by: 'u7', created_at: '2026-06-22', updated_at: '2026-06-22' },
]

export const FINANCE_KPIS: FinanceKPI[] = [
  { id: 'fk1', department_id: 'd2', period: '2026-Q1', dso_days: 42, invoice_processing_time_hrs: 28, cost_per_invoice: 12.5, audit_completion_rate: 95, collection_rate: 88, created_at: '2026-04-01' },
  { id: 'fk2', department_id: 'd2', period: '2026-Q2', dso_days: 38, invoice_processing_time_hrs: 22, cost_per_invoice: 11.2, audit_completion_rate: 72, collection_rate: 82, created_at: '2026-07-01' },
]

export const PERF_SNAPSHOTS: PerformanceSnapshot[] = [
  { id: 'ps1',  user_id: 'u10', snapshot_date: '2026-06-15', tasks_assigned: 8,  tasks_completed: 6,  tasks_blocked: 0, avg_cycle_time_hours: 22, completion_rate: 75, kpi_score: 78, created_at: '2026-06-15' },
  { id: 'ps2',  user_id: 'u11', snapshot_date: '2026-06-15', tasks_assigned: 6,  tasks_completed: 3,  tasks_blocked: 2, avg_cycle_time_hours: 36, completion_rate: 50, kpi_score: 42, created_at: '2026-06-15' },
  { id: 'ps3',  user_id: 'u12', snapshot_date: '2026-06-15', tasks_assigned: 10, tasks_completed: 8,  tasks_blocked: 1, avg_cycle_time_hours: 30, completion_rate: 80, kpi_score: 74, created_at: '2026-06-15' },
  { id: 'ps4',  user_id: 'u13', snapshot_date: '2026-06-15', tasks_assigned: 12, tasks_completed: 10, tasks_blocked: 0, avg_cycle_time_hours: 40, completion_rate: 83, kpi_score: 81, created_at: '2026-06-15' },
  { id: 'ps5',  user_id: 'u14', snapshot_date: '2026-06-15', tasks_assigned: 7,  tasks_completed: 5,  tasks_blocked: 0, avg_cycle_time_hours: 18, completion_rate: 71, kpi_score: 76, created_at: '2026-06-15' },
]

export const DEPT_SNAPSHOTS: DepartmentSnapshot[] = [
  { id: 'ds1', department_id: 'd1', snapshot_date: '2026-06-15', active_tasks: 12, completed_tasks: 28, blocked_tasks: 2, avg_cycle_time_hours: 26, utilization_pct: 78, efficiency_score: 72, kpi_score: 74, created_at: '2026-06-15' },
  { id: 'ds2', department_id: 'd2', snapshot_date: '2026-06-15', active_tasks: 8,  completed_tasks: 22, blocked_tasks: 0, avg_cycle_time_hours: 38, utilization_pct: 85, efficiency_score: 82, kpi_score: 83, created_at: '2026-06-15' },
  { id: 'ds3', department_id: 'd3', snapshot_date: '2026-06-15', active_tasks: 14, completed_tasks: 32, blocked_tasks: 3, avg_cycle_time_hours: 32, utilization_pct: 91, efficiency_score: 68, kpi_score: 70, created_at: '2026-06-15' },
  { id: 'ds4', department_id: 'd4', snapshot_date: '2026-06-15', active_tasks: 6,  completed_tasks: 18, blocked_tasks: 1, avg_cycle_time_hours: 20, utilization_pct: 70, efficiency_score: 76, kpi_score: 75, created_at: '2026-06-15' },
  { id: 'ds5', department_id: 'd5', snapshot_date: '2026-06-15', active_tasks: 4,  completed_tasks: 12, blocked_tasks: 0, avg_cycle_time_hours: 16, utilization_pct: 62, efficiency_score: 80, kpi_score: 79, created_at: '2026-06-15' },
]

// Trend data for charts
export const COMPLETION_TREND = [
  { week: 'W17', engineering: 68, finance: 78, sales: 60, operations: 72, hr: 80 },
  { week: 'W18', engineering: 72, finance: 80, sales: 64, operations: 74, hr: 82 },
  { week: 'W19', engineering: 70, finance: 82, sales: 58, operations: 76, hr: 78 },
  { week: 'W20', engineering: 74, finance: 81, sales: 66, operations: 75, hr: 83 },
  { week: 'W21', engineering: 71, finance: 83, sales: 63, operations: 78, hr: 81 },
  { week: 'W22', engineering: 74, finance: 83, sales: 70, operations: 75, hr: 79 },
]

export const REVENUE_TREND = [
  { month: 'Jan', invoiced: 1200000, collected: 1050000 },
  { month: 'Feb', invoiced: 980000,  collected: 920000  },
  { month: 'Mar', invoiced: 1450000, collected: 1310000 },
  { month: 'Apr', invoiced: 1100000, collected: 1020000 },
  { month: 'May', invoiced: 1320000, collected: 1150000 },
  { month: 'Jun', invoiced: 1540000, collected: 1100000 },
]

export const PERSONAL_TREND = [
  { week: 'W17', completed: 4, blocked: 0, kpi: 72 },
  { week: 'W18', completed: 5, blocked: 1, kpi: 68 },
  { week: 'W19', completed: 3, blocked: 0, kpi: 70 },
  { week: 'W20', completed: 6, blocked: 0, kpi: 80 },
  { week: 'W21', completed: 4, blocked: 1, kpi: 71 },
  { week: 'W22', completed: 5, blocked: 0, kpi: 76 },
]

// Helper lookups
export const profileById = (id: string) => PROFILES.find((p) => p.id === id)
export const deptById    = (id: string) => DEPARTMENTS.find((d) => d.id === id)
export const tasksByUser = (userId: string) => TASKS.filter((t) => t.assignee_id === userId)
export const tasksByDept = (deptId: string) => TASKS.filter((t) => t.department_id === deptId)
export const reportees   = (managerId: string) => PROFILES.filter((p) => p.manager_id === managerId)
export const blockersForUser = (userId: string) => BLOCKERS.filter((b) => b.employee_id === userId)
export const activeBlockers  = () => BLOCKERS.filter((b) => !b.resolved_at)

export const DEMO_CREDENTIALS: Record<string, string> = {
  'md@transworld.com':          'Arjun Mehta · Managing Director',
  'eng.head@transworld.com':    'Rahul Verma · VP Engineering',
  'mgr1@transworld.com':        'Vikram Joshi · Engineering Manager',
  'demo@transworld.com':        'Demo User · Full Stack Developer',
  'fin.head@transworld.com':    'Neha Gupta · Head of Finance',
}

// ─── Measurable tasks ────────────────────────────────────────────────────────
export const MEASURABLE_TASKS: Task[] = [
  // ── QUANTITY MODEL ──────────────────────────────────────────────────────────
  {
    id: 'mt1',
    title: 'Q2 Email Outreach Campaign',
    description: 'Reach 500 prospects via personalised email sequences for Q2 pipeline generation.',
    status: 'in_progress',
    priority: 'high',
    assignee_id: 'u12',
    created_by: 'u5',
    department_id: 'd3',
    due_date: '2026-06-30',
    started_at: '2026-06-02T09:00:00Z',
    completed_at: null,
    cycle_time_hours: null,
    estimated_hours: 40,
    tags: ['sales', 'outreach', 'q2'],
    created_at: '2026-05-30T10:00:00Z',
    updated_at: '2026-06-22T08:00:00Z',
    progress_model: 'quantity',
    measurement_type: 'emails',
    target_quantity: 500,
    completed_quantity: 320,
    unit: 'Emails',
  },
  {
    id: 'mt2',
    title: 'June Invoice Processing Batch',
    description: 'Process and reconcile all June invoices before month-end close.',
    status: 'in_progress',
    priority: 'critical',
    assignee_id: 'u13',
    created_by: 'u4',
    department_id: 'd2',
    due_date: '2026-06-30',
    started_at: '2026-05-15T09:00:00Z',
    completed_at: null,
    cycle_time_hours: null,
    estimated_hours: 80,
    tags: ['finance', 'invoices', 'month-end'],
    created_at: '2026-05-13T10:00:00Z',
    updated_at: '2026-06-22T08:00:00Z',
    progress_model: 'quantity',
    measurement_type: 'invoices',
    target_quantity: 1200,
    completed_quantity: 900,
    unit: 'Invoices',
  },
  {
    id: 'mt3',
    title: 'Vendor Account Audits — H1',
    description: 'Complete H1 compliance audit across all active vendor accounts.',
    status: 'in_progress',
    priority: 'high',
    assignee_id: 'u13',
    created_by: 'u4',
    department_id: 'd2',
    due_date: '2026-06-28',
    started_at: '2026-06-01T09:00:00Z',
    completed_at: null,
    cycle_time_hours: null,
    estimated_hours: 60,
    tags: ['finance', 'audit', 'compliance'],
    created_at: '2026-05-28T10:00:00Z',
    updated_at: '2026-06-22T08:00:00Z',
    progress_model: 'quantity',
    measurement_type: 'audits',
    target_quantity: 80,
    completed_quantity: 50,
    unit: 'Audits',
  },
  {
    id: 'mt4',
    title: 'PR Code Review Sprint',
    description: 'Review and approve all open pull requests before the June release freeze.',
    status: 'in_progress',
    priority: 'high',
    assignee_id: 'u10',
    created_by: 'u3',
    department_id: 'd1',
    due_date: '2026-06-28',
    started_at: '2026-06-10T09:00:00Z',
    completed_at: null,
    cycle_time_hours: null,
    estimated_hours: 24,
    tags: ['engineering', 'review', 'sprint'],
    created_at: '2026-06-09T10:00:00Z',
    updated_at: '2026-06-22T08:00:00Z',
    progress_model: 'quantity',
    measurement_type: 'count',
    target_quantity: 40,
    completed_quantity: 28,
    unit: 'Reviews',
  },
  {
    id: 'mt5',
    title: 'Sprint Bug Resolution',
    description: 'Resolve all P1/P2 bugs reported against the v2.4 release candidate.',
    status: 'in_progress',
    priority: 'critical',
    assignee_id: 'u11',
    created_by: 'u3',
    department_id: 'd1',
    due_date: '2026-06-28',
    started_at: '2026-06-10T09:00:00Z',
    completed_at: null,
    cycle_time_hours: null,
    estimated_hours: 30,
    tags: ['engineering', 'bugs', 'sprint'],
    created_at: '2026-06-09T10:00:00Z',
    updated_at: '2026-06-22T08:00:00Z',
    progress_model: 'quantity',
    measurement_type: 'count',
    target_quantity: 25,
    completed_quantity: 18,
    unit: 'Bugs',
  },
  {
    id: 'mt6',
    title: 'Test Coverage Expansion',
    description: 'Increase unit + integration test coverage across all core modules.',
    status: 'in_progress',
    priority: 'medium',
    assignee_id: 'u14',
    created_by: 'u3',
    department_id: 'd1',
    due_date: '2026-06-30',
    started_at: '2026-06-01T09:00:00Z',
    completed_at: null,
    cycle_time_hours: null,
    estimated_hours: 50,
    tags: ['engineering', 'testing', 'quality'],
    created_at: '2026-05-30T10:00:00Z',
    updated_at: '2026-06-22T08:00:00Z',
    progress_model: 'quantity',
    measurement_type: 'percentage',
    target_quantity: 100,
    completed_quantity: 67,
    unit: '%',
  },
  {
    id: 'mt7',
    title: 'Client Discovery Calls',
    description: 'Conduct discovery calls with enterprise prospects in the BFSI vertical.',
    status: 'in_progress',
    priority: 'high',
    assignee_id: 'u12',
    created_by: 'u5',
    department_id: 'd3',
    due_date: '2026-06-30',
    started_at: '2026-06-10T09:00:00Z',
    completed_at: null,
    cycle_time_hours: null,
    estimated_hours: 30,
    tags: ['sales', 'calls', 'enterprise'],
    created_at: '2026-06-09T10:00:00Z',
    updated_at: '2026-06-22T08:00:00Z',
    progress_model: 'quantity',
    measurement_type: 'calls',
    target_quantity: 60,
    completed_quantity: 38,
    unit: 'Calls',
  },

  // ── VALUE MODEL ─────────────────────────────────────────────────────────────
  {
    id: 'mv1',
    title: 'Q2 Revenue Collection',
    description: 'Collect outstanding payments from enterprise accounts for Q2 close.',
    status: 'in_progress',
    priority: 'critical',
    assignee_id: 'u13',
    created_by: 'u4',
    department_id: 'd2',
    due_date: '2026-06-30',
    started_at: '2026-06-01T09:00:00Z',
    completed_at: null,
    cycle_time_hours: null,
    estimated_hours: 60,
    tags: ['finance', 'revenue', 'q2'],
    created_at: '2026-05-30T10:00:00Z',
    updated_at: '2026-06-22T08:00:00Z',
    progress_model: 'value',
    target_value: 1000000,
    current_value: 750000,
    currency: 'INR',
  },
  {
    id: 'mv2',
    title: 'Enterprise Sales Target — June',
    description: 'Close new enterprise contracts to hit monthly sales quota.',
    status: 'in_progress',
    priority: 'high',
    assignee_id: 'u12',
    created_by: 'u5',
    department_id: 'd3',
    due_date: '2026-06-30',
    started_at: '2026-06-01T09:00:00Z',
    completed_at: null,
    cycle_time_hours: null,
    estimated_hours: 80,
    tags: ['sales', 'enterprise', 'quota'],
    created_at: '2026-05-30T10:00:00Z',
    updated_at: '2026-06-22T08:00:00Z',
    progress_model: 'value',
    target_value: 500000,
    current_value: 320000,
    currency: 'INR',
  },

  // ── MILESTONE MODEL ──────────────────────────────────────────────────────────
  {
    id: 'mm1',
    title: 'Open Mumbai Branch Office',
    description: 'Complete all setup tasks for the new Mumbai regional sales office.',
    status: 'in_progress',
    priority: 'high',
    assignee_id: 'u9',
    created_by: 'u5',
    department_id: 'd3',
    due_date: '2026-07-31',
    started_at: '2026-06-01T09:00:00Z',
    completed_at: null,
    cycle_time_hours: null,
    estimated_hours: null,
    tags: ['sales', 'expansion', 'infrastructure'],
    created_at: '2026-05-25T10:00:00Z',
    updated_at: '2026-06-22T08:00:00Z',
    progress_model: 'milestone',
  },
  {
    id: 'mm2',
    title: 'ERP System Implementation',
    description: 'Roll out the new ERP system across all finance operations.',
    status: 'in_progress',
    priority: 'critical',
    assignee_id: 'u4',
    created_by: 'u2',
    department_id: 'd2',
    due_date: '2026-08-15',
    started_at: '2026-06-01T09:00:00Z',
    completed_at: null,
    cycle_time_hours: null,
    estimated_hours: null,
    tags: ['finance', 'erp', 'digital-transformation'],
    created_at: '2026-05-20T10:00:00Z',
    updated_at: '2026-06-22T08:00:00Z',
    progress_model: 'milestone',
  },
]

// ─── Milestone records ────────────────────────────────────────────────────────
export const MILESTONES: Milestone[] = [
  // mm1 — Mumbai Branch Office (50% complete: lease + staff done)
  { id: 'ms1', task_id: 'mm1', title: 'Lease Signed',        weight: 20, completed: true,  completed_at: '2026-06-05T10:00:00Z', sort_order: 1, created_at: '2026-05-25T10:00:00Z' },
  { id: 'ms2', task_id: 'mm1', title: 'Staff Hired',         weight: 30, completed: true,  completed_at: '2026-06-15T10:00:00Z', sort_order: 2, created_at: '2026-05-25T10:00:00Z' },
  { id: 'ms3', task_id: 'mm1', title: 'Furniture Installed', weight: 20, completed: false, completed_at: null,                   sort_order: 3, created_at: '2026-05-25T10:00:00Z' },
  { id: 'ms4', task_id: 'mm1', title: 'IT Setup Complete',   weight: 20, completed: false, completed_at: null,                   sort_order: 4, created_at: '2026-05-25T10:00:00Z' },
  { id: 'ms5', task_id: 'mm1', title: 'Go Live',             weight: 10, completed: false, completed_at: null,                   sort_order: 5, created_at: '2026-05-25T10:00:00Z' },
  // mm2 — ERP Implementation (35% complete: requirements + vendor done)
  { id: 'ms6', task_id: 'mm2', title: 'Requirements Gathered',  weight: 15, completed: true,  completed_at: '2026-06-08T10:00:00Z', sort_order: 1, created_at: '2026-05-20T10:00:00Z' },
  { id: 'ms7', task_id: 'mm2', title: 'Vendor Selected',        weight: 20, completed: true,  completed_at: '2026-06-18T10:00:00Z', sort_order: 2, created_at: '2026-05-20T10:00:00Z' },
  { id: 'ms8', task_id: 'mm2', title: 'Data Migration',         weight: 25, completed: false, completed_at: null,                   sort_order: 3, created_at: '2026-05-20T10:00:00Z' },
  { id: 'ms9', task_id: 'mm2', title: 'User Training',          weight: 20, completed: false, completed_at: null,                   sort_order: 4, created_at: '2026-05-20T10:00:00Z' },
  { id: 'ms10',task_id: 'mm2', title: 'Go Live & Hypercare',    weight: 20, completed: false, completed_at: null,                   sort_order: 5, created_at: '2026-05-20T10:00:00Z' },
]

// All tasks combined — use this as the Zustand store seed
export const ALL_TASKS: Task[] = [...TASKS, ...MEASURABLE_TASKS]

// ─── Progress history (weekly snapshots per measurable task) ──────────────────
export const PROGRESS_HISTORY: TaskProgressHistory[] = [
  // mt1 — Email Outreach
  { id: 'ph_mt1_1', task_id: 'mt1', recorded_date: '2026-06-02', completed_quantity: 0,   progress_percentage: 0,    daily_delta: 0,  created_at: '2026-06-02T18:00:00Z' },
  { id: 'ph_mt1_2', task_id: 'mt1', recorded_date: '2026-06-08', completed_quantity: 112,  progress_percentage: 22.4, daily_delta: 16, created_at: '2026-06-08T18:00:00Z' },
  { id: 'ph_mt1_3', task_id: 'mt1', recorded_date: '2026-06-15', completed_quantity: 232,  progress_percentage: 46.4, daily_delta: 17, created_at: '2026-06-15T18:00:00Z' },
  { id: 'ph_mt1_4', task_id: 'mt1', recorded_date: '2026-06-22', completed_quantity: 320,  progress_percentage: 64.0, daily_delta: 13, created_at: '2026-06-22T18:00:00Z' },
  // mt2 — Invoice Processing
  { id: 'ph_mt2_1', task_id: 'mt2', recorded_date: '2026-05-15', completed_quantity: 0,   progress_percentage: 0,    daily_delta: 0,  created_at: '2026-05-15T18:00:00Z' },
  { id: 'ph_mt2_2', task_id: 'mt2', recorded_date: '2026-05-22', completed_quantity: 196,  progress_percentage: 16.3, daily_delta: 28, created_at: '2026-05-22T18:00:00Z' },
  { id: 'ph_mt2_3', task_id: 'mt2', recorded_date: '2026-05-29', completed_quantity: 426,  progress_percentage: 35.5, daily_delta: 33, created_at: '2026-05-29T18:00:00Z' },
  { id: 'ph_mt2_4', task_id: 'mt2', recorded_date: '2026-06-05', completed_quantity: 644,  progress_percentage: 53.7, daily_delta: 31, created_at: '2026-06-05T18:00:00Z' },
  { id: 'ph_mt2_5', task_id: 'mt2', recorded_date: '2026-06-12', completed_quantity: 812,  progress_percentage: 67.7, daily_delta: 24, created_at: '2026-06-12T18:00:00Z' },
  { id: 'ph_mt2_6', task_id: 'mt2', recorded_date: '2026-06-19', completed_quantity: 872,  progress_percentage: 72.7, daily_delta: 9,  created_at: '2026-06-19T18:00:00Z' },
  { id: 'ph_mt2_7', task_id: 'mt2', recorded_date: '2026-06-22', completed_quantity: 900,  progress_percentage: 75.0, daily_delta: 9,  created_at: '2026-06-22T18:00:00Z' },
  // mt3 — Vendor Audits
  { id: 'ph_mt3_1', task_id: 'mt3', recorded_date: '2026-06-01', completed_quantity: 0,   progress_percentage: 0,    daily_delta: 0, created_at: '2026-06-01T18:00:00Z' },
  { id: 'ph_mt3_2', task_id: 'mt3', recorded_date: '2026-06-08', completed_quantity: 18,   progress_percentage: 22.5, daily_delta: 3, created_at: '2026-06-08T18:00:00Z' },
  { id: 'ph_mt3_3', task_id: 'mt3', recorded_date: '2026-06-15', completed_quantity: 35,   progress_percentage: 43.8, daily_delta: 2, created_at: '2026-06-15T18:00:00Z' },
  { id: 'ph_mt3_4', task_id: 'mt3', recorded_date: '2026-06-22', completed_quantity: 50,   progress_percentage: 62.5, daily_delta: 2, created_at: '2026-06-22T18:00:00Z' },
  // mt4 — Code Reviews
  { id: 'ph_mt4_1', task_id: 'mt4', recorded_date: '2026-06-10', completed_quantity: 0,  progress_percentage: 0,    daily_delta: 0, created_at: '2026-06-10T18:00:00Z' },
  { id: 'ph_mt4_2', task_id: 'mt4', recorded_date: '2026-06-15', completed_quantity: 12,  progress_percentage: 30.0, daily_delta: 2, created_at: '2026-06-15T18:00:00Z' },
  { id: 'ph_mt4_3', task_id: 'mt4', recorded_date: '2026-06-22', completed_quantity: 28,  progress_percentage: 70.0, daily_delta: 2, created_at: '2026-06-22T18:00:00Z' },
  // mt5 — Bug Fixes
  { id: 'ph_mt5_1', task_id: 'mt5', recorded_date: '2026-06-10', completed_quantity: 0,  progress_percentage: 0,    daily_delta: 0, created_at: '2026-06-10T18:00:00Z' },
  { id: 'ph_mt5_2', task_id: 'mt5', recorded_date: '2026-06-15', completed_quantity: 8,   progress_percentage: 32.0, daily_delta: 2, created_at: '2026-06-15T18:00:00Z' },
  { id: 'ph_mt5_3', task_id: 'mt5', recorded_date: '2026-06-22', completed_quantity: 18,  progress_percentage: 72.0, daily_delta: 1, created_at: '2026-06-22T18:00:00Z' },
  // mt6 — Test Coverage
  { id: 'ph_mt6_1', task_id: 'mt6', recorded_date: '2026-06-01', completed_quantity: 0,  progress_percentage: 0,    daily_delta: 0, created_at: '2026-06-01T18:00:00Z' },
  { id: 'ph_mt6_2', task_id: 'mt6', recorded_date: '2026-06-08', completed_quantity: 22,  progress_percentage: 22.0, daily_delta: 3, created_at: '2026-06-08T18:00:00Z' },
  { id: 'ph_mt6_3', task_id: 'mt6', recorded_date: '2026-06-15', completed_quantity: 46,  progress_percentage: 46.0, daily_delta: 3, created_at: '2026-06-15T18:00:00Z' },
  { id: 'ph_mt6_4', task_id: 'mt6', recorded_date: '2026-06-22', completed_quantity: 67,  progress_percentage: 67.0, daily_delta: 3, created_at: '2026-06-22T18:00:00Z' },
  // mt7 — Discovery Calls
  { id: 'ph_mt7_1', task_id: 'mt7', recorded_date: '2026-06-10', completed_quantity: 0,  progress_percentage: 0,    daily_delta: 0, created_at: '2026-06-10T18:00:00Z' },
  { id: 'ph_mt7_2', task_id: 'mt7', recorded_date: '2026-06-15', completed_quantity: 18,  progress_percentage: 30.0, daily_delta: 4, created_at: '2026-06-15T18:00:00Z' },
  { id: 'ph_mt7_3', task_id: 'mt7', recorded_date: '2026-06-22', completed_quantity: 38,  progress_percentage: 63.3, daily_delta: 3, created_at: '2026-06-22T18:00:00Z' },
]
