import { useState, useEffect, useMemo } from 'react'
import { useProfileStore } from '@/store/profileStore'
import { useReportingStore } from '@/store/reportingStore'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Pencil, X, Check, Loader2, Trash2, AlertTriangle, UserPlus, Mail, Phone, ChevronRight } from 'lucide-react'
import { useRBACFilter } from '@/hooks/useRBACFilter'
import { useUISchema } from '@/hooks/useUISchema'
import { DynamicDataTable } from '@/components/ui/DynamicDataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { FilterBar } from '@/components/shared/FilterBar'
import { Button } from '@/components/ui/Button'
import { NativeSelect } from '@/components/ui/Select'
import { AddEmployeeDialog } from './AddEmployeeDialog'
import { EmployeeDetailPanel } from './EmployeeDetailPanel'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import type { Profile, UserRole } from '@/types/database'

const ROLE_OPTIONS = ['MD', 'Director', 'EA', 'HR', 'Manager', 'Executive']

const DB_ROLE_MAP: Record<string, string> = {
  MD: 'managing_director', Director: 'director', EA: 'executive_assistant',
  HR: 'hr', Manager: 'manager', Executive: 'executive',
}
const DISPLAY_ROLE_MAP: Record<string, string> = {
  managing_director: 'MD', director: 'Director', executive_assistant: 'EA',
  hr: 'HR', manager: 'Manager', executive: 'Executive',
}

const ROLE_COLORS: Record<string, string> = {
  managing_director:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200',
  executive_assistant: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200',
  hr:                  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200',
  director:            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200',
  manager:             'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200',
  executive:           'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200',
}

interface EditState {
  name: string
  phone: string
  department: string
  role: string
  branch: string
  reportingToIds: string[]
}

export function ManageEmployees() {
  const { role: currentRole } = useAuth()
  const { profiles, departments, branches, fetchProfiles, fetchDepartments, fetchBranches } = useProfileStore()
  const { reportingRecords, fetchReportingRecords } = useReportingStore()
  const { allowedProfiles, availableBranches, availableDepartments, showBranchFilter, showDeptFilter } = useRBACFilter()

  const [search,         setSearch]         = useState('')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedDept,   setSelectedDept]   = useState('all')
  const [editingId,      setEditingId]      = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [reportsToSearch, setReportsToSearch] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState(false)
  const [showAdd,   setShowAdd]   = useState(false)
  const [viewingEmployee, setViewingEmployee] = useState<Profile | null>(null)

  const { visibleCols: empSchema, loading: empSchemaLoading } = useUISchema('profiles')

  useEffect(() => { fetchProfiles(); fetchReportingRecords(); fetchDepartments(); fetchBranches() }, [])

  // Managers get a read-only view of their own reporting chain (via
  // useRBACFilter's allowedProfiles); edit/delete stays admin-only.
  const canMutate = ['managing_director', 'executive_assistant', 'hr', 'director'].includes(currentRole ?? '')
  // Creating new accounts is narrower than edit/delete — MD, HR, and EA only.
  const canAddEmployee = ['managing_director', 'executive_assistant', 'hr'].includes(currentRole ?? '')

  // Guard — anyone with people to supervise (manager and above)
  if (!canMutate && currentRole !== 'manager') {
    return <p className="p-8 text-muted-foreground">You do not have permission to view employees.</p>
  }

  const filtered = useMemo(() => {
    return allowedProfiles.filter((p) => {
      if (search && !p.full_name?.toLowerCase().includes(search.toLowerCase()) && !p.email?.toLowerCase().includes(search.toLowerCase())) return false
      if (selectedBranch !== 'all' && p.branch !== selectedBranch) return false
      if (selectedDept !== 'all' && p.department_id !== selectedDept) return false
      return true
    })
  }, [allowedProfiles, search, selectedBranch, selectedDept])

  function startEdit(id: string) {
    const p = profiles.find((x) => x.id === id)
    const r = reportingRecords.filter((x) => x.employee_id === id)
    if (!p) return
    setEditingId(id)
    setError(null)
    setSuccess(null)
    setEditState({
      name:        p.full_name  ?? '',
      phone:       p.phone_no   ?? '',
      department:  reportingRecords.find((x) => x.employee_id === id)?.department || p.department_id || '',
      role:        DISPLAY_ROLE_MAP[p.role ?? ''] ?? 'Executive',
      branch:      reportingRecords.find((x) => x.employee_id === id)?.branch    || p.branch || '',
      reportingToIds: r.map((x) => x.reporting_to_id).filter(Boolean) as string[],
    })
  }

  function cancelEdit() { setEditingId(null); setEditState(null); setError(null); setReportsToSearch('') }

  async function saveEdit(id: string) {
    if (!editState) return
    setSaving(true); setError(null); setSuccess(null)

    try {
      // Check for duplicate phone (exclude current employee)
      if (editState.phone.trim()) {
        const { data: phoneMatch } = await supabase
          .from('profiles').select('id').eq('phone_no', editState.phone.trim()).neq('id', id).maybeSingle()
        if (phoneMatch) { setError('Another employee already has this mobile number.'); setSaving(false); return }
      }

      // Update profiles row
      const primaryManagerId = editState.reportingToIds[0] || null
      const { error: pErr } = await supabase.from('profiles').update({
        full_name:  editState.name.trim(),
        phone_no:   editState.phone.trim() || null,
        role:       DB_ROLE_MAP[editState.role] as UserRole,
        branch:     editState.branch || null,
        manager_id: primaryManagerId,
      }).eq('id', id)
      if (pErr) throw pErr

      // Delete existing reporting rows for this employee
      const { error: delErr } = await supabase.from('reporting').delete().eq('employee_id', id)
      if (delErr) throw delErr

      // Insert new reporting rows
      if (editState.reportingToIds.length > 0) {
        const rowsToInsert = editState.reportingToIds.map((managerId) => ({
          employee_id:      id,
          department:       editState.department,
          role:             editState.role,
          branch:           editState.branch,
          reporting_to_id:  managerId,
        }))
        const { error: insErr } = await supabase.from('reporting').insert(rowsToInsert)
        if (insErr) throw insErr
      } else {
        const { error: insErr } = await supabase.from('reporting').insert({
          employee_id:      id,
          department:       editState.department,
          role:             editState.role,
          branch:           editState.branch,
          reporting_to_id:  null,
        })
        if (insErr) throw insErr
      }

      setSuccess('Employee updated successfully.')
      fetchProfiles(); fetchReportingRecords()
      setEditingId(null); setEditState(null)
    } catch (e: any) {
      setError(e.message ?? 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true); setError(null)
    try {
      const { error: rpcErr } = await supabase.rpc('delete_employee', { p_employee_id: id })
      if (rpcErr) throw rpcErr
      setSuccess('Employee deleted successfully.')
      setConfirmDeleteId(null)
      fetchProfiles(); fetchReportingRecords()
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete employee.')
      setConfirmDeleteId(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Employees"
        description={canMutate
          ? `${profiles.length} employees in the organisation`
          : `${allowedProfiles.length} employees in your team`}
        actions={canAddEmployee ? (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <UserPlus size={14} /> Add Employee
          </Button>
        ) : undefined}
      />

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (() => {
        const emp = profiles.find(p => p.id === confirmDeleteId)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                  <AlertTriangle size={20} className="text-red-500" />
                </span>
                <div>
                  <h3 className="font-bold text-foreground">Delete Employee</h3>
                  <p className="text-xs text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-foreground mb-6">
                Are you sure you want to permanently delete <span className="font-semibold">{emp?.full_name}</span>? Their account, job directions, and tasks will all be removed.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={deleting}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={deleting}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Filters row */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email…"
        summary={`${filtered.length} of ${allowedProfiles.length} employees`}
        filters={
          (showBranchFilter || showDeptFilter) ? (
            <>
              {showBranchFilter && (
                <NativeSelect
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="rounded-lg border border-border bg-card py-2 pl-3 pr-8 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                >
                  <option value="all">All Branches</option>
                  {availableBranches.map((b) => <option key={b} value={b}>{b}</option>)}
                </NativeSelect>
              )}
              {showDeptFilter && (
                <NativeSelect
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="rounded-lg border border-border bg-card py-2 pl-3 pr-8 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                >
                  <option value="all">All Departments</option>
                  {availableDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </NativeSelect>
              )}
            </>
          ) : undefined
        }
      />

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700">
          <Check size={14} /> {success}
        </div>
      )}

      {/* Table */}
      <div className="hidden sm:block rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <DynamicDataTable
          schema={empSchema}
          data={filtered as unknown as Record<string, unknown>[]}
          profiles={profiles}
          departments={departments}
          loading={empSchemaLoading}
          emptyMessage="No employees found."
          onRowClick={(row) => {
            const emp = profiles.find((p) => p.id === (row.id as string))
            if (emp) setViewingEmployee(emp)
          }}
          actions={canMutate ? (row) => {
            const empId = row.id as string
            return (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(empId)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => { setConfirmDeleteId(empId); setError(null) }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          } : undefined}
        />
      </div>

      {/* Redesigned Mobile View */}
      <div className="sm:hidden space-y-4">
        {empSchemaLoading ? (
          <div className="py-12 text-center text-sm text-slate-400 animate-pulse">Loading employees…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
            No employees found.
          </div>
        ) : (
          filtered.map((emp) => {
            const dept = departments.find((d) => d.id === emp.department_id)
            const manager = profiles.find((p) => p.id === emp.manager_id)
            return (
              <div
                key={emp.id}
                onClick={() => setViewingEmployee(emp)}
                className="group relative rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                {/* Top Section: Avatar + Name + Role */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.full_name} size="md" className="shadow-sm" />
                    <div>
                      <h4 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                        {emp.full_name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Code: {emp.employee_code ?? '—'}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    ROLE_COLORS[emp.role] ?? 'bg-slate-100 text-slate-500'
                  )}>
                    {DISPLAY_ROLE_MAP[emp.role] ?? emp.role}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-50 pt-3 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Department</span>
                    <span className="font-medium text-slate-700 mt-0.5 truncate block">{dept?.name ?? '—'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Branch</span>
                    <span className="font-medium text-slate-700 mt-0.5 truncate block">{emp.branch ?? '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Reporting To</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {manager ? (
                        <>
                          <Avatar name={manager.full_name} size="xs" />
                          <span className="font-medium text-slate-700 truncate">{manager.full_name}</span>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons (Call, Email, Edit, Delete) */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3" onClick={(e) => e.stopPropagation()}>
                  {/* Left: Contact Info */}
                  <div className="flex gap-2">
                    {emp.phone_no && (
                      <a
                        href={`tel:${emp.phone_no}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-95 transition-all"
                        title="Call Employee"
                      >
                        <Phone size={14} />
                      </a>
                    )}
                    {emp.email && (
                      <a
                        href={`mailto:${emp.email}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95 transition-all"
                        title="Email Employee"
                      >
                        <Mail size={14} />
                      </a>
                    )}
                  </div>

                  {/* Right: Mutation Actions */}
                  {canMutate && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => startEdit(emp.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>
                      <button
                        onClick={() => { setConfirmDeleteId(emp.id); setError(null) }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 bg-red-50 hover:bg-red-100 active:scale-95 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Arrow indicator for detail view */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={18} className="text-muted-foreground" />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Employee dialog (replaces the old /add-employee page) */}
      <AddEmployeeDialog open={showAdd} onClose={() => setShowAdd(false)} />

      {/* Employee detail: profile + job directions + tasks */}
      {viewingEmployee && (
        <EmployeeDetailPanel
          employee={profiles.find((p) => p.id === viewingEmployee.id) ?? viewingEmployee}
          onClose={() => setViewingEmployee(null)}
        />
      )}

      {/* Edit Employee Modal */}
      {editingId && editState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-card border border-border overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Edit Employee</h3>
              <button onClick={cancelEdit} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Full Name</label>
                <input value={editState.name} onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border bg-card py-2 px-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Phone</label>
                <input value={editState.phone} onChange={(e) => setEditState({ ...editState, phone: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border bg-card py-2 px-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Department</label>
                <NativeSelect value={editState.department} onChange={(e) => setEditState({ ...editState, department: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border bg-card py-2 px-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/40">
                  <option value="">— None —</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </NativeSelect>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Role</label>
                <NativeSelect value={editState.role} onChange={(e) => setEditState({ ...editState, role: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border bg-card py-2 px-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/40">
                  {ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                </NativeSelect>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Branch</label>
                <NativeSelect value={editState.branch} onChange={(e) => setEditState({ ...editState, branch: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border bg-card py-2 px-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/40">
                  <option value="">— None —</option>
                  {branches.map((b) => <option key={b.id} value={b.code}>{b.name} ({b.code})</option>)}
                </NativeSelect>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reports To (Multiple allowed)</label>
                <input
                  value={reportsToSearch}
                  onChange={(e) => setReportsToSearch(e.target.value)}
                  placeholder="Search employees..."
                  className="mt-1.5 mb-1.5 block w-full rounded-lg border border-border bg-card py-2 px-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
                <div className="rounded-lg border border-border bg-card p-3 max-h-40 overflow-y-auto space-y-2">
                  {profiles
                    .filter((p) => p.id !== editingId)
                    .filter((p) => !reportsToSearch.trim() || p.full_name.toLowerCase().includes(reportsToSearch.trim().toLowerCase()))
                    .map((p) => {
                      const isChecked = editState.reportingToIds.includes(p.id)
                      return (
                        <label key={p.id} className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const newIds = isChecked
                                ? editState.reportingToIds.filter((id) => id !== p.id)
                                : [...editState.reportingToIds, p.id]
                              setEditState({ ...editState, reportingToIds: newIds })
                            }}
                            className="rounded border-border text-primary focus:ring-primary/30"
                          />
                          <span>{p.full_name}</span>
                        </label>
                      )
                    })}
                </div>
              </div>
            </div>
            {error && <p className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={cancelEdit} disabled={saving}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50">
                Cancel
              </button>
              <button onClick={() => saveEdit(editingId)} disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
