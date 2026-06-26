import type { Profile, Department, JobDirection, SpecialTask } from '@/types/database'

export const DEPARTMENTS: Department[] = [
  { id: '00000000-0000-0000-0000-000000000101', name: 'Engineering',  head_id: null,  budget: 2000000, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '00000000-0000-0000-0000-000000000102', name: 'Finance',      head_id: '00000000-0000-0000-0000-000000000005',  budget: 800000,  created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '00000000-0000-0000-0000-000000000103', name: 'Sales',        head_id: '00000000-0000-0000-0000-000000000008',  budget: 1200000, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '00000000-0000-0000-0000-000000000104', name: 'Operations',   head_id: '00000000-0000-0000-0000-000000000006',  budget: 600000,  created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '00000000-0000-0000-0000-000000000105', name: 'HR',           head_id: '00000000-0000-0000-0000-000000000007',  budget: 400000,  created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '00000000-0000-0000-0000-000000000106', name: 'CSC',          head_id: '00000000-0000-0000-0000-000000000020', budget: 500000,  created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '00000000-0000-0000-0000-000000000107', name: 'CET',          head_id: '00000000-0000-0000-0000-000000000023', budget: 450000,  created_at: '2024-01-01', updated_at: '2024-01-01' },
]

export const PROFILES: Profile[] = [
  // Top Level
  { id: '00000000-0000-0000-0000-000000000001', email: 'md@transworld.com',          full_name: 'Rajesh Mehta',      role: 'managing_director', department_id: null, manager_id: null,  employee_code: 'EX001', phone_no: '9876543210', branch: 'BOM' },
  // Directors
  { id: '00000000-0000-0000-0000-000000000002', email: 'cfo@transworld.com',         full_name: 'Anil Kumar',        role: 'director',          department_id: '00000000-0000-0000-0000-000000000102', manager_id: '00000000-0000-0000-0000-000000000001',  employee_code: 'DH001', phone_no: '9876543211', branch: 'BOM' },
  { id: '00000000-0000-0000-0000-000000000003', email: 'eng.head@transworld.com',    full_name: 'Priya Nair',        role: 'director',          department_id: '00000000-0000-0000-0000-000000000104', manager_id: '00000000-0000-0000-0000-000000000001',  employee_code: 'DH002', phone_no: '9876543212', branch: 'BLR' },
  // Executive Assistant
  { id: '00000000-0000-0000-0000-000000000004', email: 'fin.head@transworld.com',    full_name: 'Neha Sharma',       role: 'executive_assistant', department_id: null, manager_id: '00000000-0000-0000-0000-000000000001',  employee_code: 'EA001', phone_no: '9876543213', branch: 'BOM' },
  // Managers
  { id: '00000000-0000-0000-0000-000000000005', email: 'sales.head@transworld.com',  full_name: 'Ravi Kumar',        role: 'manager',           department_id: '00000000-0000-0000-0000-000000000102', manager_id: '00000000-0000-0000-0000-000000000002',  employee_code: 'MG001', phone_no: '9876543214', branch: 'BOM' },
  { id: '00000000-0000-0000-0000-000000000006', email: 'ops.head@transworld.com',    full_name: 'Arjun Singh',       role: 'manager',           department_id: '00000000-0000-0000-0000-000000000104', manager_id: '00000000-0000-0000-0000-000000000003',  employee_code: 'MG002', phone_no: '9876543215', branch: 'MAA' },
  { id: '00000000-0000-0000-0000-000000000007', email: 'hr.head@transworld.com',     full_name: 'Sneha Patel',       role: 'hr',                department_id: '00000000-0000-0000-0000-000000000105', manager_id: '00000000-0000-0000-0000-000000000003',  employee_code: 'MG003', phone_no: '9876543216', branch: 'BLR' },
  { id: '00000000-0000-0000-0000-000000000008', email: 'mgr1@transworld.com',        full_name: 'Karan Verma',       role: 'manager',           department_id: '00000000-0000-0000-0000-000000000103', manager_id: '00000000-0000-0000-0000-000000000002',  employee_code: 'MG004', phone_no: '9876543217', branch: 'BOM' },
  // Executives
  { id: '00000000-0000-0000-0000-000000000009', email: 'mgr2@transworld.com',        full_name: 'Amit Gupta',        role: 'executive',         department_id: '00000000-0000-0000-0000-000000000102', manager_id: '00000000-0000-0000-0000-000000000005',  employee_code: 'EM001', phone_no: '9876543218', branch: 'BOM' },
  { id: '00000000-0000-0000-0000-000000000010', email: 'emp1@transworld.com',        full_name: 'Pooja Reddy',       role: 'executive',         department_id: '00000000-0000-0000-0000-000000000102', manager_id: '00000000-0000-0000-0000-000000000005',  employee_code: 'EM002', phone_no: '9876543219', branch: 'BOM' },
  { id: '00000000-0000-0000-0000-000000000011', email: 'emp2@transworld.com',        full_name: 'Rohit Das',         role: 'executive',         department_id: '00000000-0000-0000-0000-000000000104', manager_id: '00000000-0000-0000-0000-000000000006',  employee_code: 'EM003', phone_no: '9876543220', branch: 'MAA' },
  { id: '00000000-0000-0000-0000-000000000012', email: 'emp3@transworld.com',        full_name: 'Meera Iyer',        role: 'executive',         department_id: '00000000-0000-0000-0000-000000000104', manager_id: '00000000-0000-0000-0000-000000000006',  employee_code: 'EM004', phone_no: '9876543221', branch: 'MAA' },
  { id: '00000000-0000-0000-0000-000000000013', email: 'emp4@transworld.com',        full_name: 'Vikram Shah',       role: 'executive',         department_id: '00000000-0000-0000-0000-000000000105', manager_id: '00000000-0000-0000-0000-000000000007',  employee_code: 'EM005', phone_no: '9876543222', branch: 'BLR' },
  { id: '00000000-0000-0000-0000-000000000014', email: 'demo@transworld.com',        full_name: 'Ananya Rao',        role: 'executive',         department_id: '00000000-0000-0000-0000-000000000103', manager_id: '00000000-0000-0000-0000-000000000008',  employee_code: 'EM006', phone_no: '9876543223', branch: 'BOM' },
  { id: '00000000-0000-0000-0000-000000000015', email: 'sales2@transworld.com',      full_name: 'Meena Kapoor',      role: 'executive',         department_id: '00000000-0000-0000-0000-000000000103', manager_id: '00000000-0000-0000-0000-000000000008',  employee_code: 'EM007', phone_no: '9876543224', branch: 'BOM' },
  { id: '00000000-0000-0000-0000-000000000016', email: 'ops.mgr@transworld.com',     full_name: 'Suresh Pillai',     role: 'manager',           department_id: '00000000-0000-0000-0000-000000000104', manager_id: '00000000-0000-0000-0000-000000000006',  employee_code: 'MG005', phone_no: '9876543225', branch: 'MAA' },
  { id: '00000000-0000-0000-0000-000000000017', email: 'ops2@transworld.com',        full_name: 'Devika Nair',       role: 'executive',         department_id: '00000000-0000-0000-0000-000000000104', manager_id: '00000000-0000-0000-0000-000000000016', employee_code: 'EM008', phone_no: '9876543226', branch: 'MAA' },
  { id: '00000000-0000-0000-0000-000000000018', email: 'hr2@transworld.com',         full_name: 'Kavya Reddy',       role: 'executive',         department_id: '00000000-0000-0000-0000-000000000105', manager_id: '00000000-0000-0000-0000-000000000007',  employee_code: 'EM009', phone_no: '9876543227', branch: 'BLR' },
  { id: '00000000-0000-0000-0000-000000000019', email: 'fin2@transworld.com',        full_name: 'Ankit Sharma',      role: 'executive',         department_id: '00000000-0000-0000-0000-000000000102', manager_id: '00000000-0000-0000-0000-000000000005',  employee_code: 'EM010', phone_no: '9876543228', branch: 'BOM' },
  // CSC Team
  { id: '00000000-0000-0000-0000-000000000020', email: 'csc.head@transworld.com',    full_name: 'Payal Gupta',       role: 'manager',           department_id: '00000000-0000-0000-0000-000000000106', manager_id: '00000000-0000-0000-0000-000000000006',  employee_code: 'MG006', phone_no: '9876543229', branch: 'MAA' },
  { id: '00000000-0000-0000-0000-000000000021', email: 'csc1@transworld.com',        full_name: 'Sunil Rao',         role: 'executive',         department_id: '00000000-0000-0000-0000-000000000106', manager_id: '00000000-0000-0000-0000-000000000020', employee_code: 'CS001', phone_no: '9876543230', branch: 'MAA' },
  { id: '00000000-0000-0000-0000-000000000022', email: 'csc2@transworld.com',        full_name: 'Priya Jain',        role: 'executive',         department_id: '00000000-0000-0000-0000-000000000106', manager_id: '00000000-0000-0000-0000-000000000020', employee_code: 'CS002', phone_no: '9876543231', branch: 'MAA' },
  { id: '00000000-0000-0000-0000-000000000026', email: 'csc3@transworld.com',        full_name: 'Suman Das',         role: 'executive',         department_id: '00000000-0000-0000-0000-000000000106', manager_id: '00000000-0000-0000-0000-000000000020', employee_code: 'CS003', phone_no: '9876543232', branch: 'MAA' },
  // CET Team
  { id: '00000000-0000-0000-0000-000000000023', email: 'cet.head@transworld.com',    full_name: 'Arjun Patel',       role: 'manager',           department_id: '00000000-0000-0000-0000-000000000107', manager_id: '00000000-0000-0000-0000-000000000001',  employee_code: 'MG007', phone_no: '9876543233', branch: 'BOM' },
  { id: '00000000-0000-0000-0000-000000000024', email: 'cet1@transworld.com',        full_name: 'Deepak Singh',      role: 'executive',         department_id: '00000000-0000-0000-0000-000000000107', manager_id: '00000000-0000-0000-0000-000000000023', employee_code: 'CT001', phone_no: '9876543234', branch: 'BOM' },
  { id: '00000000-0000-0000-0000-000000000025', email: 'cet2@transworld.com',        full_name: 'Neha Verma',        role: 'executive',         department_id: '00000000-0000-0000-0000-000000000107', manager_id: '00000000-0000-0000-0000-000000000023', employee_code: 'CT002', phone_no: '9876543235', branch: 'BOM' },
]

export const JOB_DIRECTIONS: JobDirection[] = [
  {
    id: 'jd1',
    work_details: 'Process and reconcile a minimum of 1,500 invoices per month across all vendor accounts.',
    daily_target: 50,
    weekly_target: 250,
    monthly_target: 1500,
    daily_completed: 30,
    weekly_completed: 210,
    monthly_completed: 900,
    status: 'active',
    description: null,
    remarks: 'Reconciliation is on track.',
    employee_id: '00000000-0000-0000-0000-000000000013',
    manager_id: '00000000-0000-0000-0000-000000000004',
    department_id: '00000000-0000-0000-0000-000000000102'
  },
  {
    id: 'jd2',
    work_details: 'Increase the accounts receivable collection rate to 97% by end of Q3.',
    daily_target: 3,
    weekly_target: 15,
    monthly_target: 97,
    daily_completed: 2,
    weekly_completed: 11,
    monthly_completed: 89,
    status: 'active',
    description: null,
    remarks: 'Following up with top enterprise accounts.',
    employee_id: '00000000-0000-0000-0000-000000000013',
    manager_id: '00000000-0000-0000-0000-000000000004',
    department_id: '00000000-0000-0000-0000-000000000102'
  },
  {
    id: 'jd3',
    work_details: 'Generate 500 qualified leads through LinkedIn outreach and email campaigns by end of Q2.',
    daily_target: 25,
    weekly_target: 125,
    monthly_target: 500,
    daily_completed: 12,
    weekly_completed: 80,
    monthly_completed: 312,
    status: 'active',
    description: null,
    remarks: 'Outreach volume increased.',
    employee_id: '00000000-0000-0000-0000-000000000015',
    manager_id: '00000000-0000-0000-0000-000000000008',
    department_id: '00000000-0000-0000-0000-000000000103'
  }
]

export const SPECIAL_TASKS: SpecialTask[] = [
  {
    id: 'st1',
    task_name: 'Prepare weekly engineering status report',
    remarks: 'Summarize updates from lead developers.',
    assigned_by: '00000000-0000-0000-0000-000000000008',
    due_date: '2026-06-23',
    status: 'Yet to start',
    created_at: '2026-06-22T09:00:00Z',
    assignees: [{ employee_id: '00000000-0000-0000-0000-000000000014', assigned_at: '2026-06-22T09:00:00Z' }]
  },
  {
    id: 'st2',
    task_name: 'Review security audit findings',
    remarks: 'Go through the penetration test report and flag critical items.',
    assigned_by: '00000000-0000-0000-0000-000000000008',
    due_date: '2026-06-24',
    status: 'In progress',
    created_at: '2026-06-21T09:00:00Z',
    assignees: [{ employee_id: '00000000-0000-0000-0000-000000000010', assigned_at: '2026-06-21T09:00:00Z' }]
  },
  {
    id: 'st3',
    task_name: 'Fix login page CSS on mobile',
    remarks: 'Ensure responsive viewport styles are correct.',
    assigned_by: '00000000-0000-0000-0000-000000000008',
    due_date: '2026-06-25',
    status: 'Yet to start',
    created_at: '2026-06-22T09:00:00Z',
    assignees: [{ employee_id: '00000000-0000-0000-0000-000000000011', assigned_at: '2026-06-22T09:00:00Z' }]
  },
  {
    id: 'st4',
    task_name: 'Attend sprint retrospective',
    remarks: 'Focus on action items from Q2 development blockers.',
    assigned_by: '00000000-0000-0000-0000-000000000008',
    due_date: '2026-06-23',
    status: 'Completed',
    created_at: '2026-06-20T09:00:00Z',
    assignees: [{ employee_id: '00000000-0000-0000-0000-000000000014', assigned_at: '2026-06-20T09:00:00Z' }]
  }
]
