import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge'
import { KPICard } from '@/components/ui/KPICard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { TaskProgressDrawer } from '@/components/tasks/TaskProgressDrawer'
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal'
import { useTaskStore } from '@/store/taskStore'
import { formatDate, completionRate, cn } from '@/lib/utils'
import {
  calcForecast, forecastLabel, forecastBg, progressPct,
  formatQuantity, isMeasurable, progressSummary,
  isQuantity, isValue, isMilestone,
} from '@/lib/kpiEngine'
import type { Task, TaskStatus, Milestone } from '@/types/database'
import { CheckSquare, Clock, AlertTriangle, TrendingUp, Plus, BarChart2 } from 'lucide-react'

const STATUS_ORDER: TaskStatus[] = ['in_progress', 'blocked', 'ready', 'backlog', 'done']
const STATUS_FILTERS: { label: string; value: TaskStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Ready', value: 'ready' },
  { label: 'Backlog', value: 'backlog' },
  { label: 'Done', value: 'done' },
]

function DoneToggle({ taskId }: { taskId: string }) {
  const toggleTaskDone = useTaskStore((s) => s.toggleTaskDone)
  const done = useTaskStore((s) => s.tasks.find((t) => t.id === taskId)?.status === 'done')
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggleTaskDone(taskId) }}
      title={done ? 'Mark as in progress' : 'Mark as done'}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
        done
          ? 'border-emerald-500 bg-emerald-500 text-white'
          : 'border-slate-300 bg-white hover:border-emerald-400',
      )}
    >
      {done && (
        <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

function MeasurableRow({ task, milestones, onUpdate }: { task: Task; milestones: Milestone[]; onUpdate: (t: Task) => void }) {
  const taskMs = milestones.filter((m) => m.task_id === task.id)
  const pct = progressPct(task, milestones)
  const forecast = calcForecast(task, milestones)
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  return (
    <>
      <tr className="group border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
        <td className="px-4 py-2.5">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <DoneToggle taskId={task.id} />
              <BarChart2 size={12} className="shrink-0 text-brand-500" />
              <span className={cn('text-sm font-medium transition-colors', task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-brand-700')}>{task.title}</span>
              {isMilestone(task) && (
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-violet-100 text-violet-700 rounded px-1.5 py-0.5">Milestones</span>
              )}
              {isValue(task) && (
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5">{task.currency}</span>
              )}
            </div>
            {task.description && <span className="pl-4 text-xs text-slate-400 line-clamp-1">{task.description}</span>}
          </div>
        </td>
        <td className="px-4 py-2.5"><PriorityBadge priority={task.priority} /></td>
        <td className="px-4 py-2.5">
          {task.due_date ? (
            <span className={cn('text-xs', isOverdue ? 'font-semibold text-red-600' : 'text-slate-500')}>
              {formatDate(task.due_date)}
            </span>
          ) : <span className="text-xs text-slate-300">—</span>}
        </td>
        <td className="px-4 py-2.5"><StatusBadge status={task.status} /></td>
        <td className="px-4 py-2.5 text-xs text-slate-400">{task.estimated_hours ? `${task.estimated_hours}h` : '—'}</td>
        <td className="px-4 py-2.5">
          {task.tags.map((t) => (
            <span key={t} className="mr-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{t}</span>
          ))}
        </td>
      </tr>
      {/* Progress sub-row */}
      <tr className="bg-brand-50/30 border-t border-brand-100/60">
        <td colSpan={6} className="px-4 py-2.5">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                  {progressSummary(task, milestones)}
                </span>
                {isMilestone(task) && taskMs.length > 0 && (
                  <span className="text-xs text-slate-400">
                    · {taskMs.filter((m) => m.completed).length}/{taskMs.length} done
                  </span>
                )}
              </div>
              <ProgressBar value={pct} size="sm" />
            </div>
            {forecast && (
              <span className={cn(
                'shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium',
                forecastBg(forecast),
              )}>
                {forecastLabel(forecast)}
              </span>
            )}
            <button
              onClick={() => onUpdate(task)}
              className="shrink-0 rounded-lg bg-white border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 shadow-sm transition-colors"
            >
              {isMilestone(task) ? 'View Milestones' : 'Update Progress'}
            </button>
          </div>
        </td>
      </tr>
    </>
  )
}

function RegularRow({ task }: { task: Task }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
  return (
    <tr className="group border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <DoneToggle taskId={task.id} />
            <span className={cn('text-sm font-medium transition-colors', task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-brand-700')}>{task.title}</span>
          </div>
          {task.description && <span className="text-xs text-slate-400 line-clamp-1">{task.description}</span>}
        </div>
      </td>
      <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
      <td className="px-4 py-3">
        {task.due_date ? (
          <span className={cn('text-xs', isOverdue ? 'font-semibold text-red-600' : 'text-slate-500')}>
            {formatDate(task.due_date)}
          </span>
        ) : <span className="text-xs text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
      <td className="px-4 py-3 text-xs text-slate-400">{task.estimated_hours ? `${task.estimated_hours}h` : '—'}</td>
      <td className="px-4 py-3 text-xs text-slate-400">
        {task.tags.map((t) => (
          <span key={t} className="mr-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{t}</span>
        ))}
      </td>
    </tr>
  )
}

export function MyWork() {
  const { user } = useAuth()
  const { getTasksForUser, milestones } = useTaskStore()
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [updateTask, setUpdateTask] = useState<Task | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  if (!user) return null

  const allTasks = getTasksForUser(user.id)
  const filtered = statusFilter === 'all'
    ? [...allTasks].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
    : allTasks.filter((t) => t.status === statusFilter)

  const done    = allTasks.filter((t) => t.status === 'done').length
  const active  = allTasks.filter((t) => t.status === 'in_progress').length
  const blocked = allTasks.filter((t) => t.status === 'blocked').length
  const overdue = allTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
  const rate    = completionRate(done, allTasks.length)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard title="Total Tasks"  value={allTasks.length} icon={CheckSquare} />
        <KPICard title="Completion"   value={`${rate}%`}      icon={TrendingUp}  delta={4.2} iconColor="text-emerald-600" />
        <KPICard title="In Progress"  value={active}          icon={Clock}       iconColor="text-blue-600" />
        <KPICard title="Blocked"      value={blocked}         icon={AlertTriangle} iconColor="text-red-500" invertDelta delta={overdue > 0 ? -overdue : 0} />
      </div>

      {/* Task table */}
      <Card padding={false}>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="px-1">My Tasks</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    statusFilter === f.value
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 shadow-sm"
            >
              <Plus size={13} />
              New Task
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Task</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Priority</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Due Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Est.</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Tags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    No tasks match the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((task) =>
                  isMeasurable(task) ? (
                    <MeasurableRow key={task.id} task={task} milestones={milestones} onUpdate={setUpdateTask} />
                  ) : (
                    <RegularRow key={task.id} task={task} />
                  ),
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
          Showing {filtered.length} of {allTasks.length} tasks
          {allTasks.filter(isMeasurable).length > 0 && (
            <span className="ml-2 text-brand-500 font-medium">
              · {allTasks.filter(isMeasurable).length} measurable
            </span>
          )}
        </div>
      </Card>

      {/* Drawers / Modals */}
      {updateTask && (
        <TaskProgressDrawer task={updateTask} onClose={() => setUpdateTask(null)} />
      )}
      {showCreate && (
        <TaskCreateModal
          currentUserId={user.id}
          defaultDeptId={user.department_id}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
