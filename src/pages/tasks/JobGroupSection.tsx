import { useState } from 'react'
import { ChevronDown, ChevronRight, Users, ArrowUpRight } from 'lucide-react'
import { useProfileStore } from '@/store/profileStore'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn, formatDate, todayLocalISO } from '@/lib/utils'
import { SubTaskStatusToggle, JobProgressBar } from './JobDetailPanel'
import { canUpdateSubTask, nextSubTaskStatus, type UnifiedTask } from './taskViewModel'
import { useTeamJobStore } from '@/store/teamJobStore'
import type { TeamJob, TeamJobTask } from '@/types/database'

/**
 * "By Job" view of the Team tab: one collapsed row per team job (title, head,
 * progress, due, status). Expanding shows sub-tasks inline; "Open" launches
 * the full JobDetailPanel for management actions.
 */
export function JobGroupSection({
  groups,
  userId,
  isManagerOrAbove,
  allowedIds,
  onOpenJob,
  onOpenSubTask,
}: {
  groups: Array<{ job: TeamJob; tasks: UnifiedTask[] }>
  userId: string
  isManagerOrAbove: boolean
  allowedIds: Set<string>
  onOpenJob: (job: TeamJob) => void
  onOpenSubTask: (task: TeamJobTask, job: TeamJob) => void
}) {
  const profiles = useProfileStore((s) => s.profiles)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const today = todayLocalISO()

  if (groups.length === 0) {
    return <EmptyState icon={Users} message="No team jobs in your scope yet." />
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="divide-y divide-border">
      {groups.map(({ job, tasks }) => {
        const open = expanded.has(job.id)
        const head = profiles.find((p) => p.id === job.head_id)
        const isOverdue = job.due_date && job.due_date < today && job.status === 'active'

        return (
          <div key={job.id}>
            {/* Collapsed job row */}
            <div
              onClick={() => toggle(job.id)}
              className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-muted/50 cursor-pointer transition-colors"
            >
              {open
                ? <ChevronDown size={15} className="shrink-0 text-muted-foreground" />
                : <ChevronRight size={15} className="shrink-0 text-muted-foreground" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn('text-sm font-medium leading-snug truncate', job.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground')}>
                    {job.title}
                  </p>
                  <StatusBadge status={job.status} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {head && (
                    <span className="flex items-center gap-1.5">
                      <Avatar name={head.full_name} size="xs" /> {head.full_name}
                    </span>
                  )}
                  {job.due_date && (
                    <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
                      Due {formatDate(job.due_date)}{isOverdue ? ' · Overdue' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="hidden sm:block w-36 shrink-0">
                <JobProgressBar job={job} />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenJob(job) }}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Open <ArrowUpRight size={12} />
              </button>
            </div>

            {/* Expanded sub-tasks */}
            {open && (
              <div className="bg-muted/30 border-t border-border">
                {tasks.length === 0 ? (
                  <p className="px-12 py-3 text-xs text-muted-foreground">No sub-tasks yet.</p>
                ) : (
                  <div className="divide-y divide-border/60">
                    {tasks.map((u) => {
                      if (u.kind !== 'tj') return null
                      const task = u.task
                      const assignee = profiles.find((p) => p.id === task.assignee_id)
                      const overdue = task.due_date && task.due_date < today && task.status !== 'Completed'
                      return (
                        <div
                          key={u.id}
                          onClick={() => onOpenSubTask(task, job)}
                          className="flex items-center gap-3 pl-10 sm:pl-12 pr-4 py-2.5 hover:bg-muted/60 cursor-pointer"
                        >
                          <SubTaskStatusToggle
                            task={task}
                            canUpdate={canUpdateSubTask(task, job, userId, isManagerOrAbove, allowedIds)}
                            size={15}
                            onToggleStatus={(t) => useTeamJobStore.getState().updateSubTask(t.id, { status: nextSubTaskStatus(t.status) })}
                          />
                          <p className={cn('flex-1 min-w-0 truncate text-sm', task.status === 'Completed' ? 'line-through text-muted-foreground' : 'text-foreground')}>
                            {task.title}
                          </p>
                          {assignee && (
                            <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                              <Avatar name={assignee.full_name} size="xs" /> {assignee.full_name}
                            </span>
                          )}
                          {task.due_date && (
                            <span className={cn('text-xs tabular-nums shrink-0', overdue ? 'text-red-500 font-semibold' : 'text-muted-foreground')}>
                              {formatDate(task.due_date)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
