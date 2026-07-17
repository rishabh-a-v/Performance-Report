import { useState } from 'react'
import { CheckCircle2, Circle, Clock, ClipboardList, Trash2, Edit3 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/store/profileStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useTeamJobStore } from '@/store/teamJobStore'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn, formatDate, todayLocalISO } from '@/lib/utils'
import {
  canUpdateSubTask, isDone, isOverdue, nextSpecialTaskStatus, nextSubTaskStatus,
  PRIORITY_LABELS, PRIORITY_STYLES, unifiedDue, unifiedTitle, type UnifiedTask,
} from './taskViewModel'
import type { SpecialTask, TaskPriority, TeamJob, TeamJobTask } from '@/types/database'

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', PRIORITY_STYLES[priority])}>
      {PRIORITY_LABELS[priority]}
    </span>
  )
}

function ApprovalChips({ task }: { task: SpecialTask }) {
  return (
    <>
      {task.approval_status === 'pending' && (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          Pending Approval
        </span>
      )}
      {task.approval_status === 'rejected' && (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
          Changes Requested
        </span>
      )}
    </>
  )
}

// One status toggle that understands both kinds. ST keeps its existing flow
// (finish → 'In review' unless you assigned it yourself); TJ cycles 3 states.
function StatusToggle({ item, isManagerOrAbove, allowedIds, size = 20 }: {
  item: UnifiedTask; isManagerOrAbove: boolean; allowedIds: Set<string>; size?: number
}) {
  const { user } = useAuth()
  const done = isDone(item)
  const inProgress = item.task.status === 'In progress'
  const locked = item.kind === 'tj'
    ? !(user && canUpdateSubTask(item.task, item.job, user.id, isManagerOrAbove, allowedIds))
    : item.task.status === 'In review'

  const Icon = done ? CheckCircle2 : inProgress && item.kind === 'tj' ? Clock : Circle

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (locked || !user) return
    if (item.kind === 'st') {
      const nextStatus = nextSpecialTaskStatus(item.task, user.id)
      if (nextStatus === 'In review') {
        const ok = window.confirm('Are you sure you want to submit this task for review?')
        if (!ok) return
      }
      useSpecialTaskStore.getState().setStatus(item.task.id, nextStatus)
    } else {
      useTeamJobStore.getState().updateSubTask(item.task.id, { status: nextSubTaskStatus(item.task.status) })
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={locked}
      title={locked ? undefined : 'Click to update status'}
      className={cn(
        'shrink-0 transition-colors',
        done ? 'text-emerald-500' : inProgress ? 'text-blue-500' : 'text-muted-foreground/40',
        !locked && (done ? 'hover:text-muted-foreground/40' : 'hover:text-emerald-400'),
        locked && 'cursor-default opacity-60',
      )}
    >
      <Icon size={size} />
    </button>
  )
}

// Small pill linking a sub-task row back to its parent team job.
function JobPill({ job, onOpenJob }: { job: TeamJob; onOpenJob: (j: TeamJob) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onOpenJob(job) }}
      className="inline-flex max-w-[180px] items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors truncate"
      title={`Team job: ${job.title}`}
    >
      ↳ {job.title}
    </button>
  )
}

function DeleteButton({ task }: { task: SpecialTask }) {
  const { user, role } = useAuth()
  const { deleteTask } = useSpecialTaskStore()
  const [confirming, setConfirming] = useState(false)
  const isAssigner = user?.id === task.assigned_by
  const isAdmin = ['managing_director', 'executive_assistant', 'hr', 'director'].includes(role ?? '')
  if (!isAssigner && !isAdmin) return null

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => deleteTask(task.id)}
          className="rounded-lg bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
        >
          Delete
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
        >
          Keep
        </button>
      </span>
    )
  }
  return (
    <button
      onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
      className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
      title="Delete task"
    >
      <Trash2 size={13} />
    </button>
  )
}

export interface TaskListProps {
  items: UnifiedTask[]
  context: 'mine' | 'team'
  emptyMessage: string
  isManagerOrAbove: boolean
  allowedIds: Set<string>
  onOpenSt: (task: SpecialTask) => void
  onOpenTj: (task: TeamJobTask, job: TeamJob) => void
  onOpenJob: (job: TeamJob) => void
}

export function TaskList({ items, context, emptyMessage, isManagerOrAbove, allowedIds, onOpenSt, onOpenTj, onOpenJob }: TaskListProps) {
  const profiles = useProfileStore((s) => s.profiles)
  const today = todayLocalISO()

  if (items.length === 0) {
    return <EmptyState icon={ClipboardList} message={emptyMessage} />
  }

  const name = (id: string | null | undefined) => profiles.find((p) => p.id === id)?.full_name

  function rowClick(item: UnifiedTask) {
    if (item.kind === 'st') onOpenSt(item.task)
    else onOpenTj(item.task, item.job)
  }

  function PeopleCell({ item }: { item: UnifiedTask }) {
    if (item.kind === 'tj') {
      const assignee = name(item.task.assignee_id)
      return assignee ? (
        <span className="flex items-center gap-2">
          <Avatar name={assignee} size="xs" />
          <span className="text-sm text-muted-foreground truncate">{assignee}</span>
        </span>
      ) : <span className="text-sm text-muted-foreground">—</span>
    }
    if (context === 'mine') {
      const by = name(item.task.assigned_by)
      return by ? (
        <span className="flex items-center gap-2">
          <Avatar name={by} size="xs" />
          <span className="text-sm text-muted-foreground truncate">{by}</span>
        </span>
      ) : <span className="text-sm text-muted-foreground">—</span>
    }
    const assignees = (item.task.assignees ?? [])
      .map((a) => profiles.find((p) => p.id === a.employee_id))
      .filter(Boolean)
    if (assignees.length === 0) return <span className="text-sm text-muted-foreground">—</span>
    return (
      <span className="flex items-center gap-2">
        <span className="flex -space-x-1.5">
          {assignees.slice(0, 3).map((p) => (
            <Avatar key={p!.id} name={p!.full_name} size="xs" className="ring-2 ring-card" />
          ))}
        </span>
        <span className="text-sm text-muted-foreground truncate">
          {assignees.length === 1 ? assignees[0]!.full_name : `${assignees.length} people`}
        </span>
      </span>
    )
  }

  function TagCell({ item }: { item: UnifiedTask }) {
    if (item.kind === 'st') return <PriorityBadge priority={item.task.priority ?? 'medium'} />
    if (item.task.task_type) {
      return (
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          {item.task.task_type}
        </span>
      )
    }
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="sm:hidden space-y-3 px-1 py-1">
        {items.map((item) => {
          const overdue = isOverdue(item, today)
          const due = unifiedDue(item)
          return (
            <div
              key={item.id}
              onClick={() => rowClick(item)}
              className="p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer active:scale-[0.99] flex flex-col gap-2.5"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0"><StatusToggle item={item} isManagerOrAbove={isManagerOrAbove} allowedIds={allowedIds} size={18} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={cn(
                      'text-sm font-semibold leading-snug flex-1 text-slate-800',
                      isDone(item) && 'line-through text-slate-400'
                    )}>
                      {unifiedTitle(item)}
                    </p>
                    <StatusBadge status={item.task.status} className="shrink-0 whitespace-nowrap text-[10px] uppercase font-bold" />
                  </div>
                  
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                    {item.kind === 'tj' && (
                      <JobPill job={item.job} onOpenJob={onOpenJob} />
                    )}
                    {item.kind === 'st' && (
                      <PriorityBadge priority={item.task.priority ?? 'medium'} />
                    )}
                    {item.kind === 'st' && <ApprovalChips task={item.task} />}
                    {due && (
                      <span className={cn(
                        'inline-flex items-center rounded-md px-1.5 py-0.5 font-medium text-[10px]',
                        overdue ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                      )}>
                        {overdue ? 'Overdue · ' : ''}Due {formatDate(due)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer row with Assigned By or Assignees */}
              <div className="border-t border-slate-50 pt-2.5 flex items-center justify-between text-xs text-slate-400">
                <span>{item.kind === 'tj' ? 'Team Task' : 'Special Task'}</span>
                <div>
                  {item.kind === 'tj' ? (
                    name(item.task.assignee_id) && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px]">Assignee:</span>
                        <Avatar name={name(item.task.assignee_id)!} size="xs" />
                        <span className="font-medium text-slate-600">{name(item.task.assignee_id)}</span>
                      </div>
                    )
                  ) : context === 'mine' ? (
                    name(item.task.assigned_by) && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px]">Assigned by:</span>
                        <Avatar name={name(item.task.assigned_by)!} size="xs" />
                        <span className="font-medium text-slate-600">{name(item.task.assigned_by)}</span>
                      </div>
                    )
                  ) : (
                    (() => {
                      const assignees = (item.task.assignees ?? [])
                        .map((a) => profiles.find((p) => p.id === a.employee_id))
                        .filter(Boolean)
                      if (assignees.length === 0) return null
                      return (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px]">Assignees:</span>
                          <span className="flex -space-x-1.5">
                            {assignees.slice(0, 3).map((p) => (
                              <Avatar key={p!.id} name={p!.full_name} size="xs" className="ring-2 ring-card" />
                            ))}
                          </span>
                          <span className="font-medium text-slate-600">
                            {assignees.length === 1 ? assignees[0]!.full_name : `${assignees.length} people`}
                          </span>
                        </div>
                      )
                    })()
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
              <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {context === 'mine' ? 'From' : 'Assignee'}
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</th>
              <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
              <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="py-3 px-5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const overdue = isOverdue(item, today)
              const due = unifiedDue(item)
              return (
                <tr
                  key={item.id}
                  onClick={() => rowClick(item)}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <td className="py-4 px-5 max-w-[300px]">
                    <div className="flex items-center gap-3">
                      <StatusToggle item={item} isManagerOrAbove={isManagerOrAbove} allowedIds={allowedIds} />
                      <div className="min-w-0">
                        <p className={cn('text-sm font-medium leading-snug truncate', isDone(item) ? 'line-through text-muted-foreground' : 'text-foreground')}>
                          {unifiedTitle(item)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.kind === 'tj' && <JobPill job={item.job} onOpenJob={onOpenJob} />}
                          {item.kind === 'st' && item.task.remarks && (
                            <p className="text-xs text-muted-foreground truncate">{item.task.remarks}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap"><PeopleCell item={item} /></td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span className={cn('text-sm tabular-nums', overdue ? 'text-red-600 font-semibold' : 'text-muted-foreground')}>
                      {due ? formatDate(due) : '—'}
                      {overdue && <span className="ml-1 text-xs">(Overdue)</span>}
                    </span>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap"><TagCell item={item} /></td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <StatusBadge status={item.task.status} className="text-xs px-2.5" />
                      {item.kind === 'st' && <ApprovalChips task={item.task} />}
                    </div>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => rowClick(item)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title={item.kind === 'st' ? 'Open task' : 'Update sub-task'}
                      >
                        <Edit3 size={13} />
                      </button>
                      {item.kind === 'st' && <DeleteButton task={item.task} />}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
