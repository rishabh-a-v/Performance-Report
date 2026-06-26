import { useState, useEffect, useMemo } from 'react'
import { useProfileStore } from '@/store/profileStore'
import { useReportingStore } from '@/store/reportingStore'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Search, Pencil, X, Check, Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { useRBACFilter } from '@/hooks/useRBACFilter'
import { useUISchema } from '@/hooks/useUISchema'
import { DynamicDataTable } from '@/components/ui/DynamicDataTable'

const ROLE_OPTIONS = ['MD', 'Director', 'EA', 'Manager', 'Executive']

const DB_ROLE_MAP: Record<string, string> = {
  MD: 'managing_director', Director: 'director', EA: 'executive_assistant',
  Manager: 'manager', Executive: 'executive',
}
const DISPLAY_ROLE_MAP: Record<string, string> = {
  managing_director: 'MD', director: 'Director', executive_assistant: 'EA',
  manager: 'Manager', executive: 'Executive',
}

interface EditState {
  name: string
  phone: string
  department: string
  role: string
  branch: string
  reportingTo: string | null
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
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState(false)

  const { visibleCols: empSchema, loading: empSchemaLoading } = useUISchema('profiles')

  useEffect(() => { fetchProfiles(); fetchReportingRecords(); fetchDepartments(); fetchBranches() }, [])

  // Guard — MD, EA, HR, Directors only
  if (!['managing_director', 'executive_assistant', 'hr', 'director'].includes(currentRole ?? '')) {
    return <p className="p-8 text-slate-500">You do not have permission to manage employees.</p>
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
    const r = reportingRecords.find((x) => x.employee_id === id)
    if (!p) return
    setEditingId(id)
    setError(null)
    setSuccess(null)
    setEditState({
      name:        p.full_name  ?? '',
      phone:       p.phone_no   ?? '',
      department:  r?.department ?? '',
      role:        DISPLAY_ROLE_MAP[p.role ?? ''] ?? 'Executive',
      branch:      r?.branch    ?? '',
      reportingTo: r?.reporting_to_id ?? null,
    })
  }

  function cancelEdit() { setEditingId(null); setEditState(null); setError(null) }

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
      const { error: pErr } = await supabase.from('profiles').update({
        full_name: editState.name.trim(),
        phone_no:  editState.phone.trim() || null,
        role:      DB_ROLE_MAP[editState.role] as any,
      }).eq('id', id)
      if (pErr) throw pErr

      // Upsert reporting row
      const { error: rErr } = await supabase.from('reporting').upsert({
        employee_id:      id,
        department:       editState.department,
        role:             editState.role,
        branch:           editState.branch,
        reporting_to_id:  editState.reportingTo || null,
      }, { onConflict: 'employee_id' })
      if (rErr) throw rErr

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Employees</h1>
          <p className="mt-1 text-sm text-slate-500">{profiles.length} employees · click <Pencil size={12} className="inline" /> to edit, <Trash2 size={12} className="inline text-red-400" /> to delete</p>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (() => {
        const emp = profiles.find(p => p.id === confirmDeleteId)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                  <AlertTriangle size={20} className="text-red-500" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900">Delete Employee</h3>
                  <p className="text-xs text-slate-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-slate-700 mb-6">
                Are you sure you want to permanently delete <span className="font-semibold">{emp?.full_name}</span>? Their account, job directions, and tasks will all be removed.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={deleting}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
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
      <div className="flex flex-wrap items-center gap-3">
        {/* Branch filter — only for roles with can_filter_branch */}
        {showBranchFilter && (
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          >
            <option value="all">All Branches</option>
            {availableBranches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        )}

        {/* Department filter — only for roles with can_filter_department */}
        {showDeptFilter && (
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          >
            <option value="all">All Departments</option>
            {availableDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
          <Check size={14} /> {success}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <DynamicDataTable
          schema={empSchema}
          data={filtered as unknown as Record<string, unknown>[]}
          profiles={profiles}
          departments={departments}
          loading={empSchemaLoading}
          emptyMessage="No employees found."
          actions={(row) => {
            const empId = row.id as string
            return (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(empId)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => { setConfirmDeleteId(empId); setError(null) }}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          }}
        />
      </div>

      {/* Edit Employee Modal */}
      {editingId && editState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Edit Employee</h3>
              <button onClick={cancelEdit} className="rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
                <input value={editState.name} onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Phone</label>
                <input value={editState.phone} onChange={(e) => setEditState({ ...editState, phone: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Department</label>
                <select value={editState.department} onChange={(e) => setEditState({ ...editState, department: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300">
                  <option value="">— None —</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Role</label>
                <select value={editState.role} onChange={(e) => setEditState({ ...editState, role: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300">
                  {ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Branch</label>
                <select value={editState.branch} onChange={(e) => setEditState({ ...editState, branch: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300">
                  <option value="">— None —</option>
                  {branches.map((b) => <option key={b.id} value={b.code}>{b.name} ({b.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Reports To</label>
                <select value={editState.reportingTo ?? ''} onChange={(e) => setEditState({ ...editState, reportingTo: e.target.value || null })}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300">
                  <option value="">— None —</option>
                  {profiles.filter((p) => p.id !== editingId).map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
            {error && <p className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={cancelEdit} disabled={saving}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={() => saveEdit(editingId)} disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
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
