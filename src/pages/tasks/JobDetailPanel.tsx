import { useState } from 'react'
import {
  Plus, X, Circle, Clock, CheckCircle2, CheckSquare,
  Trash2, Edit3, UserCheck, Briefcase,
} from 'lucide-react'
import { useTeamJobStore } from '@/store/teamJobStore'
import { useProfileStore } from '@/store/profileStore'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { NativeSelect } from '@/components/ui/Select'
import { cn, formatDate } from '@/lib/utils'
import { canManageTeamJob, canUpdateSubTask, nextSubTaskStatus } from './taskViewModel'
import { UpdateSubTaskModal } from './UpdateSubTaskModal'
import type { TeamJob, TeamJobTask, TeamTaskStatus } from '@/types/database'

export const TASK_STATUS_ICON: Record<TeamTaskStatus, React.ElementType> = {
  'Yet to start': Circle,
  'In progress':  Clock,
  Completed:      CheckCircle2,
}

export function SubTaskStatusToggle({ task, canUpdate, onToggleStatus, size = 22 }: {
  task: TeamJobTask; canUpdate: boolean; onToggleStatus: (t: TeamJobTask) => void; size?: number
}) {
  const StatusIcon = TASK_STATUS_ICON[task.status]
  if (!canUpdate) {
    return (
      <StatusIcon
        size={size}
        className={cn(
          'shrink-0',
          task.status === 'Completed'   ? 'text-emerald-500' :
          task.status === 'In progress' ? 'text-blue-500'    : 'text-muted-foreground/40',
        )}
      />
    )
  }
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggleStatus(task) }}
      title="Click to update status"
      className={cn(
        'shrink-0 transition-colors',
        task.status === 'Completed'
          ? 'text-emerald-500 hover:text-muted-foreground/40'
          : 'text-muted-foreground/40 hover:text-emerald-400',
        task.status === 'In progress' && 'text-blue-500 hover:text-emerald-500',
      )}
    >
      <StatusIcon size={size} />
    </button>
  )
}

export function jobProgress(job: TeamJob) {
  const tasks     = job.tasks ?? []
  const completed = tasks.filter((t) => t.status === 'Completed').length
  const pct       = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
  return { tasks, completed, pct }
}

export function JobProgressBar({ job }: { job: TeamJob }) {
  const { tasks, completed, pct } = jobProgress(job)
  if (tasks.length === 0) return <span className="text-xs text-muted-foreground">No sub-tasks</span>
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted min-w-[64px]">
        <div
          className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-emerald-500' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums text-muted-foreground whitespace-nowrap shrink-0">
        {completed}/{tasks.length}
      </span>
    </div>
  )
}

// ── Job detail slide-over — full team-job management, moved from TeamJobs ─────

export function JobDetailPanel({
  job,
  onClose,
  userId,
  isManagerOrAbove,
  profiles,
  allowedProfiles,
  allowedIds,
}: {
  job: TeamJob
  onClose: () => void
  userId: string
  isManagerOrAbove: boolean
  profiles: ReturnType<typeof useProfileStore['getState']>['profiles']
  allowedProfiles: ReturnType<typeof useProfileStore['getState']>['profiles']
  allowedIds: Set<string>
}) {
  const { updateSubTask, deleteSubTask, addSubTask, updateJobStatus, deleteJob } = useTeamJobStore()
  const [updatingTask, setUpdatingTask] = useState<TeamJobTask | null>(null)
  const [showAddSubTask, setShowAddSubTask] = useState(false)
  const [newSubTask, setNewSubTask] = useState({ title: '', task_type: '', assignee_id: '', due_date: '' })
  const [addingSubTask, setAddingSubTask] = useState(false)

  const isCreator  = job.created_by === userId
  const canManage  = canManageTeamJob(job, userId, isManagerOrAbove, allowedIds)
  const tasks      = job.tasks ?? []
  const completed  = tasks.filter((t) => t.status === 'Completed').length
  const pct        = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0

  const headProfile    = profiles.find((p) => p.id === job.head_id)
  const creatorProfile = profiles.find((p) => p.id === job.created_by)

  async function handleCompleteJob() {
    await updateJobStatus(job.id, 'completed')
    onClose()
  }

  async function handleCancelJob() {
    await updateJobStatus(job.id, 'cancelled')
    onClose()
  }

  async function handleDeleteJob() {
    if (!confirm('Delete this team job and all its sub-tasks?')) return
    await deleteJob(job.id)
    onClose()
  }

  async function handleAddSubTask() {
    if (!newSubTask.title.trim() || !newSubTask.assignee_id) return
    setAddingSubTask(true)
    await addSubTask(job.id, {
      title: newSubTask.title.trim(),
      task_type: newSubTask.task_type.trim() || null,
      assignee_id: newSubTask.assignee_id,
      due_date: newSubTask.due_date || null,
    })
    setNewSubTask({ title: '', task_type: '', assignee_id: '', due_date: '' })
    setShowAddSubTask(false)
    setAddingSubTask(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="hidden sm:block fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-0 sm:inset-y-0 sm:right-0 z-50 flex w-full sm:max-w-xl flex-col bg-background sm:bg-card sm:border-l border-border shadow-card">
        {/* Header */}
        <div
          className="flex items-start justify-between border-b border-border px-6 py-5"
          style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' }}
        >
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={job.status} className="text-[11px] px-2.5" />
              {job.due_date && (
                <span className="text-xs text-muted-foreground">{formatDate(job.due_date)}</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-foreground leading-tight">{job.title}</h2>
            {job.description && (
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{job.description}</p>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Meta row */}
          <div className="flex flex-wrap gap-4 px-6 py-4 border-b border-border">
            {headProfile && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-50">
                  <UserCheck size={12} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Task Head</p>
                  <p className="text-xs font-semibold text-foreground">{headProfile.full_name}</p>
                </div>
              </div>
            )}
            {creatorProfile && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Briefcase size={12} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Created By</p>
                  <p className="text-xs font-semibold text-foreground">{creatorProfile.full_name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overall Progress</p>
              <p className="text-xs font-bold text-foreground">{completed} / {tasks.length} sub-tasks done</p>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-emerald-500' : 'bg-primary')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-right text-[10px] text-muted-foreground">{pct}%</p>
          </div>

          {/* Sub-tasks list */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sub-tasks</p>
              {canManage && job.status === 'active' && (
                <button
                  onClick={() => setShowAddSubTask((v) => !v)}
                  className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-[12px] font-semibold text-muted-foreground hover:bg-muted/70 transition-colors"
                >
                  <Plus size={12} /> Add Sub-task
                </button>
              )}
            </div>

            {/* Add sub-task inline form */}
            {showAddSubTask && (
              <div className="mb-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
                <input
                  value={newSubTask.title}
                  onChange={(e) => setNewSubTask((s) => ({ ...s, title: e.target.value }))}
                  placeholder="Sub-task title *"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={newSubTask.task_type}
                    onChange={(e) => setNewSubTask((s) => ({ ...s, task_type: e.target.value }))}
                    placeholder="Type (e.g. Site Survey)"
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="date"
                    value={newSubTask.due_date}
                    onChange={(e) => setNewSubTask((s) => ({ ...s, due_date: e.target.value }))}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <NativeSelect
                  value={newSubTask.assignee_id}
                  onChange={(e) => setNewSubTask((s) => ({ ...s, assignee_id: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select assignee *</option>
                  {allowedProfiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </NativeSelect>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddSubTask(false)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSubTask}
                    disabled={addingSubTask || !newSubTask.title.trim() || !newSubTask.assignee_id}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {addingSubTask ? 'Adding…' : 'Add'}
                  </button>
                </div>
              </div>
            )}

            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <CheckSquare size={28} className="opacity-30 mb-2" />
                <p className="text-sm font-medium">No sub-tasks yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const assignee   = profiles.find((p) => p.id === task.assignee_id)
                  const StatusIcon = TASK_STATUS_ICON[task.status]
                  const canUpdate  = canUpdateSubTask(task, job, userId, isManagerOrAbove, allowedIds)
                  const canDelete  = canManage && job.status === 'active'

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'rounded-xl border p-3.5 transition-colors',
                        task.status === 'Completed'
                          ? 'border-emerald-100 bg-emerald-50/40'
                          : 'border-border bg-card',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {canUpdate ? (
                          <button
                            onClick={() => updateSubTask(task.id, { status: nextSubTaskStatus(task.status) })}
                            title="Click to update status"
                            className={cn(
                              'mt-0.5 shrink-0 transition-colors',
                              task.status === 'Completed'
                                ? 'text-emerald-500 hover:text-muted-foreground/40'
                                : 'text-muted-foreground/40 hover:text-emerald-400',
                              task.status === 'In progress' && 'text-blue-500 hover:text-emerald-500',
                            )}
                          >
                            <StatusIcon size={16} />
                          </button>
                        ) : (
                          <StatusIcon
                            size={16}
                            className={cn(
                              'mt-0.5 shrink-0',
                              task.status === 'Completed'   ? 'text-emerald-500' :
                              task.status === 'In progress' ? 'text-blue-500' : 'text-muted-foreground/40',
                            )}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {task.task_type && (
                              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                {task.task_type}
                              </span>
                            )}
                            <StatusBadge status={task.status} />
                          </div>
                          <p className={cn('mt-1 text-sm font-medium', task.status === 'Completed' ? 'text-muted-foreground line-through' : 'text-foreground')}>
                            {task.title}
                          </p>

                          <div className="mt-2 flex items-center gap-2">
                            {assignee && (
                              <div className="flex items-center gap-1.5">
                                <Avatar name={assignee.full_name} size="xs" />
                                <span className="text-xs text-muted-foreground">{assignee.full_name}</span>
                              </div>
                            )}
                            {task.due_date && (
                              <span className="text-[11px] text-muted-foreground">· Due {formatDate(task.due_date)}</span>
                            )}
                          </div>

                          {task.notes && (
                            <div className="mt-2 rounded-lg bg-muted border border-border px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Notes</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{task.notes}</p>
                            </div>
                          )}

                          {task.completed_at && (
                            <p className="mt-1.5 text-[11px] text-emerald-600 font-medium">
                              Completed {formatDate(task.completed_at)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {canUpdate && (
                            <button
                              onClick={() => setUpdatingTask(task)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                              title="Update"
                            >
                              <Edit3 size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => deleteSubTask(task.id, job.id)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        {canManage && job.status === 'active' && (
          <div className="border-t border-border px-6 py-4 flex flex-wrap gap-2">
            <button
              onClick={handleCompleteJob}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 size={15} /> Mark Complete
            </button>
            <button
              onClick={handleCancelJob}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel Job
            </button>
            {isCreator && (
              <button
                onClick={handleDeleteJob}
                className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Update sub-task modal */}
      {updatingTask && (
        <UpdateSubTaskModal
          task={updatingTask}
          onClose={() => setUpdatingTask(null)}
          onSave={(status, notes) => updateSubTask(updatingTask.id, { status, notes })}
        />
      )}
    </>
  )
}
