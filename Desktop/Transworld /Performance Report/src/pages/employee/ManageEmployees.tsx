import { useState, useEffect, useMemo } from 'react'
import { useProfileStore } from '@/store/profileStore'
import { useReportingStore } from '@/store/reportingStore'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Search, Pencil, X, Check, Loader2, Trash2, AlertTriangle, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useRBACFilter } from '@/hooks/useRBACFilter'

type EmpSortKey = 'name' | 'email' | 'department' | 'role' | 'branch' | 'reporting_to'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={13} className="text-slate-300 ml-1 inline shrink-0" />
  return dir === 'asc'
    ? <ChevronUp size={13} className="text-indigo-500 ml-1 inline shrink-0" />
    : <ChevronDown size={13} className="text-indigo-500 ml-1 inline shrink-0" />
}

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
  const [sortKey,        setSortKey]        = useState<EmpSortKey>('name')
  const [sortDir,        setSortDir]        = useState<SortDir>('asc')
  const [editingId,      setEditingId]      = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState(false)

  useEffect(() => { fetchProfiles(); fetchReportingRecords(); fetchDepartments(); fetchBranches() }, [])

  // Guard — MD, EA, HR, Directors only
  if (!['managing_director', 'executive_assistant', 'hr', 'director'].includes(currentRole ?? '')) {
    return <p className="p-8 text-slate-500">You do not have permission to manage employees.</p>
  }

  function toggleSort(key: EmpSortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    const list = allowedProfiles.filter((p) => {
      if (search && !p.full_name?.toLowerCase().includes(search.toLowerCase()) && !p.email?.toLowerCase().includes(search.toLowerCase())) return false
      if (selectedBranch !== 'all' && p.branch !== selectedBranch) return false
      if (selectedDept !== 'all' && p.department_id !== selectedDept) return false
      return true
    })
    return [...list].sort((a, b) => {
      const rep_a = reportingRecords.find((r) => r.employee_id === a.id)
      const rep_b = reportingRecords.find((r) => r.employee_id === b.id)
      const mgr_a = profiles.find((p) => p.id === rep_a?.reporting_to_id)
      const mgr_b = profiles.find((p) => p.id === rep_b?.reporting_to_id)
      let va = '', vb = ''
      if (sortKey === 'name')         { va = a.full_name ?? ''; vb = b.full_name ?? '' }
      else if (sortKey === 'email')   { va = a.email ?? '';     vb = b.email ?? '' }
      else if (sortKey === 'department') { va = rep_a?.department ?? ''; vb = rep_b?.department ?? '' }
      else if (sortKey === 'role')    { va = DISPLAY_ROLE_MAP[a.role ?? ''] ?? ''; vb = DISPLAY_ROLE_MAP[b.role ?? ''] ?? '' }
      else if (sortKey === 'branch')  { va = rep_a?.branch ?? ''; vb = rep_b?.branch ?? '' }
      else if (sortKey === 'reporting_to') { va = mgr_a?.full_name ?? ''; vb = mgr_b?.full_name ?? '' }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
  }, [allowedProfiles, profiles, reportingRecords, search, selectedBranch, selectedDept, sortKey, sortDir])

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
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Mobile card list */}
        <div className="divide-y divide-slate-100 sm:hidden">
          {filtered.map((emp) => {
            const rep = reportingRecords.find((r) => r.employee_id === emp.id)
            const manager = profiles.find((p) => p.id === rep?.reporting_to_id)
            return (
              <div key={emp.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{emp.full_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{emp.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">{DISPLAY_ROLE_MAP[emp.role ?? ''] ?? emp.role}</span>
                    {emp.branch && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">{emp.branch}</span>}
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
                  {emp.phone_no && <span>{emp.phone_no}</span>}
                  {manager && <span>Reports to {manager.full_name}</span>}
                </div>
              </div>
            )
          })}
        </div>
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {(['name','email'] as EmpSortKey[]).map((key) => {
                const labels: Record<string, string> = { name: 'Name', email: 'Email' }
                return (
                  <th key={key} className="px-5 py-3 text-left">
                    <button onClick={() => toggleSort(key)} className="flex items-center gap-0.5 hover:text-indigo-600 transition-colors">
                      {labels[key]}<SortIcon active={sortKey === key} dir={sortDir} />
                    </button>
                  </th>
                )
              })}
              <th className="px-5 py-3 text-left">Phone</th>
              {(['department','role','branch','reporting_to'] as EmpSortKey[]).map((key) => {
                const labels: Record<string, string> = { department: 'Department', role: 'Role', branch: 'Branch', reporting_to: 'Reporting To' }
                return (
                  <th key={key} className="px-5 py-3 text-left">
                    <button onClick={() => toggleSort(key)} className="flex items-center gap-0.5 hover:text-indigo-600 transition-colors">
                      {labels[key]}<SortIcon active={sortKey === key} dir={sortDir} />
                    </button>
                  </th>
                )
              })}
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((emp) => {
              const rep = reportingRecords.find((r) => r.employee_id === emp.id)
              const manager = profiles.find((p) => p.id === rep?.reporting_to_id)
              const isEditing = editingId === emp.id

              return (
                <tr key={emp.id} className={`transition-colors ${isEditing ? 'bg-indigo-50/60' : 'hover:bg-slate-50'}`}>
                  {isEditing && editState ? (
                    <>
                      {/* Name */}
                      <td className="px-5 py-2">
                        <input value={editState.name} onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                          className="w-full rounded-md border border-indigo-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                      </td>
                      {/* Email (read-only) */}
                      <td className="px-5 py-2 text-slate-400 text-xs">{emp.email}</td>
                      {/* Phone */}
                      <td className="px-5 py-2">
                        <input value={editState.phone} onChange={(e) => setEditState({ ...editState, phone: e.target.value })}
                          className="w-full rounded-md border border-indigo-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                      </td>
                      {/* Department */}
                      <td className="px-5 py-2">
                        <select value={editState.department} onChange={(e) => setEditState({ ...editState, department: e.target.value })}
                          className="w-full rounded-md border border-indigo-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                          <option value="">—</option>
                          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </td>
                      {/* Role */}
                      <td className="px-5 py-2">
                        <select value={editState.role} onChange={(e) => setEditState({ ...editState, role: e.target.value })}
                          className="w-full rounded-md border border-indigo-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                          {ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                        </select>
                      </td>
                      {/* Branch */}
                      <td className="px-5 py-2">
                        <select value={editState.branch} onChange={(e) => setEditState({ ...editState, branch: e.target.value })}
                          className="w-full rounded-md border border-indigo-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                          <option value="">—</option>
                          {branches.map((b) => <option key={b.id} value={b.code}>{b.name} ({b.code})</option>)}
                        </select>
                      </td>
                      {/* Reporting To */}
                      <td className="px-5 py-2">
                        <select value={editState.reportingTo ?? ''} onChange={(e) => setEditState({ ...editState, reportingTo: e.target.value || null })}
                          className="w-full rounded-md border border-indigo-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                          <option value="">— None —</option>
                          {profiles.filter((p) => p.id !== emp.id).map((p) => (
                            <option key={p.id} value={p.id}>{p.full_name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => saveEdit(emp.id)} disabled={saving}
                            className="flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                          </button>
                          <button onClick={cancelEdit}
                            className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                            <X size={12} /> Cancel
                          </button>
                        </div>
                        {error && <p className="mt-1 text-center text-[10px] text-red-600">{error}</p>}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 font-medium text-slate-800">{emp.full_name}</td>
                      <td className="px-5 py-3 text-slate-500">{emp.email}</td>
                      <td className="px-5 py-3 text-slate-500">{emp.phone_no ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-600">{rep?.department ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                          {DISPLAY_ROLE_MAP[emp.role ?? ''] ?? emp.role ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{rep?.branch ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-600">{manager?.full_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => startEdit(emp.id)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => { setConfirmDeleteId(emp.id); setError(null) }}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">No employees found.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
