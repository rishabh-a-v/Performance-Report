import { useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/store/profileStore'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Plus, Users, ClipboardList, Search, X, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useRBACFilter } from '@/hooks/useRBACFilter'
import { usePermissionStore } from '@/store/permissionStore'
import { useUISchema } from '@/hooks/useUISchema'
import { DynamicDataTable } from '@/components/ui/DynamicDataTable'

type SortDir = 'asc' | 'desc'
type MyTaskSortKey = 'task_name' | 'assigned_by' | 'created_at' | 'due_date' | 'status'
type TeamTaskSortKey = 'task_name' | 'assigned_to' | 'assigned_by' | 'created_at' | 'due_date' | 'status'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={12} className="text-slate-300 ml-1 inline shrink-0" />
  return dir === 'asc'
    ? <ChevronUp size={12} className="text-blue-500 ml-1 inline shrink-0" />
    : <ChevronDown size={12} className="text-blue-500 ml-1 inline shrink-0" />
}
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/Dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/Select'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import type { SpecialTask, SpecialTaskStatus } from '@/types/database'

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<SpecialTaskStatus, string> = {
  'Yet to start': 'bg-slate-100 text-slate-600',
  'In progress':  'bg-blue-100 text-blue-700',
  Completed:    'bg-emerald-100 text-emerald-700',
  Cancelled:    'bg-red-100 text-red-600',
  Acknowledged: 'bg-teal-100 text-teal-700',
}

const STATUS_LABELS: Record<SpecialTaskStatus, string> = {
  'Yet to start': 'Yet to Start',
  'In progress':  'In Progress',
  Completed:    'Completed',
  Cancelled:    'Cancelled',
  Acknowledged: 'Acknowledged',
}

type FilterTab = 'all' | 'in_progress' | 'completed'

const TABS: { label: string; value: FilterTab }[] = [
  { label: 'All',         value: 'all' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed',   value: 'completed' },
]

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-4">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
    </div>
  )
}

// ─── Task Row (my tasks) ───────────────────────────────────────────────────────

function TaskRow({ task, onClick }: { task: SpecialTask; onClick?: () => void }) {
  const { setStatus } = useSpecialTaskStore()
  const { user } = useAuth()
  const profiles = useProfileStore((s) => s.profiles)
  const assignedBy = profiles.find((p) => p.id === task.assigned_by)
  const today = new Date().toISOString().slice(0, 10)
  const isDone = task.status === 'Completed' || task.status === 'Acknowledged'
  const isOverdue = task.due_date && task.due_date < today && !isDone
  const isAcknowledged = task.status === 'Acknowledged'
  const isAssigner = user?.id === task.assigned_by

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (isDone && !isAcknowledged) setStatus(task.id, 'Yet to start')
    else if (!isDone) setStatus(task.id, 'Completed')
  }

  function handleAcknowledge(e: React.MouseEvent) {
    e.stopPropagation()
    setStatus(task.id, 'Acknowledged')
  }

  return (
    <tr
      onClick={onClick}
      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
    >
      <td className="py-4 px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            className={cn(
              'shrink-0 transition-colors',
              isDone ? 'text-emerald-500 hover:text-slate-300' : 'text-slate-300 hover:text-emerald-400'
            )}
          >
            {isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
          </button>
          <p className={cn('text-sm font-medium leading-snug', isDone ? 'line-through text-slate-400' : 'text-slate-800')}>
            {task.task_name}
          </p>
        </div>
      </td>
      <td className="py-4 px-5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Avatar name={assignedBy?.full_name ?? '?'} size="xs" />
          <span className="text-sm text-slate-600 hidden sm:inline">{assignedBy?.full_name ?? '—'}</span>
        </div>
      </td>
      <td className="py-4 px-5 whitespace-nowrap">
        <span className="text-sm tabular-nums text-slate-500">
          {task.created_at ? formatDate(task.created_at) : '—'}
        </span>
      </td>
      <td className="py-4 px-5 whitespace-nowrap">
        <span className={cn('text-sm tabular-nums', isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500')}>
          {task.due_date ? formatDate(task.due_date) : '—'}
          {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
        </span>
      </td>
      <td className="py-4 px-5 whitespace-nowrap">
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_COLORS[task.status])}>
          {STATUS_LABELS[task.status]}
        </span>
      </td>
      <td className="py-4 px-5 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2">
          {isAssigner && task.status === 'Completed' && (
            <button
              onClick={handleAcknowledge}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors"
            >
              <CheckCircle2 size={11} />
              Acknowledge
            </button>
          )}
          {isDone && !isAcknowledged && !isAssigner && (
            <button onClick={handleToggle} className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors">
              Undo
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── Team Task Row ─────────────────────────────────────────────────────────────

function TeamTaskRow({ task, onClick }: { task: SpecialTask; onClick?: () => void }) {
  const profiles = useProfileStore((s) => s.profiles)
  const assignees = (task.assignees ?? []).map((a) => profiles.find((p) => p.id === a.employee_id)).filter(Boolean) as typeof profiles
  const assignedBy = profiles.find((p) => p.id === task.assigned_by)
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'Completed' && task.status !== 'Acknowledged'

  return (
    <tr
      onClick={onClick}
      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
    >
      <td className="py-4 px-5 max-w-[240px]">
        <p className={cn('text-sm font-medium leading-snug truncate', task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800')}>
          {task.task_name}
        </p>
        {task.remarks && (
          <p className="text-xs text-slate-400 truncate mt-0.5">{task.remarks}</p>
        )}
      </td>
      <td className="py-4 px-5 whitespace-nowrap">
        {assignees.length === 1 ? (
          <div className="flex items-center gap-2">
            <Avatar name={assignees[0].full_name} size="xs" />
            <div>
              <p className="text-sm text-slate-700 font-medium leading-tight">{assignees[0].full_name}</p>
              <p className="text-xs text-slate-400">{assignees[0].role ?? ''}</p>
            </div>
          </div>
        ) : assignees.length > 1 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {assignees.slice(0, 3).map((p) => (
                <Avatar key={p.id} name={p.full_name} size="xs" className="ring-2 ring-white" />
              ))}
              {assignees.length > 3 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 ring-2 ring-white">
                  +{assignees.length - 3}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500">{assignees.length} people</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>
      <td className="py-4 px-5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Avatar name={assignedBy?.full_name ?? '?'} size="xs" />
          <span className="text-sm text-slate-600">{assignedBy?.full_name ?? '—'}</span>
        </div>
      </td>
      <td className="py-4 px-5 whitespace-nowrap">
        <span className="text-sm tabular-nums text-slate-500">
          {task.created_at ? formatDate(task.created_at) : '—'}
        </span>
      </td>
      <td className="py-4 px-5 whitespace-nowrap">
        <span className={cn('text-sm tabular-nums', isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500')}>
          {task.due_date ? formatDate(task.due_date) : '—'}
          {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
        </span>
      </td>
      <td className="py-4 px-5 whitespace-nowrap">
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_COLORS[task.status])}>
          {STATUS_LABELS[task.status]}
        </span>
      </td>
    </tr>
  )
}

// ─── Add Task Modal ────────────────────────────────────────────────────────────

interface AddTaskModalProps {
  open: boolean
  onClose: () => void
  defaultAssigneeId?: string
}

export function AddTaskModal({ open, onClose, defaultAssigneeId }: AddTaskModalProps) {
  const { user } = useAuth()
  const { addTask } = useSpecialTaskStore()
  const [taskName, setTaskName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [remarks, setRemarks] = useState('')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [assigneeSearch, setAssigneeSearch] = useState('')
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

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
    setError('')
  }

  function handleSubmit() {
    if (!taskName.trim()) { setError('Task name is required.'); return }
    if (assigneeIds.length === 0) { setError('Select at least one assignee.'); return }

    addTask({
      task_name: taskName.trim(),
      remarks: remarks.trim() || null,
      assigned_by: user?.id ?? '',
      due_date: dueDate || null,
      status: 'Yet to start',
    }, assigneeIds)

    // Reset
    setTaskName('')
    setDueDate('')
    setRemarks('')
    setAssigneeIds([])
    onClose()
  }

  function handleOpenChange(o: boolean) {
    if (!o) {
      onClose()
      setTaskName('')
      setDueDate('')
      setRemarks('')
      setAssigneeIds(defaultAssigneeId ? [defaultAssigneeId] : (user?.id ? [user.id] : []))
      setAssigneeSearch('')
      setError('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <Input
            id="st-title"
            label="Task Name *"
            placeholder="e.g. Prepare monthly report"
            value={taskName}
            onChange={(e) => { setTaskName(e.target.value); setError('') }}
            error={error && !taskName.trim() ? error : ''}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-foreground/70">
              Assignees * <span className="text-slate-400 font-normal">({assigneeIds.length} selected)</span>
            </label>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-2.5 py-1.5">
                <Search size={13} className="shrink-0 text-slate-400" />
                <input
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
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 bg-slate-50">
                {assigneeOptions
                  .filter((p) => !assigneeSearch.trim() || p.full_name.toLowerCase().includes(assigneeSearch.toLowerCase()))
                  .map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={assigneeIds.includes(p.id)}
                        onChange={() => toggleAssignee(p.id)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Avatar name={p.full_name} size="xs" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {p.full_name}
                          {p.id === user?.id && <span className="ml-1 text-slate-400 font-normal">(me)</span>}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{p.role}</p>
                      </div>
                    </label>
                  ))}
              </div>
            </div>
            {error && assigneeIds.length === 0 && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>

          <Input
            id="st-due"
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Textarea
            id="st-remarks"
            label="Remarks"
            placeholder="Add notes or details..."
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type ViewMode = 'mine' | 'team'

export function SpecialTasks() {
  const { user } = useAuth()
  const location  = useLocation()
  const allTasks = useSpecialTaskStore((s) => s.tasks)
  const profiles  = useProfileStore((s) => s.profiles)
  const [activeTab, setActiveTab]     = useState<FilterTab>('all')
  const [viewMode, setViewMode]       = useState<ViewMode>('mine')

  useEffect(() => {
    if ((location.state as any)?.view === 'team') setViewMode('team')
  }, [location.state])
  const [showAdd, setShowAdd]         = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<{ kind: 'st'; data: SpecialTask } | null>(null)
  const [teamSearch, setTeamSearch]       = useState('')
  const [teamEmployee, setTeamEmployee]   = useState<string>('all')
  const [teamBranch,   setTeamBranch]     = useState('all')
  const [teamDept,     setTeamDept]       = useState('all')
  const [mySortKey,    setMySortKey]      = useState<MyTaskSortKey>('due_date')
  const [mySortDir,    setMySortDir]      = useState<SortDir>('asc')
  const { visibleCols: taskSchema, loading: taskSchemaLoading } = useUISchema('special_tasks')

  const { allowedIds, availableBranches, availableDepartments, showBranchFilter, showDeptFilter } = useRBACFilter()
  const canCreateTasks = usePermissionStore((s) => s.permissions?.can_create_tasks ?? false)

  function toggleMySort(key: MyTaskSortKey) {
    if (mySortKey === key) setMySortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setMySortKey(key); setMySortDir('asc') }
  }
  if (!user) return null

  const myTasks = allTasks.filter(
    (t) => t.assignees?.some((a) => a.employee_id === user.id)
  )

  // Team: tasks not assigned to current user, scoped to RBAC-allowed employees
  const teamTasks = allTasks.filter(
    (t) =>
      !t.assignees?.some((a) => a.employee_id === user.id) &&
      t.assignees?.some((a) => allowedIds.has(a.employee_id))
  )
  const activeTeam = teamTasks.filter((t) => t.status !== 'Completed' && t.status !== 'Acknowledged').length

  const today = new Date().toISOString().slice(0, 10)
  const dueTodayCount   = myTasks.filter((t) => t.due_date === today && t.status !== 'Completed' && t.status !== 'Acknowledged').length
  const overdueCount    = myTasks.filter((t) => t.due_date && t.due_date < today && t.status !== 'Completed' && t.status !== 'Acknowledged').length
  const inProgressCount = myTasks.filter((t) => (t.status === 'Yet to start' || t.status === 'In progress')).length
  const completedCount  = myTasks.filter((t) => t.status === 'Completed' || t.status === 'Acknowledged').length

  // Unique assignees across team tasks for the employee filter
  const teamEmployees = useMemo(() => {
    const ids = new Set<string>()
    teamTasks.forEach((t) => t.assignees?.forEach((a) => ids.add(a.employee_id)))
    return [...ids].map((id) => profiles.find((p) => p.id === id)).filter(Boolean) as typeof profiles
  }, [teamTasks, profiles])

  // Filtered team tasks (RBAC + branch/dept/employee/search filters)
  const filteredTeam = useMemo(() => {
    let list = teamTasks

    if (teamBranch !== 'all') {
      list = list.filter((t) =>
        t.assignees?.some((a) => profiles.find((p) => p.id === a.employee_id)?.branch === teamBranch)
      )
    }
    if (teamDept !== 'all') {
      list = list.filter((t) =>
        t.assignees?.some((a) => profiles.find((p) => p.id === a.employee_id)?.department_id === teamDept)
      )
    }
    if (teamEmployee !== 'all') {
      list = list.filter((t) => t.assignees?.some((a) => a.employee_id === teamEmployee))
    }
    if (teamSearch.trim()) {
      const q = teamSearch.toLowerCase()
      list = list.filter((t) =>
        t.task_name.toLowerCase().includes(q) ||
        (t.remarks ?? '').toLowerCase().includes(q) ||
        (t.assignees ?? []).some(
          (a) => profiles.find((p) => p.id === a.employee_id)?.full_name.toLowerCase().includes(q)
        ) ||
        profiles.find((p) => p.id === t.assigned_by)?.full_name.toLowerCase().includes(q)
      )
    }
    return list
  }, [teamTasks, teamBranch, teamDept, teamEmployee, teamSearch, profiles])

  const STATUS_ORDER: Record<string, number> = { 'Yet to start': 0, 'In progress': 1, Completed: 2, Cancelled: 3, Acknowledged: 4 }

  const filteredMine = useMemo(() => {
    const base = activeTab === 'all'
      ? myTasks
      : activeTab === 'in_progress'
        ? myTasks.filter((t) => t.status === 'Yet to start' || t.status === 'In progress')
        : myTasks.filter((t) => t.status === 'Completed' || t.status === 'Acknowledged')
    return [...base].sort((a, b) => {
      const sign = mySortDir === 'asc' ? 1 : -1
      if (mySortKey === 'task_name') return sign * (a.task_name ?? '').localeCompare(b.task_name ?? '')
      if (mySortKey === 'assigned_by') {
        const na = profiles.find((p) => p.id === a.assigned_by)?.full_name ?? ''
        const nb = profiles.find((p) => p.id === b.assigned_by)?.full_name ?? ''
        return sign * na.localeCompare(nb)
      }
      if (mySortKey === 'created_at') return sign * ((a.created_at ?? '') < (b.created_at ?? '') ? -1 : 1)
      if (mySortKey === 'due_date') {
        const da = a.due_date ?? '9999'
        const db = b.due_date ?? '9999'
        return sign * (da < db ? -1 : da > db ? 1 : 0)
      }
      if (mySortKey === 'status') return sign * ((STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0))
      return 0
    })
  }, [myTasks, activeTab, mySortKey, mySortDir, profiles])


  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Tasks</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track your work and what's happening across your team</p>
        </div>
        {canCreateTasks && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} />
            New Task
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
          My Tasks
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-bold',
            viewMode === 'mine' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
          )}>
            {myTasks.length}
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
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-bold',
              viewMode === 'team' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
            )}>
              {activeTeam}
            </span>
          )}
        </button>
      </div>

      {/* KPI Strip — My Tasks only */}
      {viewMode === 'mine' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KPICard label="Due Today"   value={dueTodayCount}   color="text-amber-600" />
          <KPICard label="Overdue"     value={overdueCount}    color="text-red-600" />
          <KPICard label="In Progress" value={inProgressCount} color="text-blue-600" />
          <KPICard label="Completed"   value={completedCount}  color="text-emerald-600" />
        </div>
      )}

      {/* Main Card */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm">

        {/* ── My Tasks: status sub-tabs ── */}
        {viewMode === 'mine' && (
          <div className="flex items-center gap-0.5 border-b border-slate-100 px-4 pt-3 pb-0 overflow-x-auto">
            {TABS.map((tab) => {
              const count = tab.value === 'all'
                ? myTasks.length
                : tab.value === 'in_progress'
                  ? myTasks.filter((t) => t.status === 'Yet to start' || t.status === 'In progress').length
                  : myTasks.filter((t) => t.status === 'Completed' || t.status === 'Acknowledged').length
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors',
                    activeTab === tab.value
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    activeTab === tab.value ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                  )}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* ── Team: search + filter toolbar ── */}
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
                placeholder="Search tasks, people…"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
              />
              {teamSearch && (
                <button
                  onClick={() => setTeamSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
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
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-xs text-slate-400 ml-auto whitespace-nowrap">
              {filteredTeam.length} of {teamTasks.length} tasks
            </p>
          </div>
        )}

        {/* ── My Tasks ── */}
        {viewMode === 'mine' && (
          filteredMine.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">No tasks in this category.</div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="divide-y divide-slate-100 sm:hidden">
                {filteredMine.map((task) => {
                  const assignedBy = profiles.find((p) => p.id === task.assigned_by)
                  const today2 = new Date().toISOString().slice(0, 10)
                  const isDone = task.status === 'Completed' || task.status === 'Acknowledged'
                  const isOverdue = task.due_date && task.due_date < today2 && !isDone
                  return (
                    <div key={task.id} onClick={() => setSelectedDetail({ kind: 'st', data: task })} className="px-4 py-3 hover:bg-slate-50/70 cursor-pointer active:bg-slate-100">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm font-medium leading-snug flex-1', isDone ? 'line-through text-slate-400' : 'text-slate-800')}>{task.task_name}</p>
                        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap', STATUS_COLORS[task.status])}>{STATUS_LABELS[task.status]}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
                        {assignedBy && <span>By {assignedBy.full_name}</span>}
                        {task.due_date && (
                          <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
                            Due {formatDate(task.due_date)}{isOverdue ? ' · Overdue' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      {([
                        { key: 'task_name' as MyTaskSortKey, label: 'Task' },
                        { key: 'assigned_by' as MyTaskSortKey, label: 'Assigned By' },
                        { key: 'created_at' as MyTaskSortKey, label: 'Date Assigned' },
                        { key: 'due_date' as MyTaskSortKey, label: 'Due Date' },
                        { key: 'status' as MyTaskSortKey, label: 'Status' },
                      ]).map(({ key, label }) => (
                        <th key={key} className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                          <button onClick={() => toggleMySort(key)} className="flex items-center hover:text-blue-600 transition-colors">
                            {label}<SortIcon active={mySortKey === key} dir={mySortDir} />
                          </button>
                        </th>
                      ))}
                      <th className="py-3 px-5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredMine.map((task) => (
                      <TaskRow key={task.id} task={task} onClick={() => setSelectedDetail({ kind: 'st', data: task })} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}

        {/* ── Team tasks ── */}
        {viewMode === 'team' && (
          <DynamicDataTable
            schema={taskSchema}
            data={filteredTeam as unknown as Record<string, unknown>[]}
            profiles={profiles}
            onRowClick={(row) => setSelectedDetail({ kind: 'st', data: row as unknown as SpecialTask })}
            emptyMessage={teamSearch || teamEmployee !== 'all' ? 'No tasks match your filters.' : 'No team tasks yet.'}
            loading={taskSchemaLoading}
          />
        )}
      </div>

      <AddTaskModal open={showAdd} onClose={() => setShowAdd(false)} />
      <TaskDetailModal item={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </div>
  )
}
