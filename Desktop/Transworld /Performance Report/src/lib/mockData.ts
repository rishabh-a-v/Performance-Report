import type { Profile, Department, Branch, Task, DailyCheckin, Blocker, Invoice, Audit, FinanceKPI, PerformanceSnapshot, DepartmentSnapshot, TaskProgressHistory, Milestone, JobDirection, JDMilestone, SpecialTask, CSCDailyReport, CETDailyReport, EQBOrder, UnbilledReport, DailyPerformanceReport } from '@/types/database'

export const DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Engineering',  head_id: null,  budget: 2000000, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'd2', name: 'Finance',      head_id: 'u5',  budget: 800000,  created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'd3', name: 'Sales',        head_id: 'u8',  budget: 1200000, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'd4', name: 'Operations',   head_id: 'u6',  budget: 600000,  created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'd5', name: 'HR',           head_id: 'u7',  budget: 400000,  created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'd6', name: 'CSC',          head_id: 'u20', budget: 500000,  created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'd7', name: 'CET',          head_id: 'u23', budget: 450000,  created_at: '2024-01-01', updated_at: '2024-01-01' },
]

export const BRANCHES: Branch[] = [
  { id: 'b1', name: 'Mumbai HQ',   city: 'Mumbai',    state: 'Maharashtra', head_id: 'u1'  },
  { id: 'b2', name: 'Delhi NCR',   city: 'New Delhi', state: 'Delhi',       head_id: 'u2'  },
  { id: 'b3', name: 'Chennai',     city: 'Chennai',   state: 'Tamil Nadu',  head_id: 'u22' },
  { id: 'b4', name: 'Bengaluru',   city: 'Bengaluru', state: 'Karnataka',   head_id: 'u24' },
  { id: 'b5', name: 'Hyderabad',   city: 'Hyderabad', state: 'Telangana',   head_id: 'u25' },
  { id: 'b6', name: 'Kolkata',     city: 'Kolkata',   state: 'West Bengal', head_id: null  },
]

export const PROFILES: Profile[] = [
  // ── Top Level ────────────────────────────────────────────────────────────────
  { id: 'u1',  email: 'md@transworld.com',          full_name: 'Rajesh Mehta',      role: 'managing_director', department_id: null, manager_id: null,  employee_code: 'EX001', designation: 'Managing Director',   is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  // ── Directors ────────────────────────────────────────────────────────────────
  { id: 'u2',  email: 'cfo@transworld.com',         full_name: 'Anil Kumar',        role: 'director',          department_id: 'd2', manager_id: 'u1',  employee_code: 'DH001', designation: 'Director',            is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u3',  email: 'eng.head@transworld.com',    full_name: 'Priya Nair',        role: 'director',          department_id: 'd4', manager_id: 'u1',  employee_code: 'DH002', designation: 'Director',            is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  // ── Executive Assistant ───────────────────────────────────────────────────────
  { id: 'u4',  email: 'fin.head@transworld.com',    full_name: 'Neha Sharma',       role: 'executive',         department_id: null, manager_id: 'u1',  employee_code: 'EA001', designation: 'Executive Assistant', is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  // ── Managers ─────────────────────────────────────────────────────────────────
  { id: 'u5',  email: 'sales.head@transworld.com',  full_name: 'Ravi Kumar',        role: 'manager',           department_id: 'd2', manager_id: 'u2',  employee_code: 'MG001', designation: 'Finance Manager',     is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u6',  email: 'ops.head@transworld.com',    full_name: 'Arjun Singh',       role: 'manager',           department_id: 'd4', manager_id: 'u3',  employee_code: 'MG002', designation: 'Operations Manager',  is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u7',  email: 'hr.head@transworld.com',     full_name: 'Sneha Patel',       role: 'manager',           department_id: 'd5', manager_id: 'u3',  employee_code: 'MG003', designation: 'HR Manager',          is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u8',  email: 'mgr1@transworld.com',        full_name: 'Karan Verma',       role: 'manager',           department_id: 'd3', manager_id: 'u2',  employee_code: 'MG004', designation: 'Sales Manager',       is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  // ── Executives ───────────────────────────────────────────────────────────────
  { id: 'u9',  email: 'mgr2@transworld.com',        full_name: 'Amit Gupta',        role: 'executive',         department_id: 'd2', manager_id: 'u5',  employee_code: 'EM001', designation: 'Finance Executive',   is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u10', email: 'emp1@transworld.com',        full_name: 'Pooja Reddy',       role: 'executive',         department_id: 'd2', manager_id: 'u5',  employee_code: 'EM002', designation: 'Finance Executive',   is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u11', email: 'emp2@transworld.com',        full_name: 'Rohit Das',         role: 'executive',         department_id: 'd4', manager_id: 'u6',  employee_code: 'EM003', designation: 'Operations Executive',is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u12', email: 'emp3@transworld.com',        full_name: 'Meera Iyer',        role: 'executive',         department_id: 'd4', manager_id: 'u6',  employee_code: 'EM004', designation: 'Operations Executive',is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u13', email: 'emp4@transworld.com',        full_name: 'Vikram Shah',       role: 'executive',         department_id: 'd5', manager_id: 'u7',  employee_code: 'EM005', designation: 'HR Executive',        is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u14', email: 'demo@transworld.com',        full_name: 'Ananya Rao',        role: 'executive',         department_id: 'd3', manager_id: 'u8',  employee_code: 'EM006', designation: 'Sales Executive',     is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  // ── Legacy profiles (inactive — referenced in historical task data) ───────────
  { id: 'u15', email: 'sales2@transworld.com',      full_name: 'Meena Kapoor',      role: 'executive',         department_id: 'd3', manager_id: 'u8',  employee_code: 'EM007', designation: 'Sales Executive',     is_active: false, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u16', email: 'ops.mgr@transworld.com',     full_name: 'Suresh Pillai',     role: 'manager',           department_id: 'd4', manager_id: 'u6',  employee_code: 'MG005', designation: 'Operations Manager',  is_active: false, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u17', email: 'ops2@transworld.com',        full_name: 'Devika Nair',       role: 'executive',         department_id: 'd4', manager_id: 'u16', employee_code: 'EM008', designation: 'Operations Executive',is_active: false, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u18', email: 'hr2@transworld.com',         full_name: 'Kavya Reddy',       role: 'executive',         department_id: 'd5', manager_id: 'u7',  employee_code: 'EM009', designation: 'HR Executive',        is_active: false, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u19', email: 'fin2@transworld.com',        full_name: 'Ankit Sharma',      role: 'executive',         department_id: 'd2', manager_id: 'u5',  employee_code: 'EM010', designation: 'Finance Executive',   is_active: false, avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  // ── CSC Team ─────────────────────────────────────────────────────────────────
  { id: 'u20', email: 'csc.head@transworld.com',    full_name: 'Payal Gupta',       role: 'manager',           department_id: 'd6', manager_id: 'u6',  employee_code: 'MG006', designation: 'CSC Head',            is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u21', email: 'csc1@transworld.com',        full_name: 'Sunil Rao',         role: 'executive',         department_id: 'd6', manager_id: 'u20', employee_code: 'CS001', designation: 'CSC Executive',       is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u22', email: 'csc2@transworld.com',        full_name: 'Priya Jain',        role: 'executive',         department_id: 'd6', manager_id: 'u20', employee_code: 'CS002', designation: 'CSC Executive',       is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u26', email: 'csc3@transworld.com',        full_name: 'Suman Das',         role: 'executive',         department_id: 'd6', manager_id: 'u20', employee_code: 'CS003', designation: 'CSC Executive',       is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  // ── CET Team ─────────────────────────────────────────────────────────────────
  { id: 'u23', email: 'cet.head@transworld.com',    full_name: 'Arjun Patel',       role: 'manager',           department_id: 'd7', manager_id: 'u1',  employee_code: 'MG007', designation: 'CET Manager',         is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u24', email: 'cet1@transworld.com',        full_name: 'Deepak Singh',      role: 'executive',         department_id: 'd7', manager_id: 'u23', employee_code: 'CT001', designation: 'Estimation Executive',is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'u25', email: 'cet2@transworld.com',        full_name: 'Neha Verma',        role: 'executive',         department_id: 'd7', manager_id: 'u23', employee_code: 'CT002', designation: 'Estimation Executive',is_active: true,  avatar_url: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
]

export const TASKS: Task[] = [
  { id: 't1',  title: 'Migrate auth service to Supabase',        description: 'Replace legacy JWT with Supabase Auth',       status: 'in_progress', priority: 'high',     assignee_id: 'u10', created_by: 'u8',  department_id: 'd1', due_date: '2026-06-28', started_at: '2026-06-10', completed_at: null, cycle_time_hours: null, estimated_hours: 40, tags: ['backend', 'auth'],  created_at: '2026-06-01', updated_at: '2026-06-18' },
  { id: 't2',  title: 'Dashboard performance optimisation',       description: 'Reduce TTI by 30% via code splitting',        status: 'blocked',     priority: 'high',     assignee_id: 'u11', created_by: 'u8',  department_id: 'd1', due_date: '2026-06-25', started_at: '2026-06-08', completed_at: null, cycle_time_hours: null, estimated_hours: 20, tags: ['frontend'],        created_at: '2026-06-01', updated_at: '2026-06-20' },
  { id: 't3',  title: 'Q2 financial reconciliation',              description: 'Reconcile all Q2 ledgers',                    status: 'done',        priority: 'critical', assignee_id: 'u13', created_by: 'u4',  department_id: 'd2', due_date: '2026-06-20', started_at: '2026-06-15', completed_at: '2026-06-19', cycle_time_hours: 96, estimated_hours: 80, tags: ['finance'],        created_at: '2026-06-01', updated_at: '2026-06-19' },
  { id: 't4',  title: 'Enterprise client onboarding (ACME)',      description: 'Coordinate full onboarding for ACME Corp',     status: 'in_progress', priority: 'critical', assignee_id: 'u12', created_by: 'u9',  department_id: 'd3', due_date: '2026-06-30', started_at: '2026-06-18', completed_at: null, cycle_time_hours: null, estimated_hours: 60, tags: ['sales', 'client'], created_at: '2026-06-10', updated_at: '2026-06-22' },
  { id: 't5',  title: 'API rate limiting implementation',         description: 'Add token-bucket rate limiting to REST APIs',  status: 'in_progress',       priority: 'medium',   assignee_id: 'u10', created_by: 'u8',  department_id: 'd1', due_date: '2026-07-05', started_at: null, completed_at: null, cycle_time_hours: null, estimated_hours: 16, tags: ['backend', 'infra'], created_at: '2026-06-15', updated_at: '2026-06-15' },
  { id: 't7',  title: 'Invoice processing automation',            description: 'Automate invoice extraction via OCR',          status: 'in_progress', priority: 'high',     assignee_id: 'u13', created_by: 'u4',  department_id: 'd2', due_date: '2026-07-10', started_at: '2026-06-20', completed_at: null, cycle_time_hours: null, estimated_hours: 32, tags: ['finance', 'automation'], created_at: '2026-06-12', updated_at: '2026-06-22' },
  { id: 't8',  title: 'Sales pipeline CRM cleanup',               description: 'Remove stale leads from CRM',                  status: 'done',        priority: 'low',      assignee_id: 'u12', created_by: 'u9',  department_id: 'd3', due_date: '2026-06-18', started_at: '2026-06-14', completed_at: '2026-06-17', cycle_time_hours: 48, estimated_hours: 12, tags: ['sales'],           created_at: '2026-06-10', updated_at: '2026-06-17' },
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
  'md@transworld.com':          'Rajesh Mehta · Managing Director',
  'cfo@transworld.com':         'Anil Kumar · Director',
  'mgr1@transworld.com':        'Karan Verma · Sales Manager',
  'demo@transworld.com':        'Ananya Rao · Sales Executive',
  'fin.head@transworld.com':    'Neha Sharma · Executive Assistant',
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

export const JOB_DIRECTIONS: JobDirection[] = [
  { id: 'jd1',  title: 'Monthly Invoice Processing — 1,500 Invoices', description: 'Process and reconcile a minimum of 1,500 invoices per month across all vendor accounts.', employee_id: 'u13', manager_id: 'u4',  department_id: 'd2', progress_type: 'quantity', target_value: 1500,    current_value: 900,     unit: 'Invoices', progress_percentage: 60,    status: 'active',    due_date: '2026-06-30', review_notes: null, submitted_for_review_at: null, approved_at: null, rejected_at: null, created_at: '2026-06-01T09:00:00Z', updated_at: '2026-06-22T08:00:00Z' },
  { id: 'jd2',  title: 'Improve Collection Rate by 15%', description: 'Increase the accounts receivable collection rate from 82% to 97% by end of Q3.', employee_id: 'u13', manager_id: 'u4',  department_id: 'd2', progress_type: 'value',    target_value: 97,      current_value: 89,      unit: '%',        progress_percentage: 75,    status: 'submitted', review_notes: null, submitted_for_review_at: '2026-06-22T10:00:00Z', approved_at: null, rejected_at: null, created_at: '2026-04-01T09:00:00Z', updated_at: '2026-06-22T10:00:00Z' },
  { id: 'jd3',  title: 'Q2 Enterprise Revenue Target — ₹50L', description: 'Close enterprise deals worth ₹50,00,000 in Q2 through new and existing accounts.', employee_id: 'u12', manager_id: 'u9',  department_id: 'd3', progress_type: 'value',    target_value: 5000000, current_value: 4100000, unit: 'INR',      progress_percentage: 82,    status: 'approved',  review_notes: 'Excellent progress. Keep pushing on the Pinnacle account.', submitted_for_review_at: '2026-06-20T09:00:00Z', approved_at: '2026-06-21T11:00:00Z', rejected_at: null, created_at: '2026-04-01T09:00:00Z', updated_at: '2026-06-21T11:00:00Z' },
  { id: 'jd4',  title: 'New Client Acquisition — 20 Accounts', description: 'Onboard 20 new enterprise clients in the BFSI and Manufacturing verticals by end of Q3.', employee_id: 'u12', manager_id: 'u9',  department_id: 'd3', progress_type: 'quantity', target_value: 20,      current_value: 13,      unit: 'Clients',  progress_percentage: 65,    status: 'active',    review_notes: null, submitted_for_review_at: null, approved_at: null, rejected_at: null, created_at: '2026-04-01T09:00:00Z', updated_at: '2026-06-22T08:00:00Z' },
  { id: 'jd5',  title: 'Lead Generation — 500 Qualified Leads', description: 'Generate 500 qualified leads through LinkedIn outreach and email campaigns by end of Q2.', employee_id: 'u15', manager_id: 'u9',  department_id: 'd3', progress_type: 'quantity', target_value: 500,     current_value: 312,     unit: 'Leads',    progress_percentage: 62.4,  status: 'active',    review_notes: null, submitted_for_review_at: null, approved_at: null, rejected_at: null, created_at: '2026-04-01T09:00:00Z', updated_at: '2026-06-22T08:00:00Z' },
  { id: 'jd6',  title: 'Platform v3.0 Release', description: 'Lead backend engineering for the v3.0 platform release with zero P1 regressions.', employee_id: 'u10', manager_id: 'u8',  department_id: 'd1', progress_type: 'milestone', target_value: null,    current_value: null,    unit: null,       progress_percentage: 55,    status: 'active',    review_notes: null, submitted_for_review_at: null, approved_at: null, rejected_at: null, created_at: '2026-04-20T09:00:00Z', updated_at: '2026-06-22T08:00:00Z' },
  { id: 'jd7',  title: 'Expand Test Coverage to 80%', description: 'Increase unit and integration test coverage across all core modules from 45% to 80%.', employee_id: 'u14', manager_id: 'u8',  department_id: 'd1', progress_type: 'quantity', target_value: 80,      current_value: 67,      unit: '%',        progress_percentage: 83.75, status: 'submitted', due_date: '2026-07-31', review_notes: null, submitted_for_review_at: '2026-06-22T09:00:00Z', approved_at: null, rejected_at: null, created_at: '2026-05-01T09:00:00Z', updated_at: '2026-06-22T09:00:00Z' },
  { id: 'jd8',  title: 'API Documentation Overhaul', description: 'Rewrite all public API documentation with examples, error codes, and migration guides.', employee_id: 'u14', manager_id: 'u8',  department_id: 'd1', progress_type: 'milestone', target_value: null,    current_value: null,    unit: null,       progress_percentage: 30,    status: 'active',    due_date: '2026-08-31', review_notes: null, submitted_for_review_at: null, approved_at: null, rejected_at: null, created_at: '2026-05-15T09:00:00Z', updated_at: '2026-06-22T08:00:00Z' },
  { id: 'jd9',  title: 'Frontend Performance Optimisation — 30% TTI Reduction', description: 'Reduce Time to Interactive by 30% across all dashboard views via code splitting and lazy loading.', employee_id: 'u11', manager_id: 'u8',  department_id: 'd1', progress_type: 'value',    target_value: 30,      current_value: 18,      unit: '%',        progress_percentage: 60,    status: 'rejected',  review_notes: 'Needs more rigorous benchmarking methodology. Please include Lighthouse scores and before/after comparison before resubmitting.', submitted_for_review_at: '2026-06-18T10:00:00Z', approved_at: null, rejected_at: '2026-06-20T14:00:00Z', created_at: '2026-05-01T09:00:00Z', updated_at: '2026-06-20T14:00:00Z' },
  { id: 'jd10', title: 'Reduce Shipment Delays by 20%', description: 'Reduce average shipment delay rate from 12% to below 10% through vendor SLA enforcement and dispatch optimisation.', employee_id: 'u17', manager_id: 'u16', department_id: 'd4', progress_type: 'value',    target_value: 20,      current_value: 9,       unit: '%',        progress_percentage: 45,    status: 'active',    review_notes: null, submitted_for_review_at: null, approved_at: null, rejected_at: null, created_at: '2026-04-01T09:00:00Z', updated_at: '2026-06-22T08:00:00Z' },
  { id: 'jd11', title: 'Improve Employee Satisfaction to 85%', description: 'Raise the H1 employee satisfaction score from 72% to 85% through targeted engagement and culture initiatives.', employee_id: 'u18', manager_id: 'u7',  department_id: 'd5', progress_type: 'value',    target_value: 85,      current_value: 72,      unit: '%',        progress_percentage: 72,    status: 'active',    review_notes: null, submitted_for_review_at: null, approved_at: null, rejected_at: null, created_at: '2026-01-01T09:00:00Z', updated_at: '2026-06-22T08:00:00Z' },
  { id: 'jd12', title: 'Accounts Receivable Collection — ₹60L', description: 'Recover ₹60,00,000 in outstanding AR from overdue enterprise accounts by end of Q3.', employee_id: 'u19', manager_id: 'u4',  department_id: 'd2', progress_type: 'value',    target_value: 6000000, current_value: 3200000, unit: 'INR',      progress_percentage: 53.3,  status: 'active',    review_notes: null, submitted_for_review_at: null, approved_at: null, rejected_at: null, created_at: '2026-04-01T09:00:00Z', updated_at: '2026-06-22T08:00:00Z' },
]

export const JD_MILESTONES: JDMilestone[] = [
  { id: 'jdms1',  job_direction_id: 'jd6', title: 'Technical Spec Approved',              weight: 10, completed: true,  completed_at: '2026-05-08T10:00:00Z', sort_order: 1, created_at: '2026-04-20T10:00:00Z' },
  { id: 'jdms2',  job_direction_id: 'jd6', title: 'UI/UX Design Complete',                weight: 15, completed: true,  completed_at: '2026-05-22T10:00:00Z', sort_order: 2, created_at: '2026-04-20T10:00:00Z' },
  { id: 'jdms3',  job_direction_id: 'jd6', title: 'Backend APIs Built',                   weight: 30, completed: true,  completed_at: '2026-06-18T10:00:00Z', sort_order: 3, created_at: '2026-04-20T10:00:00Z' },
  { id: 'jdms4',  job_direction_id: 'jd6', title: 'Frontend Integration',                 weight: 25, completed: false, completed_at: null, sort_order: 4, created_at: '2026-04-20T10:00:00Z' },
  { id: 'jdms5',  job_direction_id: 'jd6', title: 'QA Sign-off',                          weight: 10, completed: false, completed_at: null, sort_order: 5, created_at: '2026-04-20T10:00:00Z' },
  { id: 'jdms6',  job_direction_id: 'jd6', title: 'Production Deployment',                weight: 10, completed: false, completed_at: null, sort_order: 6, created_at: '2026-04-20T10:00:00Z' },
  { id: 'jdms7',  job_direction_id: 'jd8', title: 'Audit existing docs',                  weight: 15, completed: true,  completed_at: '2026-06-05T10:00:00Z', sort_order: 1, created_at: '2026-05-15T10:00:00Z' },
  { id: 'jdms8',  job_direction_id: 'jd8', title: 'Write auth & user endpoints',          weight: 15, completed: true,  completed_at: '2026-06-18T10:00:00Z', sort_order: 2, created_at: '2026-05-15T10:00:00Z' },
  { id: 'jdms9',  job_direction_id: 'jd8', title: 'Write billing & reporting endpoints',  weight: 25, completed: false, completed_at: null, sort_order: 3, created_at: '2026-05-15T10:00:00Z' },
  { id: 'jdms10', job_direction_id: 'jd8', title: 'Code examples & SDK snippets',         weight: 25, completed: false, completed_at: null, sort_order: 4, created_at: '2026-05-15T10:00:00Z' },
  { id: 'jdms11', job_direction_id: 'jd8', title: 'Review & publish',                     weight: 20, completed: false, completed_at: null, sort_order: 5, created_at: '2026-05-15T10:00:00Z' },
]

export const SPECIAL_TASKS: SpecialTask[] = [
  { id: 'st1',  title: 'Prepare weekly engineering status report',         description: null, assigned_to: 'u14', assigned_by: 'u8',  priority: 'medium',   due_date: '2026-06-23', status: 'pending',     created_at: '2026-06-22T09:00:00Z', updated_at: '2026-06-22T09:00:00Z' },
  { id: 'st2',  title: 'Review security audit findings',                   description: 'Go through the penetration test report and flag critical items.', assigned_to: 'u10', assigned_by: 'u8',  priority: 'high',     due_date: '2026-06-24', status: 'in_progress', created_at: '2026-06-21T09:00:00Z', updated_at: '2026-06-22T10:00:00Z' },
  { id: 'st3',  title: 'Fix login page CSS on mobile',                     description: null, assigned_to: 'u11', assigned_by: 'u8',  priority: 'low',      due_date: '2026-06-25', status: 'pending',     created_at: '2026-06-22T09:00:00Z', updated_at: '2026-06-22T09:00:00Z' },
  { id: 'st4',  title: 'Attend sprint retrospective',                      description: null, assigned_to: 'u14', assigned_by: 'u8',  priority: 'medium',   due_date: '2026-06-23', status: 'completed',   created_at: '2026-06-20T09:00:00Z', updated_at: '2026-06-22T16:00:00Z' },
  { id: 'st5',  title: 'Create customer presentation for Horizon Pvt Ltd', description: 'Use the Q2 case study deck as base and customise for the logistics sector.', assigned_to: 'u12', assigned_by: 'u9',  priority: 'high',     due_date: '2026-06-24', status: 'in_progress', created_at: '2026-06-21T09:00:00Z', updated_at: '2026-06-22T09:00:00Z' },
  { id: 'st6',  title: 'Follow up with Delta Solutions on overdue payment', description: null, assigned_to: 'u15', assigned_by: 'u9',  priority: 'high',     due_date: '2026-06-23', status: 'pending',     created_at: '2026-06-22T09:00:00Z', updated_at: '2026-06-22T09:00:00Z' },
  { id: 'st7',  title: 'Update CRM with June discovery call notes',        description: null, assigned_to: 'u12', assigned_by: 'u9',  priority: 'low',      due_date: '2026-06-25', status: 'completed',   created_at: '2026-06-19T09:00:00Z', updated_at: '2026-06-22T12:00:00Z' },
  { id: 'st8',  title: 'Contact Pinnacle Systems regarding INV-2026-004',  description: 'Invoice of ₹3.2L is 2 weeks overdue. Escalate if no response.', assigned_to: 'u19', assigned_by: 'u4',  priority: 'critical', due_date: '2026-06-23', status: 'in_progress', created_at: '2026-06-22T08:00:00Z', updated_at: '2026-06-22T10:00:00Z' },
  { id: 'st9',  title: 'Prepare monthly finance summary for CFO',          description: null, assigned_to: 'u13', assigned_by: 'u4',  priority: 'high',     due_date: '2026-06-25', status: 'pending',     created_at: '2026-06-22T09:00:00Z', updated_at: '2026-06-22T09:00:00Z' },
  { id: 'st10', title: 'Attend vendor audit meeting',                      description: null, assigned_to: 'u13', assigned_by: 'u4',  priority: 'medium',   due_date: '2026-06-23', status: 'completed',   created_at: '2026-06-20T09:00:00Z', updated_at: '2026-06-22T14:00:00Z' },
  { id: 'st11', title: 'Call BlueDart logistics regarding June MIS report', description: null, assigned_to: 'u17', assigned_by: 'u16', priority: 'high',     due_date: '2026-06-23', status: 'in_progress', created_at: '2026-06-22T09:00:00Z', updated_at: '2026-06-22T10:00:00Z' },
  { id: 'st12', title: 'Submit Q2 warehouse cost report to ops head',      description: null, assigned_to: 'u17', assigned_by: 'u16', priority: 'medium',   due_date: '2026-06-26', status: 'pending',     created_at: '2026-06-22T09:00:00Z', updated_at: '2026-06-22T09:00:00Z' },
  { id: 'st13', title: 'Schedule onboarding session for new joiners',      description: null, assigned_to: 'u18', assigned_by: 'u7',  priority: 'medium',   due_date: '2026-06-24', status: 'pending',     created_at: '2026-06-22T09:00:00Z', updated_at: '2026-06-22T09:00:00Z' },
  { id: 'st14', title: 'Send payslips for June payroll',                   description: null, assigned_to: 'u18', assigned_by: 'u7',  priority: 'high',     due_date: '2026-06-23', status: 'completed',   created_at: '2026-06-20T09:00:00Z', updated_at: '2026-06-22T16:00:00Z' },
  { id: 'st15', title: 'Submit expense report — May',                      description: null, assigned_to: 'u14', assigned_by: 'u8',  priority: 'low',      due_date: '2026-06-20', status: 'pending',     created_at: '2026-06-15T09:00:00Z', updated_at: '2026-06-15T09:00:00Z' },
  { id: 'st16', title: 'Draft Q3 sales strategy deck',                     description: null, assigned_to: 'u15', assigned_by: 'u9',  priority: 'high',     due_date: '2026-06-28', status: 'pending',     created_at: '2026-06-22T09:00:00Z', updated_at: '2026-06-22T09:00:00Z' },
]

// ─── CSC Daily Reports ────────────────────────────────────────────────────────
export const CSC_REPORTS: CSCDailyReport[] = [
  // Ravi Kumar (u21) — Mumbai — last 3 days
  { id: 'csc1', employee_id: 'u21', branch_id: 'b1', report_date: '2026-06-22', hhg_packing_jobs: 12, customers_called_packing: 11, or_dc_commercial_moves: 8, customers_called_move: 8, in_transit_shipments: 15, customers_called_transit: 13, challenges: null, created_at: '2026-06-22T18:00:00Z', updated_at: '2026-06-22T18:00:00Z' },
  { id: 'csc2', employee_id: 'u21', branch_id: 'b1', report_date: '2026-06-21', hhg_packing_jobs: 10, customers_called_packing: 9,  or_dc_commercial_moves: 6, customers_called_move: 6, in_transit_shipments: 14, customers_called_transit: 12, challenges: null, created_at: '2026-06-21T18:00:00Z', updated_at: '2026-06-21T18:00:00Z' },
  { id: 'csc3', employee_id: 'u21', branch_id: 'b1', report_date: '2026-06-20', hhg_packing_jobs: 14, customers_called_packing: 12, or_dc_commercial_moves: 9, customers_called_move: 8, in_transit_shipments: 18, customers_called_transit: 14, challenges: 'High call volume; could not reach 4 transit customers.', created_at: '2026-06-20T18:00:00Z', updated_at: '2026-06-20T18:00:00Z' },
  // Priya Jain (u22) — Chennai — last 3 days (lower transit coverage — at-risk)
  { id: 'csc4', employee_id: 'u22', branch_id: 'b3', report_date: '2026-06-22', hhg_packing_jobs: 9,  customers_called_packing: 8,  or_dc_commercial_moves: 5, customers_called_move: 5, in_transit_shipments: 18, customers_called_transit: 10, challenges: 'Large number of in-transit shipments; transit follow-ups lagging.', created_at: '2026-06-22T18:00:00Z', updated_at: '2026-06-22T18:00:00Z' },
  { id: 'csc5', employee_id: 'u22', branch_id: 'b3', report_date: '2026-06-21', hhg_packing_jobs: 8,  customers_called_packing: 7,  or_dc_commercial_moves: 4, customers_called_move: 3, in_transit_shipments: 16, customers_called_transit: 9,  challenges: null, created_at: '2026-06-21T18:00:00Z', updated_at: '2026-06-21T18:00:00Z' },
  { id: 'csc6', employee_id: 'u22', branch_id: 'b3', report_date: '2026-06-20', hhg_packing_jobs: 11, customers_called_packing: 9,  or_dc_commercial_moves: 6, customers_called_move: 5, in_transit_shipments: 14, customers_called_transit: 8,  challenges: null, created_at: '2026-06-20T18:00:00Z', updated_at: '2026-06-20T18:00:00Z' },
  // Suman Das (u26) — Delhi — last 3 days
  { id: 'csc7', employee_id: 'u26', branch_id: 'b2', report_date: '2026-06-22', hhg_packing_jobs: 7,  customers_called_packing: 7,  or_dc_commercial_moves: 4, customers_called_move: 4, in_transit_shipments: 12, customers_called_transit: 11, challenges: null, created_at: '2026-06-22T18:00:00Z', updated_at: '2026-06-22T18:00:00Z' },
  { id: 'csc8', employee_id: 'u26', branch_id: 'b2', report_date: '2026-06-21', hhg_packing_jobs: 8,  customers_called_packing: 8,  or_dc_commercial_moves: 5, customers_called_move: 5, in_transit_shipments: 10, customers_called_transit: 9,  challenges: null, created_at: '2026-06-21T18:00:00Z', updated_at: '2026-06-21T18:00:00Z' },
  { id: 'csc9', employee_id: 'u26', branch_id: 'b2', report_date: '2026-06-20', hhg_packing_jobs: 6,  customers_called_packing: 6,  or_dc_commercial_moves: 3, customers_called_move: 3, in_transit_shipments: 11, customers_called_transit: 10, challenges: null, created_at: '2026-06-20T18:00:00Z', updated_at: '2026-06-20T18:00:00Z' },
]

// ─── CET Daily Reports ────────────────────────────────────────────────────────
export const CET_REPORTS: CETDailyReport[] = [
  // Deepak Singh (u24) — Mumbai — last 3 days
  { id: 'cet1', employee_id: 'u24', branch_id: 'b1', report_date: '2026-06-22', estimations_reviewed: 18, estimations_corrected: 4, jobs_confirmed: 11, quotes_pending: 6,  total_estimate_value: 1850000, challenges: null, created_at: '2026-06-22T18:00:00Z', updated_at: '2026-06-22T18:00:00Z' },
  { id: 'cet2', employee_id: 'u24', branch_id: 'b1', report_date: '2026-06-21', estimations_reviewed: 15, estimations_corrected: 3, jobs_confirmed: 9,  quotes_pending: 5,  total_estimate_value: 1520000, challenges: null, created_at: '2026-06-21T18:00:00Z', updated_at: '2026-06-21T18:00:00Z' },
  { id: 'cet3', employee_id: 'u24', branch_id: 'b1', report_date: '2026-06-20', estimations_reviewed: 20, estimations_corrected: 6, jobs_confirmed: 12, quotes_pending: 8,  total_estimate_value: 2100000, challenges: 'Several complex HHG estimates required manual recalculation.', created_at: '2026-06-20T18:00:00Z', updated_at: '2026-06-20T18:00:00Z' },
  // Neha Verma (u25) — Bengaluru — last 3 days (high conversion, low corrections — star)
  { id: 'cet4', employee_id: 'u25', branch_id: 'b4', report_date: '2026-06-22', estimations_reviewed: 22, estimations_corrected: 2, jobs_confirmed: 17, quotes_pending: 3,  total_estimate_value: 2450000, challenges: null, created_at: '2026-06-22T18:00:00Z', updated_at: '2026-06-22T18:00:00Z' },
  { id: 'cet5', employee_id: 'u25', branch_id: 'b4', report_date: '2026-06-21', estimations_reviewed: 19, estimations_corrected: 2, jobs_confirmed: 15, quotes_pending: 4,  total_estimate_value: 2100000, challenges: null, created_at: '2026-06-21T18:00:00Z', updated_at: '2026-06-21T18:00:00Z' },
  { id: 'cet6', employee_id: 'u25', branch_id: 'b4', report_date: '2026-06-20', estimations_reviewed: 16, estimations_corrected: 1, jobs_confirmed: 13, quotes_pending: 2,  total_estimate_value: 1780000, challenges: null, created_at: '2026-06-20T18:00:00Z', updated_at: '2026-06-20T18:00:00Z' },
  // Arjun Patel (u23) — manager reviewing too
  { id: 'cet7', employee_id: 'u23', branch_id: 'b1', report_date: '2026-06-22', estimations_reviewed: 10, estimations_corrected: 1, jobs_confirmed: 8,  quotes_pending: 2,  total_estimate_value: 980000,  challenges: null, created_at: '2026-06-22T18:00:00Z', updated_at: '2026-06-22T18:00:00Z' },
]

// ─── EQB Orders ───────────────────────────────────────────────────────────────
export const EQB_ORDERS: EQBOrder[] = [
  { id: 'eqb1',  branch_id: 'b1', employee_id: 'u21', order_date: '2026-06-22', order_value: 285000, customer_name: 'Reliance Industries',  status: 'confirmed',  created_at: '2026-06-22T10:00:00Z' },
  { id: 'eqb2',  branch_id: 'b1', employee_id: 'u21', order_date: '2026-06-22', order_value: 142000, customer_name: 'Tata Consultancy',      status: 'generated',  created_at: '2026-06-22T11:30:00Z' },
  { id: 'eqb3',  branch_id: 'b1', employee_id: 'u24', order_date: '2026-06-21', order_value: 375000, customer_name: 'Infosys Ltd',           status: 'confirmed',  created_at: '2026-06-21T09:00:00Z' },
  { id: 'eqb4',  branch_id: 'b2', employee_id: 'u26', order_date: '2026-06-22', order_value: 195000, customer_name: 'HCL Technologies',      status: 'confirmed',  created_at: '2026-06-22T10:00:00Z' },
  { id: 'eqb5',  branch_id: 'b2', employee_id: 'u26', order_date: '2026-06-21', order_value: 88000,  customer_name: 'Wipro Ltd',             status: 'generated',  created_at: '2026-06-21T14:00:00Z' },
  { id: 'eqb6',  branch_id: 'b3', employee_id: 'u22', order_date: '2026-06-22', order_value: 220000, customer_name: 'Cognizant Technology',  status: 'confirmed',  created_at: '2026-06-22T09:00:00Z' },
  { id: 'eqb7',  branch_id: 'b3', employee_id: 'u22', order_date: '2026-06-22', order_value: 155000, customer_name: 'L&T Technology',        status: 'generated',  created_at: '2026-06-22T15:00:00Z' },
  { id: 'eqb8',  branch_id: 'b3', employee_id: 'u22', order_date: '2026-06-21', order_value: 312000, customer_name: 'Hexaware Technologies', status: 'confirmed',  created_at: '2026-06-21T11:00:00Z' },
  { id: 'eqb9',  branch_id: 'b4', employee_id: 'u25', order_date: '2026-06-22', order_value: 430000, customer_name: 'Flipkart Logistics',    status: 'confirmed',  created_at: '2026-06-22T10:00:00Z' },
  { id: 'eqb10', branch_id: 'b4', employee_id: 'u25', order_date: '2026-06-22', order_value: 267000, customer_name: 'Amazon India',          status: 'generated',  created_at: '2026-06-22T12:00:00Z' },
  { id: 'eqb11', branch_id: 'b4', employee_id: 'u25', order_date: '2026-06-21', order_value: 189000, customer_name: 'Meesho Supply Chain',   status: 'confirmed',  created_at: '2026-06-21T10:00:00Z' },
  { id: 'eqb12', branch_id: 'b5', employee_id: 'u17', order_date: '2026-06-22', order_value: 175000, customer_name: 'DrReddy Laboratories', status: 'confirmed',  created_at: '2026-06-22T09:30:00Z' },
  { id: 'eqb13', branch_id: 'b5', employee_id: 'u17', order_date: '2026-06-21', order_value: 98000,  customer_name: 'Sun Pharma',            status: 'cancelled',  created_at: '2026-06-21T16:00:00Z' },
  { id: 'eqb14', branch_id: 'b6', employee_id: 'u19', order_date: '2026-06-22', order_value: 130000, customer_name: 'Britannia Industries',  status: 'generated',  created_at: '2026-06-22T11:00:00Z' },
  { id: 'eqb15', branch_id: 'b6', employee_id: 'u19', order_date: '2026-06-21', order_value: 87000,  customer_name: 'ITC Limited',           status: 'confirmed',  created_at: '2026-06-21T13:00:00Z' },
]

// ─── Unbilled Reports ─────────────────────────────────────────────────────────
export const UNBILLED_REPORTS: UnbilledReport[] = [
  { id: 'ub1', branch_id: 'b1', employee_id: 'u20', report_date: '2026-06-22', pending_pos: 8,  pending_po_value: 680000,  completed_jobs_not_billed: 12, unbilled_job_value: 1150000, damages_pending: 3, damage_value: 95000,  billed_jobs: 45, total_completed_jobs: 57, resolved_damages: 6,  closed_pos: 22, remarks: null, created_at: '2026-06-22T18:00:00Z' },
  { id: 'ub2', branch_id: 'b2', employee_id: 'u26', report_date: '2026-06-22', pending_pos: 5,  pending_po_value: 420000,  completed_jobs_not_billed: 7,  unbilled_job_value: 640000,  damages_pending: 2, damage_value: 48000,  billed_jobs: 38, total_completed_jobs: 45, resolved_damages: 5,  closed_pos: 18, remarks: 'One PO pending legal sign-off.', created_at: '2026-06-22T18:00:00Z' },
  { id: 'ub3', branch_id: 'b3', employee_id: 'u22', report_date: '2026-06-22', pending_pos: 12, pending_po_value: 980000,  completed_jobs_not_billed: 18, unbilled_job_value: 1820000, damages_pending: 5, damage_value: 185000, billed_jobs: 32, total_completed_jobs: 50, resolved_damages: 4,  closed_pos: 14, remarks: 'High unbilled exposure — escalation recommended.', created_at: '2026-06-22T18:00:00Z' },
  { id: 'ub4', branch_id: 'b4', employee_id: 'u25', report_date: '2026-06-22', pending_pos: 4,  pending_po_value: 310000,  completed_jobs_not_billed: 5,  unbilled_job_value: 480000,  damages_pending: 1, damage_value: 22000,  billed_jobs: 51, total_completed_jobs: 56, resolved_damages: 8,  closed_pos: 24, remarks: null, created_at: '2026-06-22T18:00:00Z' },
  { id: 'ub5', branch_id: 'b5', employee_id: 'u17', report_date: '2026-06-22', pending_pos: 6,  pending_po_value: 510000,  completed_jobs_not_billed: 9,  unbilled_job_value: 870000,  damages_pending: 3, damage_value: 72000,  billed_jobs: 29, total_completed_jobs: 38, resolved_damages: 3,  closed_pos: 12, remarks: null, created_at: '2026-06-22T18:00:00Z' },
  { id: 'ub6', branch_id: 'b6', employee_id: 'u19', report_date: '2026-06-22', pending_pos: 3,  pending_po_value: 195000,  completed_jobs_not_billed: 4,  unbilled_job_value: 340000,  damages_pending: 1, damage_value: 15000,  billed_jobs: 22, total_completed_jobs: 26, resolved_damages: 2,  closed_pos: 9,  remarks: null, created_at: '2026-06-22T18:00:00Z' },
]

// ─── DPR (Daily Performance Reports) ─────────────────────────────────────────
export const DPR_REPORTS: DailyPerformanceReport[] = [
  // Today (2026-06-22)
  { id: 'dpr1',  branch_id: 'b1', submitted_by: 'u20', report_date: '2026-06-22', daily_revenue: 2850000, jobs_completed: 28, jobs_open: 14, jobs_delayed: 3, pending_billing: 1150000, pending_damage_claims: 95000,  customer_followups: 42, challenges: null, created_at: '2026-06-22T18:30:00Z' },
  { id: 'dpr2',  branch_id: 'b2', submitted_by: 'u26', report_date: '2026-06-22', daily_revenue: 1940000, jobs_completed: 21, jobs_open: 9,  jobs_delayed: 2, pending_billing: 640000,  pending_damage_claims: 48000,  customer_followups: 31, challenges: null, created_at: '2026-06-22T18:00:00Z' },
  { id: 'dpr3',  branch_id: 'b3', submitted_by: 'u22', report_date: '2026-06-22', daily_revenue: 1620000, jobs_completed: 18, jobs_open: 11, jobs_delayed: 5, pending_billing: 1820000, pending_damage_claims: 185000, customer_followups: 24, challenges: 'High pending billing and damage claims; need finance team review.', created_at: '2026-06-22T18:00:00Z' },
  { id: 'dpr4',  branch_id: 'b4', submitted_by: 'u25', report_date: '2026-06-22', daily_revenue: 2480000, jobs_completed: 26, jobs_open: 8,  jobs_delayed: 1, pending_billing: 480000,  pending_damage_claims: 22000,  customer_followups: 38, challenges: null, created_at: '2026-06-22T18:00:00Z' },
  { id: 'dpr5',  branch_id: 'b5', submitted_by: 'u17', report_date: '2026-06-22', daily_revenue: 1380000, jobs_completed: 15, jobs_open: 7,  jobs_delayed: 2, pending_billing: 870000,  pending_damage_claims: 72000,  customer_followups: 22, challenges: null, created_at: '2026-06-22T18:00:00Z' },
  { id: 'dpr6',  branch_id: 'b6', submitted_by: 'u19', report_date: '2026-06-22', daily_revenue: 980000,  jobs_completed: 11, jobs_open: 5,  jobs_delayed: 1, pending_billing: 340000,  pending_damage_claims: 15000,  customer_followups: 16, challenges: null, created_at: '2026-06-22T18:00:00Z' },
  // Yesterday (2026-06-21)
  { id: 'dpr7',  branch_id: 'b1', submitted_by: 'u20', report_date: '2026-06-21', daily_revenue: 2640000, jobs_completed: 25, jobs_open: 16, jobs_delayed: 2, pending_billing: 1050000, pending_damage_claims: 80000,  customer_followups: 38, challenges: null, created_at: '2026-06-21T18:30:00Z' },
  { id: 'dpr8',  branch_id: 'b2', submitted_by: 'u26', report_date: '2026-06-21', daily_revenue: 1820000, jobs_completed: 19, jobs_open: 10, jobs_delayed: 3, pending_billing: 580000,  pending_damage_claims: 55000,  customer_followups: 28, challenges: null, created_at: '2026-06-21T18:00:00Z' },
  { id: 'dpr9',  branch_id: 'b3', submitted_by: 'u22', report_date: '2026-06-21', daily_revenue: 1510000, jobs_completed: 16, jobs_open: 12, jobs_delayed: 4, pending_billing: 1620000, pending_damage_claims: 160000, customer_followups: 20, challenges: null, created_at: '2026-06-21T18:00:00Z' },
  { id: 'dpr10', branch_id: 'b4', submitted_by: 'u25', report_date: '2026-06-21', daily_revenue: 2310000, jobs_completed: 24, jobs_open: 9,  jobs_delayed: 2, pending_billing: 520000,  pending_damage_claims: 28000,  customer_followups: 35, challenges: null, created_at: '2026-06-21T18:00:00Z' },
  { id: 'dpr11', branch_id: 'b5', submitted_by: 'u17', report_date: '2026-06-21', daily_revenue: 1290000, jobs_completed: 13, jobs_open: 8,  jobs_delayed: 2, pending_billing: 790000,  pending_damage_claims: 68000,  customer_followups: 19, challenges: null, created_at: '2026-06-21T18:00:00Z' },
  { id: 'dpr12', branch_id: 'b6', submitted_by: 'u19', report_date: '2026-06-21', daily_revenue: 890000,  jobs_completed: 9,  jobs_open: 6,  jobs_delayed: 1, pending_billing: 310000,  pending_damage_claims: 12000,  customer_followups: 14, challenges: null, created_at: '2026-06-21T18:00:00Z' },
]

// Helper lookups for new data
export const branchById     = (id: string) => BRANCHES.find((b) => b.id === id)
export const cscReportsByEmployee = (uid: string) => CSC_REPORTS.filter((r) => r.employee_id === uid)
export const cetReportsByEmployee = (uid: string) => CET_REPORTS.filter((r) => r.employee_id === uid)
export const dprByBranch    = (bid: string) => DPR_REPORTS.filter((r) => r.branch_id === bid)
export const dprToday       = () => DPR_REPORTS.filter((r) => r.report_date === '2026-06-22')
