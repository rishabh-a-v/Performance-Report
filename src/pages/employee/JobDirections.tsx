import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import {
  Trash2, Plus, X, ClipboardList, Users, Search, ChevronUp, ChevronDown, ChevronsUpDown, History,
} from 'lucide-react'
import { useRBACFilter } from '@/hooks/useRBACFilter'
import { useUISchema } from '@/hooks/useUISchema'
import { DynamicDataTable } from '@/components/ui/DynamicDataTable'

type SortDir = 'asc' | 'desc'
type JDMySortKey = 'work_details' | 'status' | 'daily' | 'weekly' | 'monthly'
type JDTeamSortKey = 'work_details' | 'assigned_to' | 'manager' | 'status' | 'daily' | 'weekly' | 'monthly'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={12} className="text-slate-300 ml-1 inline shrink-0" />
  return dir === 'asc'
    ? <ChevronUp size={12} className="text-blue-500 ml-1 inline shrink-0" />
    : <ChevronDown size={12} className="text-blue-500 ml-1 inline shrink-0" />
}
import type { JobDirection, JDHistoryRow } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/Dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/Select'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { Avatar } from '@/components/ui/Avatar'
import { useProfileStore } from '@/store/profileStore'
import { usePermissionStore } from '@/store/permissionStore'

const ROLE_ORDER: Record<string, number> = {
  executive: 0,
  manager: 1,
  director: 2,
  executive_assistant: 3,
  hr: 3,
  managing_director: 3,
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active:              'bg-blue-100 text-blue-700',
  submitted:           'bg-amber-100 text-amber-700',
  approved:            'bg-emerald-100 text-emerald-700',
  rejected:            'bg-red-100 text-red-700',
  completed:           'bg-slate-100 text-slate-600',
  deletion_requested:  'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  active:              'Active',
  submitted:           'Under Review',
  approved:            'Approved',
  rejected:            'Changes Needed',
  completed:           'Completed',
  deletion_requested:  'Deletion Pending',
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-4">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────

function ProgressBar({ completed, target, status }: { completed: number; target: number; status: string }) {
  const pct = target > 0 ? (completed / target) * 100 : 0
  const color = {
    active:    'bg-blue-500',
    submitted: 'bg-amber-500',
    approved:  'bg-emerald-500',
    rejected:  'bg-red-400',
    completed: 'bg-slate-400',
  }[status] || 'bg-slate-400'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums text-slate-600 w-10 text-right shrink-0">
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

function PeriodProgress({ completed, target, status, label }: { completed: number; target: number; status: string; label: string }) {
  if (!target || target <= 0) return <span className="text-xs text-slate-400">—</span>

  return (
    <div className="space-y-1 min-w-[120px]">
      <ProgressBar completed={completed} target={target} status={status} />
      <p className="text-[10px] text-slate-400 tabular-nums font-medium">
        {label}: {completed} / {target}
      </p>
    </div>
  )
}

// ─── My Direction Row ──────────────────────────────────────────────────────────

function DirectionRow({
  jd, onClick,
}: { jd: JobDirection; onClick?: () => void }) {
  const { requestDeletion } = useJobDirectionStore()
  const [confirmRequest, setConfirmRequest] = useState(false)

  const isDeletionPending = jd.status === 'deletion_requested'

  return (
    <tr
      onClick={onClick}
      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
    >
      {/* Work Details */}
      <td className="py-4 px-5 max-w-[220px]">
        <p className={cn('text-sm font-medium leading-snug truncate', jd.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800')}>
          {jd.work_details || '—'}
        </p>
        {jd.description && (
          <p className="text-xs text-slate-400 truncate mt-0.5">{jd.description}</p>
        )}
      </td>

      {/* Daily Progress */}
      <td className="py-4 px-5">
        <PeriodProgress completed={jd.daily_completed} target={jd.daily_target} status={jd.status} label="Daily" />
      </td>

      {/* Weekly Progress */}
      <td className="py-4 px-5">
        <PeriodProgress completed={jd.weekly_completed} target={jd.weekly_target} status={jd.status} label="Weekly" />
      </td>

      {/* Monthly Progress */}
      <td className="py-4 px-5">
        <PeriodProgress completed={jd.monthly_completed} target={jd.monthly_target} status={jd.status} label="Monthly" />
      </td>

      {/* Status */}
      <td className="py-4 px-5 whitespace-nowrap">
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_COLORS[jd.status])}>
          {STATUS_LABELS[jd.status] || jd.status}
        </span>
      </td>

      {/* Actions */}
      <td className="py-4 px-5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
        {jd.status === 'active' && (
          isDeletionPending ? (
            <span className="text-xs text-red-500 italic">Awaiting approval…</span>
          ) : confirmRequest ? (
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-red-600 font-medium">Request deletion?</span>
              <button
                onClick={(e) => { e.stopPropagation(); requestDeletion(jd.id); setConfirmRequest(false) }}
                className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmRequest(false) }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmRequest(true) }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
            >
              <Trash2 size={12} />
              Delete
            </button>
          )
        )}
      </td>
    </tr>
  )
}

// ─── Team Direction Row ────────────────────────────────────────────────────────

function TeamDirectionRow({ jd, onClick }: { jd: JobDirection; onClick?: () => void }) {
  const { user, role } = useAuth()
  const { deleteDirection } = useJobDirectionStore()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const profiles = useProfileStore((s) => s.profiles)
  const employee = profiles.find((p) => p.id === jd.employee_id)
  const manager  = profiles.find((p) => p.id === jd.manager_id)

  const isManager = jd.manager_id === user?.id
  const isAdmin = ['managing_director', 'executive_assistant', 'hr', 'director'].includes(role ?? '')
  const canDelete = isManager || isAdmin

  return (
    <tr
      onClick={onClick}
      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
    >
      <td className="py-4 px-5 max-w-[220px]">
        <p className={cn('text-sm font-medium leading-snug truncate', jd.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800')}>
          {jd.work_details || '—'}
        </p>
        {jd.description && (
          <p className="text-xs text-slate-400 truncate mt-0.5">{jd.description}</p>
        )}
      </td>
      <td className="py-4 px-5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Avatar name={employee?.full_name ?? '?'} size="xs" />
          <div>
            <p className="text-sm text-slate-700 font-medium leading-tight">{employee?.full_name ?? '—'}</p>
            <p className="text-xs text-slate-400 capitalize">{employee?.role?.replace('_', ' ') ?? ''}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Avatar name={manager?.full_name ?? '?'} size="xs" />
          <span className="text-sm text-slate-600">{manager?.full_name ?? '—'}</span>
        </div>
      </td>
      <td className="py-4 px-5">
        <PeriodProgress completed={jd.daily_completed} target={jd.daily_target} status={jd.status} label="Daily" />
      </td>
      <td className="py-4 px-5">
        <PeriodProgress completed={jd.weekly_completed} target={jd.weekly_target} status={jd.status} label="Weekly" />
      </td>
      <td className="py-4 px-5">
        <PeriodProgress completed={jd.monthly_completed} target={jd.monthly_target} status={jd.status} label="Monthly" />
      </td>
      <td className="py-4 px-5 whitespace-nowrap">
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_COLORS[jd.status])}>
          {STATUS_LABELS[jd.status] || jd.status}
        </span>
      </td>
      <td className="py-4 px-5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
        {canDelete && (
          confirmDelete ? (
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-red-600 font-medium">Delete?</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteDirection(jd.id); setConfirmDelete(false) }}
                className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
            >
              <Trash2 size={12} />
              Delete
            </button>
          )
        )}
      </td>
    </tr>
  )
}

// ─── Add Direction Modal ───────────────────────────────────────────────────────

const EMPTY_FORM = {
  work_details: '',
  description: '',
  daily_target: '',
  weekly_target: '',
  monthly_target: '',
  has_targets: true,
}

interface AddDirectionModalProps {
  open: boolean
  onClose: () => void
  defaultAssigneeId?: string
}

export function AddDirectionModal({ open, onClose, defaultAssigneeId }: AddDirectionModalProps) {
  const { user } = useAuth()
  const { addDirection } = useJobDirectionStore()
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  const profiles = useProfileStore((s) => s.profiles)
  const assigneeOptions = (() => {
    if (!user) return []
    if (user.role === 'managing_director' || user.role === 'executive_assistant') {
      return profiles
    }
    if (user.role === 'director') {
      const deptMembers = profiles.filter((p) => p.department_id === user.department_id)
      return [user, ...deptMembers.filter((p) => p.id !== user.id)]
    }
    const directReports = profiles.filter((p) => p.manager_id === user.id)
    return [user, ...directReports.filter((p) => p.id !== user.id)]
  })()
  const showAssigneePicker = assigneeOptions.length > 1

  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId ?? user?.id ?? '')
  const [assigneeOpen, setAssigneeOpen] = useState(false)
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const assigneeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setAssigneeId(defaultAssigneeId ?? user?.id ?? '')
    setAssigneeSearch('')
    setAssigneeOpen(false)
  }, [defaultAssigneeId, user?.id, open])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setAssigneeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredAssignees = assigneeSearch.trim()
    ? assigneeOptions.filter((p) => p.full_name.toLowerCase().includes(assigneeSearch.toLowerCase()))
    : assigneeOptions

  const selectedProfile = assigneeOptions.find((p) => p.id === assigneeId)

  function setField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setError('')
  }

  function handleSubmit() {
    if (!form.work_details.trim()) { setError('Work Details are required.'); return }
    const dailyTarget   = form.has_targets ? (parseFloat(form.daily_target)   || 0) : 0
    const weeklyTarget  = form.has_targets ? (parseFloat(form.weekly_target)  || 0) : 0
    const monthlyTarget = form.has_targets ? (parseFloat(form.monthly_target) || 0) : 0

    if (form.has_targets && dailyTarget <= 0 && weeklyTarget <= 0 && monthlyTarget <= 0) {
      setError('Enter at least one target, or turn off targets.')
      return
    }

    const finalAssigneeId = assigneeId || (user?.id ?? '')
    const assignee = profiles.find((p) => p.id === finalAssigneeId)

    const creatorRoleVal = ROLE_ORDER[user?.role ?? ''] ?? 0
    const assigneeRoleVal = ROLE_ORDER[assignee?.role ?? ''] ?? 0
    const isSeniorRole = creatorRoleVal >= ROLE_ORDER['executive_assistant']
    const isTopDown = finalAssigneeId !== user?.id && creatorRoleVal > assigneeRoleVal

    const initialStatus = (isSeniorRole || isTopDown) ? 'active' : 'submitted'

    addDirection({
      work_details:     form.work_details.trim(),
      description:      form.description.trim() || null,
      daily_target:     dailyTarget,
      weekly_target:    weeklyTarget,
      monthly_target:   monthlyTarget,
      employee_id:      finalAssigneeId,
      manager_id:       finalAssigneeId === user?.id ? (user?.manager_id || user?.id || '') : (user?.id ?? ''),
      department_id:    assignee?.department_id ?? user?.department_id ?? null,
      remarks:          null,
      status:           initialStatus,
    })

    setForm(EMPTY_FORM)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Job Direction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {showAssigneePicker && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-foreground/70">Assign To</label>
              <div ref={assigneeRef} className="relative">
                <button
                  type="button"
                  onClick={() => { setAssigneeOpen((v) => !v); setAssigneeSearch('') }}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <span className="truncate">
                    {selectedProfile
                      ? `${selectedProfile.full_name}${selectedProfile.id === user?.id ? ' (You)' : ''} — ${selectedProfile.role}`
                      : 'Select employee'}
                  </span>
                  <ChevronDown size={15} className="ml-2 shrink-0 opacity-50" />
                </button>
                {assigneeOpen && (
                  <div className="absolute z-[200] mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                        <Search size={13} className="shrink-0 text-slate-400" />
                        <input
                          autoFocus
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          placeholder="Search employees..."
                          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                        />
                        {assigneeSearch && (
                          <button type="button" onClick={() => setAssigneeSearch('')}>
                            <X size={12} className="text-slate-400 hover:text-slate-600" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredAssignees.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-slate-400 text-center">No employees found.</p>
                      ) : filteredAssignees.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setAssigneeId(p.id); setAssigneeOpen(false); setAssigneeSearch('') }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors',
                            p.id === assigneeId && 'bg-blue-50 text-blue-700 font-medium'
                          )}
                        >
                          {p.full_name}{p.id === user?.id ? ' (You)' : ''} — {p.role}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <Textarea
            id="jd-desc"
            label="Work Details *"
            placeholder="Describe the ongoing work details..."
            rows={3}
            value={form.work_details}
            onChange={(e) => setField('work_details', e.target.value)}
            error={error && form.work_details.trim() === '' ? error : undefined}
          />

          <Textarea
            id="jd-description"
            label="Description"
            placeholder="Add more context or details (optional)..."
            rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Targets</h4>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs text-slate-500">Set targets</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.has_targets}
                  onClick={() => setForm((f) => ({ ...f, has_targets: !f.has_targets }))}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
                    form.has_targets ? 'bg-blue-600' : 'bg-slate-200'
                  )}
                >
                  <span className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200',
                    form.has_targets ? 'translate-x-4' : 'translate-x-0'
                  )} />
                </button>
              </label>
            </div>
            {form.has_targets && (
              <div className="grid grid-cols-3 gap-2">
                <Input
                  id="jd-daily-target"
                  label="Daily Target"
                  type="number"
                  placeholder="0"
                  value={form.daily_target}
                  onChange={(e) => setField('daily_target', e.target.value)}
                />
                <Input
                  id="jd-weekly-target"
                  label="Weekly Target"
                  type="number"
                  placeholder="0"
                  value={form.weekly_target}
                  onChange={(e) => setField('weekly_target', e.target.value)}
                />
                <Input
                  id="jd-monthly-target"
                  label="Monthly Target"
                  type="number"
                  placeholder="0"
                  value={form.monthly_target}
                  onChange={(e) => setField('monthly_target', e.target.value)}
                />
              </div>
            )}
            {!form.has_targets && (
              <p className="text-xs text-slate-400 italic">
                This direction will be tracked by completion only, with no numeric targets.
              </p>
            )}
            {error && form.work_details.trim() !== '' && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit}>Add Direction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Filter tabs ───────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'active' | 'deletion_requested'

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'All',                value: 'all' },
  { label: 'Active',             value: 'active' },
  { label: 'Deletion Requested',  value: 'deletion_requested' },
]

// ─── Main Page ─────────────────────────────────────────────────────────────────

type ViewMode = 'mine' | 'team' | 'history'

function getDefaultHistoryMonth() {
  const now = new Date()
  return now.getMonth() === 0
    ? { year: now.getFullYear() - 1, month: 12 }
    : { year: now.getFullYear(), month: now.getMonth() }
}

export function JobDirections() {
  const { user } = useAuth()
  const allDirections  = useJobDirectionStore((s) => s.directions)
  const fetchHistory   = useJobDirectionStore((s) => s.fetchMonthlyHistory)
  const profiles       = useProfileStore((s) => s.profiles)

  const location = useLocation()

  const [showAdd, setShowAdd]           = useState(false)
  const [viewMode, setViewMode]         = useState<ViewMode>('mine')

  // ── History state ──
  const [histYear,     setHistYear]     = useState(() => getDefaultHistoryMonth().year)
  const [histMonth,    setHistMonth]    = useState(() => getDefaultHistoryMonth().month)
  const [histData,     setHistData]     = useState<JDHistoryRow[]>([])
  const [histLoading,  setHistLoading]  = useState(false)
  const [histEmployee, setHistEmployee] = useState('all')

  useEffect(() => {
    if (viewMode !== 'history') return
    setHistLoading(true)
    fetchHistory(histYear, histMonth).then((rows) => {
      setHistData(rows)
      setHistLoading(false)
    })
  }, [viewMode, histYear, histMonth, fetchHistory])

  useEffect(() => {
    const state = location.state as { view?: string } | null
    if (state?.view === 'team') setViewMode('team')
  }, [location.state])
  const [filterTab, setFilterTab]       = useState<FilterTab>('all')
  const [teamSearch, setTeamSearch]     = useState('')
  const [teamEmployee, setTeamEmployee] = useState<string>('all')
  const [teamBranch,   setTeamBranch]   = useState('all')
  const [teamDept,     setTeamDept]     = useState('all')
  const [selectedDetail, setSelectedDetail] = useState<{ kind: 'jd'; data: JobDirection } | null>(null)
  const [mySortKey,  setMySortKey]      = useState<JDMySortKey>('work_details')
  const [mySortDir,  setMySortDir]      = useState<SortDir>('asc')
  const { visibleCols: jdSchema, loading: jdSchemaLoading } = useUISchema('job_directions')

  const { allowedIds, availableBranches, availableDepartments, showBranchFilter, showDeptFilter } = useRBACFilter()
  const canCreateJD = usePermissionStore((s) => s.permissions?.can_create_job_directions ?? false)

  function toggleMySort(key: JDMySortKey) {
    if (mySortKey === key) setMySortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setMySortKey(key); setMySortDir('asc') }
  }
  if (!user) return null

  const myDirections = allDirections.filter((d) => d.employee_id === user.id)
  // Team directions scoped to RBAC-allowed employees
  const teamDirections = allDirections.filter(
    (d) => d.employee_id !== user.id && allowedIds.has(d.employee_id)
  )

  // KPI counts
  const activeCount    = myDirections.filter((d) => ['active', 'approved'].includes(d.status)).length
  const approvedCount  = myDirections.filter((d) => ['active', 'completed', 'approved'].includes(d.status)).length
  const completedCount = myDirections.filter((d) => d.status === 'completed').length

  const JD_STATUS_ORDER: Record<string, number> = { active: 0, submitted: 1, approved: 2, rejected: 3, completed: 4 }

  const filteredMineBase = useMemo(() => {
    if (filterTab === 'all') return myDirections
    if (filterTab === 'active') return myDirections.filter((d) => ['active', 'approved'].includes(d.status))
    return myDirections.filter((d) => d.status === filterTab)
  }, [myDirections, filterTab])

  const filteredMine = useMemo(() => {
    return [...filteredMineBase].sort((a, b) => {
      const sign = mySortDir === 'asc' ? 1 : -1
      if (mySortKey === 'work_details') return sign * (a.work_details ?? '').localeCompare(b.work_details ?? '')
      if (mySortKey === 'status') return sign * ((JD_STATUS_ORDER[a.status] ?? 0) - (JD_STATUS_ORDER[b.status] ?? 0))
      if (mySortKey === 'daily') return sign * ((a.daily_completed ?? 0) - (b.daily_completed ?? 0))
      if (mySortKey === 'weekly') return sign * ((a.weekly_completed ?? 0) - (b.weekly_completed ?? 0))
      if (mySortKey === 'monthly') return sign * ((a.monthly_completed ?? 0) - (b.monthly_completed ?? 0))
      return 0
    })
  }, [filteredMineBase, mySortKey, mySortDir])

  // Team employee list for filter dropdown
  const teamEmployees = useMemo(() => {
    const ids = [...new Set(teamDirections.map((d) => d.employee_id))]
    return ids.map((id) => profiles.find((p) => p.id === id)).filter(Boolean) as typeof profiles
  }, [teamDirections, profiles])

  // Filtered team (RBAC already applied to teamDirections + branch/dept/employee/search)
  const filteredTeam = useMemo(() => {
    let list = teamDirections
    if (teamBranch !== 'all') {
      list = list.filter((d) => profiles.find((p) => p.id === d.employee_id)?.branch === teamBranch)
    }
    if (teamDept !== 'all') {
      list = list.filter((d) => profiles.find((p) => p.id === d.employee_id)?.department_id === teamDept)
    }
    if (teamEmployee !== 'all') list = list.filter((d) => d.employee_id === teamEmployee)
    if (teamSearch.trim()) {
      const q = teamSearch.toLowerCase()
      list = list.filter(
        (d) =>
          (d.work_details ?? '').toLowerCase().includes(q) ||
          profiles.find((p) => p.id === d.employee_id)?.full_name.toLowerCase().includes(q)
      )
    }
    return list
  }, [teamDirections, teamBranch, teamDept, teamEmployee, teamSearch, profiles])

  const activeTeam = teamDirections.filter((d) => d.status !== 'completed').length

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Job Directions</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track your goals and what's assigned across your team</p>
        </div>
        {canCreateJD && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} />
            New Direction
          </Button>
        )}
      </div>

      {/* ── Primary tab switcher ── */}
      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setViewMode('mine')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
            viewMode === 'mine'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <ClipboardList size={15} />
          My Directions
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold',
            viewMode === 'mine' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500')}>
            {myDirections.length}
          </span>
        </button>
        <button
          onClick={() => setViewMode('team')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
            viewMode === 'team'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Users size={15} />
          Team
          {activeTeam > 0 && (
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold',
              viewMode === 'team' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500')}>
              {activeTeam}
            </span>
          )}
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
            viewMode === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <History size={15} />
          History
        </button>
      </div>

      {/* ── KPI Strip — My Directions only ── */}
      {viewMode === 'mine' && (
        <div className="grid grid-cols-3 gap-3">
          <KPICard label="Active"    value={activeCount}    color="text-blue-600" />
          <KPICard label="Approved"  value={approvedCount}  color="text-emerald-600" />
          <KPICard label="Completed" value={completedCount} color="text-slate-600" />
        </div>
      )}

      {/* ── Main card ── */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm">

        {/* My Directions: status sub-tabs */}
        {viewMode === 'mine' && (
          <div className="flex items-center gap-0.5 border-b border-slate-100 px-4 pt-3 pb-0 overflow-x-auto">
            {FILTER_TABS.map((tab) => {
              const count = tab.value === 'all' ? myDirections.length
                : tab.value === 'active'
                  ? myDirections.filter((d) => ['active', 'approved'].includes(d.status)).length
                  : myDirections.filter((d) => d.status === tab.value).length
              return (
                <button
                  key={tab.value}
                  onClick={() => setFilterTab(tab.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors',
                    filterTab === tab.value
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                >
                  {tab.label}
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    filterTab === tab.value ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500')}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Team: search + filters */}
        {viewMode === 'team' && (
          <div className="border-b border-slate-100 px-4 py-3 flex flex-wrap items-center gap-3">
            {/* Branch filter — MD / EA / HR only */}
            {showBranchFilter && (
              <select
                value={teamBranch}
                onChange={(e) => setTeamBranch(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
              >
                <option value="all">All Branches</option>
                {availableBranches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            )}

            {/* Department filter — MD / EA / HR / Director */}
            {showDeptFilter && (
              <select
                value={teamDept}
                onChange={(e) => setTeamDept(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
              >
                <option value="all">All Departments</option>
                {availableDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}

            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search directions, people…"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
              />
              {teamSearch && (
                <button onClick={() => setTeamSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>
            <Select value={teamEmployee} onValueChange={setTeamEmployee}>
              <SelectTrigger className="w-[180px] text-sm">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All employees</SelectItem>
                {teamEmployees.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400 ml-auto whitespace-nowrap">
              {filteredTeam.length} of {teamDirections.length} directions
            </p>
          </div>
        )}

        {/* My Directions */}
        {viewMode === 'mine' && (
          filteredMine.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-400">No directions in this category.</p>
              {filterTab === 'all' && canCreateJD && (
                <Button size="sm" variant="outline" className="mt-4" onClick={() => setShowAdd(true)}>
                  <Plus size={14} /> Add your first direction
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="divide-y divide-slate-100 sm:hidden">
                {filteredMine.map((jd) => (
                  <div key={jd.id} onClick={() => setSelectedDetail({ kind: 'jd', data: jd })} className="px-4 py-3 hover:bg-slate-50/70 cursor-pointer active:bg-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium leading-snug flex-1', jd.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800')}>{jd.work_details || '—'}</p>
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap', STATUS_COLORS[jd.status])}>{STATUS_LABELS[jd.status] || jd.status}</span>
                    </div>
                    {jd.description && (
                      <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{jd.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      {jd.daily_target > 0 && <span>Daily: {jd.daily_completed}/{jd.daily_target}</span>}
                      {jd.weekly_target > 0 && <span>Weekly: {jd.weekly_completed}/{jd.weekly_target}</span>}
                      {jd.monthly_target > 0 && <span>Monthly: {jd.monthly_completed}/{jd.monthly_target}</span>}
                      {!jd.daily_target && !jd.weekly_target && !jd.monthly_target && <span className="text-slate-400 italic">No targets</span>}
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      {([
                        { key: 'work_details' as JDMySortKey, label: 'Work Details', cls: '' },
                        { key: 'daily' as JDMySortKey, label: 'Daily Progress', cls: 'w-40' },
                        { key: 'weekly' as JDMySortKey, label: 'Weekly Progress', cls: 'w-40' },
                        { key: 'monthly' as JDMySortKey, label: 'Monthly Progress', cls: 'w-40' },
                        { key: 'status' as JDMySortKey, label: 'Status', cls: '' },
                      ]).map(({ key, label, cls }) => (
                        <th key={key} className={`py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 ${cls}`}>
                          <button onClick={() => toggleMySort(key)} className="flex items-center hover:text-blue-600 transition-colors">
                            {label}<SortIcon active={mySortKey === key} dir={mySortDir} />
                          </button>
                        </th>
                      ))}
                      <th className="py-3 px-5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMine.map((jd) => (
                      <DirectionRow key={jd.id} jd={jd} onClick={() => setSelectedDetail({ kind: 'jd', data: jd })} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}

        {/* History */}
        {viewMode === 'history' && (() => {
          const now = new Date()
          const monthOptions: { year: number; month: number; label: string }[] = []
          for (let i = 1; i <= 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            monthOptions.push({
              year:  d.getFullYear(),
              month: d.getMonth() + 1,
              label: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
            })
          }

          const myHistory   = histData.filter((r) => r.employee_id === user?.id)
          const teamHistory = histData.filter((r) => r.employee_id !== user?.id)
          const histTeamPeople = [...new Map(teamHistory.map((r) => [r.employee_id, r.employee_name])).entries()]

          const filteredTeamHistory = histEmployee === 'all'
            ? teamHistory
            : teamHistory.filter((r) => r.employee_id === histEmployee)

          function HistoryTable({ rows }: { rows: JDHistoryRow[] }) {
            if (rows.length === 0) {
              return <p className="px-6 py-8 text-center text-sm text-slate-400">No data for this month.</p>
            }
            return (
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Work Details</th>
                    {histTeamPeople.length > 0 && rows === filteredTeamHistory && (
                      <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 w-40">Employee</th>
                    )}
                    <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 w-32">Monthly Target</th>
                    <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 w-32">Achieved</th>
                    <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 w-44">Completion</th>
                    <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map((row) => {
                    const pct = row.monthly_target > 0
                      ? Math.min(100, (row.monthly_achieved / row.monthly_target) * 100)
                      : null
                    const barColor = pct === null ? 'bg-slate-300'
                      : pct >= 100 ? 'bg-emerald-500'
                      : pct >= 60  ? 'bg-blue-500'
                      : 'bg-amber-400'
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-5 text-sm text-slate-800 max-w-[260px]">
                          <span className="line-clamp-2">{row.work_details || '—'}</span>
                        </td>
                        {histTeamPeople.length > 0 && rows === filteredTeamHistory && (
                          <td className="py-3 px-5 text-sm text-slate-600 whitespace-nowrap">{row.employee_name}</td>
                        )}
                        <td className="py-3 px-5 text-sm tabular-nums text-slate-600">
                          {row.monthly_target > 0 ? row.monthly_target : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 px-5 text-sm tabular-nums font-semibold text-slate-800">
                          {row.monthly_achieved > 0 ? row.monthly_achieved : <span className="text-slate-300 font-normal">0</span>}
                        </td>
                        <td className="py-3 px-5">
                          {pct !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                                <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs font-semibold tabular-nums text-slate-600 w-9 text-right shrink-0">
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">No target</span>
                          )}
                        </td>
                        <td className="py-3 px-5">
                          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', STATUS_COLORS[row.status] ?? 'bg-slate-100 text-slate-500')}>
                            {STATUS_LABELS[row.status] ?? row.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          }

          return (
            <div>
              {/* Controls */}
              <div className="border-b border-slate-100 px-4 py-3 flex flex-wrap items-center gap-3">
                <select
                  value={`${histYear}-${histMonth}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split('-').map(Number)
                    setHistYear(y); setHistMonth(m)
                  }}
                  className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
                >
                  {monthOptions.map((o) => (
                    <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>{o.label}</option>
                  ))}
                </select>
                {histTeamPeople.length > 0 && (
                  <select
                    value={histEmployee}
                    onChange={(e) => setHistEmployee(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
                  >
                    <option value="all">All employees</option>
                    {histTeamPeople.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                  </select>
                )}
                {histLoading && <span className="text-xs text-slate-400 animate-pulse">Loading…</span>}
              </div>

              {histLoading ? (
                <div className="px-6 py-10 text-center text-sm text-slate-400 animate-pulse">Fetching history…</div>
              ) : (
                <div className="overflow-x-auto">
                  {/* My section */}
                  <div className="px-5 pt-4 pb-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">My Directions</p>
                  </div>
                  <HistoryTable rows={myHistory} />

                  {/* Team section — only if there's team data */}
                  {teamHistory.length > 0 && (
                    <>
                      <div className="px-5 pt-5 pb-1 border-t border-slate-100">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Team</p>
                      </div>
                      <HistoryTable rows={filteredTeamHistory} />
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })()}

        {/* Team directions */}
        {viewMode === 'team' && (
          filteredTeam.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">
              {teamSearch || teamEmployee !== 'all' ? 'No directions match your filters.' : 'No team directions yet.'}
            </div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="divide-y divide-slate-100 sm:hidden">
                {filteredTeam.map((jd) => {
                  const employee = profiles.find((p) => p.id === jd.employee_id)
                  const manager = profiles.find((p) => p.id === jd.manager_id)
                  return (
                    <div key={jd.id} onClick={() => setSelectedDetail({ kind: 'jd', data: jd })} className="px-4 py-3 hover:bg-slate-50/70 cursor-pointer active:bg-slate-100">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm font-medium leading-snug flex-1', jd.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800')}>{jd.work_details || '—'}</p>
                        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap', STATUS_COLORS[jd.status])}>{STATUS_LABELS[jd.status] || jd.status}</span>
                      </div>
                      {jd.description && (
                        <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{jd.description}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        {employee && (
                          <>
                            <Avatar name={employee.full_name} size="xs" />
                            <span className="text-xs text-slate-600">{employee.full_name}</span>
                          </>
                        )}
                        {manager && <span className="text-xs text-slate-400">· {manager.full_name}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                        {jd.daily_target > 0 && <span>D: {jd.daily_completed}/{jd.daily_target}</span>}
                        {jd.weekly_target > 0 && <span>W: {jd.weekly_completed}/{jd.weekly_target}</span>}
                        {jd.monthly_target > 0 && <span>M: {jd.monthly_completed}/{jd.monthly_target}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Desktop: Custom table with Actions */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Work Details</th>
                      <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Assigned To</th>
                      <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Manager</th>
                      <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 w-40">Daily Progress</th>
                      <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 w-40">Weekly Progress</th>
                      <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 w-40">Monthly Progress</th>
                      <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                      <th className="py-3 px-5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeam.map((jd) => (
                      <TeamDirectionRow key={jd.id} jd={jd} onClick={() => setSelectedDetail({ kind: 'jd', data: jd })} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}
      </div>

      <AddDirectionModal open={showAdd} onClose={() => setShowAdd(false)} />
      <TaskDetailModal item={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </div>
  )
}
