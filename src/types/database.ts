export type UserRole = 'executive' | 'executive_assistant' | 'hr' | 'manager' | 'director' | 'managing_director'

// ── Metadata-Driven UI ────────────────────────────────────────────────────────

export type CellType =
  | 'string'
  | 'number'
  | 'date'
  | 'boolean'
  | 'status_badge'
  | 'jd_status_badge'
  | 'role_badge'
  | 'profile_ref'
  | 'profile_array'
  | 'dept_ref'
  | 'progress_bar'

export type FormInputType =
  | 'text'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'multi_select_profiles'
  | 'select_profile'
  | 'auto_user'

export interface FormFieldMeta {
  input_type: FormInputType
  required?: boolean
  placeholder?: string
  options?: string[]
  source?: 'branches' | 'departments' | 'profiles' | 'roles'
}

export interface ColumnDef {
  key: string
  label: string
  type: CellType
  sortable: boolean
  visible: boolean
  meta?: Record<string, string>
  form: FormFieldMeta | null
}

export interface UISchema {
  id: string
  table_name: string
  label: string
  columns: ColumnDef[]
  updated_at: string
}

export interface SchemaEnvelope<T = Record<string, unknown>> {
  schema: ColumnDef[]
  data: T[]
}

export interface Branch {
  id: string
  code: string
  name: string
  created_at: string
}

export interface RolePermission {
  id: string
  role: string
  label: string
  can_view_all_branches: boolean
  can_view_all_departments: boolean
  can_filter_branch: boolean
  can_filter_department: boolean
  must_be_in_reporting_chain: boolean
  can_create_job_directions: boolean
  can_create_tasks: boolean
  can_approve_job_directions: boolean
  can_approve_tasks: boolean
  updated_at: string
  updated_by: string | null
}
export type SpecialTaskStatus = 'Yet to start' | 'In progress' | 'Completed' | 'In review'

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
  role: UserRole
  department_id: string | null
  manager_id: string | null
  employee_code: string | null
  phone_no: string | null
  branch: string | null
  // joined
  department?: Department
  manager?: Profile
}

export interface JobDirection {
  id: string
  work_details: string | null
  description: string | null
  daily_target: number
  weekly_target: number
  monthly_target: number
  daily_completed: number
  weekly_completed: number
  monthly_completed: number
  status: string
  remarks: string | null
  employee_id: string
  manager_id: string
  department_id: string | null
  created_at?: string
  updated_at?: string
}

export interface JDHistoryRow {
  id: string
  work_details: string | null
  monthly_target: number
  monthly_achieved: number
  employee_id: string
  employee_name: string
  status: string
}

export interface SpecialTask {
  id: string
  created_at: string
  updated_at?: string
  assigned_by: string
  task_name: string
  due_date: string | null
  status: SpecialTaskStatus
  remarks: string | null
  approval_status?: 'pending' | 'approved' | 'rejected'
  approval_by?: string | null
  approval_at?: string | null
  rejection_note?: string | null
  // joined from task_assignees
  assignees?: Array<{ employee_id: string; assigned_at: string }>
}

export interface Reporting {
  employee_id: string
  department: string
  role: 'MD' | 'Director' | 'EA' | 'Manager' | 'Executive'
  branch: string
  reporting_to_id: string | null
  // joined fields
  employee_name?: string
  reporting_to_name?: string
}

