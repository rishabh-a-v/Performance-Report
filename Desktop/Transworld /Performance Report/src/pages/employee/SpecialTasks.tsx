import { useState, useEffect } from 'react'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useAuth } from '@/contexts/AuthContext'
import { PROFILES, reportees } from '@/lib/mockData'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Plus, Users } from 'lucide-react'
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
import type { SpecialTask, SpecialTaskStatus, TaskPriority } from '@/types/database'

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<SpecialTaskStatus, string> = {
  pending:     'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  on_hold:     'bg-amber-100 text-amber-700',
  completed:   'bg-emerald-100 text-emerald-700',
}

const STATUS_LABELS: Record<SpecialTaskStatus, string> = {
  pending:     'Pending',
  in_progress: 'In Progress',
  on_hold:     'On Hold',
  completed:   'Completed',
}

const PRIORITY_BG: Record<string, string> = {
  low:      'bg-slate-100 text-slate-500',
  medium:   'bg-blue-50 text-blue-600',
  high:     'bg-amber-50 text-amber-600',
  critical: 'bg-red-50 text-red-600',
}

type FilterTab = 'all' | SpecialTaskStatus

const TABS: { label: string; value: FilterTab }[] = [
  { label: 'All',         value: 'all' },
  { label: 'Pending',     value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'On Hold',     value: 'on_hold' },
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
  const assignedBy = PROFILES.find((p) => p.id === task.assigned_by)
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'completed'
  const isDone = task.status === 'completed'

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setStatus(task.id, isDone ? 'in_progress' : 'completed')
  }

  return (
    <tr
      onClick={onClick}
      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
    >
      <td className="py-3 px-4">
        <div className="flex items-start gap-2.5">
          <button
            onClick={handleToggle}
            className={cn(
              'mt-0.5 shrink-0 transition-colors',
              isDone ? 'text-emerald-500 hover:text-slate-300' : 'text-slate-300 hover:text-emerald-400'
            )}
          >
            {isDone ? <CheckCircle2 size={15} /> : <Circle size={15} />}
          </button>
          <div className="min-w-0">
            <p className={cn('text-xs font-medium leading-snug', isDone ? 'line-through text-slate-400' : 'text-slate-800')}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed truncate max-w-xs">
                {task.description}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Avatar name={assignedBy?.full_name ?? '?'} size="xs" />
          <span className="text-xs text-slate-600 hidden sm:inline">{assignedBy?.full_name ?? '—'}</span>
        </div>
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <span className={cn('text-xs tabular-nums', isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500')}>
          {task.due_date ? formatDate(task.due_date) : '—'}
          {isOverdue && <span className="ml-1 text-[10px]">(Overdue)</span>}
        </span>
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', PRIORITY_BG[task.priority])}>
          {task.priority}
        </span>
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', STATUS_COLORS[task.status])}>
          {STATUS_LABELS[task.status]}
        </span>
      </td>
      <td className="py-3 px-4 whitespace-nowrap text-right">
        {!isDone ? (
          <button onClick={handleToggle} className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
            Mark Done
          </button>
        ) : (
          <button onClick={handleToggle} className="text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors">
            Undo
          </button>
        )}
      </td>
    </tr>
  )
}

// ─── Delegated Task Row ────────────────────────────────────────────────────────

function DelegatedTaskRow({ task, onClick }: { task: SpecialTask; onClick?: () => void }) {
  const assignedTo = PROFILES.find((p) => p.id === task.assigned_to)
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'completed'

  return (
    <tr
      onClick={onClick}
      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
    >
      <td className="py-3 px-4">
        <div className="min-w-0">
          <p className={cn('text-xs font-medium leading-snug', task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800')}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{task.description}</p>
          )}
        </div>
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Avatar name={assignedTo?.full_name ?? '?'} size="xs" />
          <div>
            <p className="text-xs text-slate-700 font-medium">{assignedTo?.full_name ?? '—'}</p>
            <p className="text-[10px] text-slate-400">{assignedTo?.designation ?? ''}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <span className={cn('text-xs tabular-nums', isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500')}>
          {task.due_date ? formatDate(task.due_date) : '—'}
          {isOverdue && <span className="ml-1 text-[10px]">(Overdue)</span>}
        </span>
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', PRIORITY_BG[task.priority])}>
          {task.priority}
        </span>
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', STATUS_COLORS[task.status])}>
          {STATUS_LABELS[task.status]}
        </span>
      </td>
    </tr>
  )
}

// ─── Add Task Modal ────────────────────────────────────────────────────────────

const EMPTY_TASK = {
  title: '',
  description: '',
  priority: 'medium' as TaskPriority,
  due_date: '',
}

interface AddTaskModalProps {
  open: boolean
  onClose: () => void
  defaultAssigneeId?: string
}

export function AddTaskModal({ open, onClose, defaultAssigneeId }: AddTaskModalProps) {
  const { user } = useAuth()
  const { addTask } = useSpecialTaskStore()
  const [form, setForm] = useState(EMPTY_TASK)
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId ?? user?.id ?? '')
  const [error, setError] = useState('')

  const directReports = reportees(user?.id ?? '')
  // Self + direct reports as assignee options
  const assigneeOptions = user
    ? [user, ...directReports.filter((r) => r.id !== user.id)]
    : []

  useEffect(() => {
    if (open) {
      setAssigneeId(defaultAssigneeId ?? user?.id ?? '')
      setForm(EMPTY_TASK)
      setError('')
    }
  }, [open, defaultAssigneeId, user?.id])

  function setField(field: keyof typeof EMPTY_TASK, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setError('')
  }

  function handleSubmit() {
    if (!form.title.trim()) { setError('Title is required.'); return }

    addTask({
      title:       form.title.trim(),
      description: form.description.trim() || null,
      assigned_to: assigneeId || (user?.id ?? ''),
      assigned_by: user?.id ?? '',
      priority:    form.priority,
      due_date:    form.due_date || null,
      status:      'pending',
    })

    onClose()
  }

  const showAssigneePicker = assigneeOptions.length > 1

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Special Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            id="st-title"
            label="Title *"
            placeholder="e.g. Prepare monthly report"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            error={error}
          />

          <Textarea
            id="st-desc"
            label="Description"
            placeholder="Optional details..."
            rows={2}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />

          {showAssigneePicker && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-foreground/70">Assign To</label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assigneeOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                      {p.id === user?.id ? ' (me)' : ` — ${p.designation ?? p.role}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-foreground/70">Priority</label>
              <Select value={form.priority} onValueChange={(v) => setField('priority', v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              id="st-due"
              label="Due Date"
              type="date"
              value={form.due_date}
              onChange={(e) => setField('due_date', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit}>Add Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type ViewMode = 'mine' | 'delegated'

export function SpecialTasks() {
  const { user } = useAuth()
  const allTasks = useSpecialTaskStore((s) => s.tasks)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('mine')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<{ kind: 'st'; data: SpecialTask } | null>(null)

  if (!user) return null

  const myReports = reportees(user.id)
  const isManager = myReports.length > 0

  const myTasks = allTasks.filter((t) => t.assigned_to === user.id)
  const delegatedTasks = allTasks.filter(
    (t) => t.assigned_by === user.id && t.assigned_to !== user.id
  )

  const today = new Date().toISOString().slice(0, 10)
  const dueTodayCount   = myTasks.filter((t) => t.due_date === today && t.status !== 'completed').length
  const overdueCount    = myTasks.filter((t) => t.due_date && t.due_date < today && t.status !== 'completed').length
  const inProgressCount = myTasks.filter((t) => t.status === 'in_progress').length
  const completedCount  = myTasks.filter((t) => t.status === 'completed').length

  const filtered = viewMode === 'delegated'
    ? delegatedTasks
    : activeTab === 'all' ? myTasks : myTasks.filter((t) => t.status === activeTab)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        {isManager ? (
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 gap-0.5">
            <button
              onClick={() => setViewMode('mine')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                viewMode === 'mine'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              My Tasks
            </button>
            <button
              onClick={() => setViewMode('delegated')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                viewMode === 'delegated'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Users size={12} />
              Delegated
              {delegatedTasks.filter((t) => t.status !== 'completed').length > 0 && (
                <span className={cn(
                  'rounded-full px-1.5 text-[9px] font-semibold',
                  viewMode === 'delegated' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                )}>
                  {delegatedTasks.filter((t) => t.status !== 'completed').length}
                </span>
              )}
            </button>
          </div>
        ) : (
          <div />
        )}
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} />
          New Task
        </Button>
      </div>

      {/* KPI Strip — only for My Tasks view */}
      {viewMode === 'mine' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KPICard label="Due Today"   value={dueTodayCount}   color="text-amber-600" />
          <KPICard label="Overdue"     value={overdueCount}    color="text-red-600" />
          <KPICard label="In Progress" value={inProgressCount} color="text-blue-600" />
          <KPICard label="Completed"   value={completedCount}  color="text-emerald-600" />
        </div>
      )}

      {/* Main Card */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        {/* Filter Tabs — only for My Tasks view */}
        {viewMode === 'mine' && (
          <div className="flex items-center gap-0.5 border-b border-slate-100 px-4 pt-3 pb-0 overflow-x-auto">
            {TABS.map((tab) => {
              const count = tab.value === 'all'
                ? myTasks.length
                : myTasks.filter((t) => t.status === tab.value).length
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

        {viewMode === 'delegated' && (
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">
              Tasks you've assigned to your team ({delegatedTasks.length} total)
            </p>
          </div>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-400">
            {viewMode === 'delegated' ? "You haven't delegated any tasks yet." : 'No tasks in this category.'}
          </div>
        ) : viewMode === 'mine' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Task</th>
                  <th className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Assigned By</th>
                  <th className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Due Date</th>
                  <th className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Priority</th>
                  <th className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="py-2.5 px-4 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedDetail({ kind: 'st', data: task })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Task</th>
                  <th className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Assigned To</th>
                  <th className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Due Date</th>
                  <th className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Priority</th>
                  <th className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((task) => (
                  <DelegatedTaskRow
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedDetail({ kind: 'st', data: task })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddTaskModal open={showAdd} onClose={() => setShowAdd(false)} />
      <TaskDetailModal item={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </div>
  )
}
