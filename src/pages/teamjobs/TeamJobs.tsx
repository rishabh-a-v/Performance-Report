import { useState, useEffect, useMemo } from 'react'
import {
  Plus, X, ChevronRight, Users, CheckCircle2, Circle,
  Clock, AlertCircle, Trash2, Edit3, UserCheck, Briefcase,
  CheckSquare, Save,
} from 'lucide-react'
import { useTeamJobStore } from '@/store/teamJobStore'
import { useProfileStore } from '@/store/profileStore'
import { useAuth } from '@/contexts/AuthContext'
import { useRBACFilter } from '@/hooks/useRBACFilter'
import { Avatar } from '@/components/ui/Avatar'
import { cn, formatDate, todayLocalISO } from '@/lib/utils'
import type { TeamJob, TeamJobTask, TeamTaskStatus } from '@/types/database'

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_ORDER: Record<string, number> = {
  executive: 0, executive_assistant: 3, hr: 3, manager: 1, director: 2, managing_director: 3,
}

const TASK_STATUS_STYLE: Record<TeamTaskStatus, string> = {
  'Yet to start': 'bg-slate-100 text-slate-500',
  'In progress':  'bg-blue-100 text-blue-700',
  Completed:      'bg-emerald-100 text-emerald-700',
}

const JOB_STATUS_STYLE: Record<string, string> = {
  active:    'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500',
}

const TASK_STATUS_ICON: Record<TeamTaskStatus, React.ElementType> = {
  'Yet to start': Circle,
  'In progress':  Clock,
  Completed:      CheckCircle2,
}

// Click-to-cycle status, same pattern as Special Tasks: Yet to start -> In progress ->
// Completed -> back to Yet to start (to undo a mistaken complete).
function nextSubTaskStatus(current: TeamTaskStatus): TeamTaskStatus {
  if (current === 'Completed') return 'Yet to start'
  if (current === 'In progress') return 'Completed'
  return 'In progress'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KPICard({ label, value, icon: Icon, color, bg }: {
  label: string; value: number; icon: React.ElementType; color: string; bg: string
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', bg)}>
          <Icon size={17} className={color} />
        </div>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className={cn('text-3xl font-bold tabular-nums', color)}>{value}</p>
    </div>
  )
}

// ── Update Sub-task Modal ─────────────────────────────────────────────────────

function UpdateSubTaskModal({
  task,
  onClose,
  onSave,
}: {
  task: TeamJobTask
  onClose: () => void
  onSave: (status: TeamTaskStatus, notes: string) => Promise<void>
}) {
  const [status, setStatus] = useState<TeamTaskStatus>(task.status)
  const [notes, setNotes]   = useState(task.notes ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(status, notes)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold text-slate-800">Update Sub-task</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Sub-task</p>
            <p className="text-sm font-medium text-slate-800">{task.title}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Status</p>
            <div className="flex flex-col gap-2">
              {(['Yet to start', 'In progress', 'Completed'] as TeamTaskStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-left',
                    status === s
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  {s === 'Yet to start' && <Circle size={15} className="shrink-0" />}
                  {s === 'In progress'  && <Clock size={15} className="shrink-0 text-blue-500" />}
                  {s === 'Completed'    && <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />}
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Notes / Updates</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Describe progress, blockers, or findings..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Update'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Team Job Detail Panel ─────────────────────────────────────────────────────

function TeamJobDetailPanel({
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
  const isHead     = job.head_id    === userId
  // A manager's rank alone isn't enough — they must actually have RBAC oversight over this
  // job's creator/head/an assignee, not merely be able to see it because they're a rank-and-file
  // assignee on someone else's out-of-scope job.
  const jobInScope =
    allowedIds.has(job.created_by ?? '') ||
    allowedIds.has(job.head_id ?? '') ||
    (job.tasks ?? []).some((t) => t.assignee_id && allowedIds.has(t.assignee_id))
  const canManage  = isCreator || isHead || (isManagerOrAbove && jobInScope)
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
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize', JOB_STATUS_STYLE[job.status])}>
                {job.status}
              </span>
              {job.due_date && (
                <span className="text-xs text-slate-400">{formatDate(job.due_date)}</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{job.title}</h2>
            {job.description && (
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">{job.description}</p>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 text-slate-400 hover:text-slate-600 mt-0.5">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Meta row */}
          <div className="flex flex-wrap gap-4 px-6 py-4 border-b border-slate-50">
            {headProfile && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100">
                  <UserCheck size={12} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Task Head</p>
                  <p className="text-xs font-semibold text-slate-700">{headProfile.full_name}</p>
                </div>
              </div>
            )}
            {creatorProfile && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100">
                  <Briefcase size={12} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Created By</p>
                  <p className="text-xs font-semibold text-slate-700">{creatorProfile.full_name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="px-6 py-4 border-b border-slate-50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Progress</p>
              <p className="text-xs font-bold text-slate-700">{completed} / {tasks.length} sub-tasks done</p>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-emerald-500' : 'bg-blue-500')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-right text-[10px] text-slate-400">{pct}%</p>
          </div>

          {/* Sub-tasks list */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sub-tasks</p>
              {canManage && job.status === 'active' && (
                <button
                  onClick={() => setShowAddSubTask((v) => !v)}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <Plus size={12} /> Add Sub-task
                </button>
              )}
            </div>

            {/* Add sub-task inline form */}
            {showAddSubTask && (
              <div className="mb-4 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-4 space-y-3">
                <input
                  value={newSubTask.title}
                  onChange={(e) => setNewSubTask((s) => ({ ...s, title: e.target.value }))}
                  placeholder="Sub-task title *"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newSubTask.task_type}
                    onChange={(e) => setNewSubTask((s) => ({ ...s, task_type: e.target.value }))}
                    placeholder="Type (e.g. Site Survey)"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <input
                    type="date"
                    value={newSubTask.due_date}
                    onChange={(e) => setNewSubTask((s) => ({ ...s, due_date: e.target.value }))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <select
                  value={newSubTask.assignee_id}
                  onChange={(e) => setNewSubTask((s) => ({ ...s, assignee_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select assignee *</option>
                  {allowedProfiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddSubTask(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSubTask}
                    disabled={addingSubTask || !newSubTask.title.trim() || !newSubTask.assignee_id}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {addingSubTask ? 'Adding…' : 'Add'}
                  </button>
                </div>
              </div>
            )}

            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <CheckSquare size={28} className="opacity-30 mb-2" />
                <p className="text-sm font-medium">No sub-tasks yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const assignee   = profiles.find((p) => p.id === task.assignee_id)
                  const isAssignee = task.assignee_id === userId
                  const StatusIcon = TASK_STATUS_ICON[task.status]
                  const canUpdate  = (isAssignee || canManage) && job.status === 'active'
                  const canDelete  = canManage && job.status === 'active'

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'rounded-xl border p-3.5 transition-colors',
                        task.status === 'Completed'
                          ? 'border-emerald-100 bg-emerald-50/40'
                          : 'border-slate-100 bg-white',
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
                                ? 'text-emerald-500 hover:text-slate-300'
                                : 'text-slate-400 hover:text-emerald-400',
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
                              task.status === 'In progress' ? 'text-blue-500' : 'text-slate-400',
                            )}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {task.task_type && (
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                                {task.task_type}
                              </span>
                            )}
                            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', TASK_STATUS_STYLE[task.status])}>
                              {task.status}
                            </span>
                          </div>
                          <p className={cn('mt-1 text-sm font-medium', task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-800')}>
                            {task.title}
                          </p>

                          <div className="mt-2 flex items-center gap-2">
                            {assignee && (
                              <div className="flex items-center gap-1.5">
                                <Avatar name={assignee.full_name} size="xs" />
                                <span className="text-xs text-slate-500">{assignee.full_name}</span>
                              </div>
                            )}
                            {task.due_date && (
                              <span className="text-[11px] text-slate-400">· Due {formatDate(task.due_date)}</span>
                            )}
                          </div>

                          {task.notes && (
                            <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Notes</p>
                              <p className="text-xs text-slate-600 leading-relaxed">{task.notes}</p>
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
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                              title="Update"
                            >
                              <Edit3 size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => deleteSubTask(task.id, job.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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
          <div className="border-t border-slate-100 px-6 py-4 flex flex-wrap gap-2">
            <button
              onClick={handleCompleteJob}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 size={15} /> Mark Complete
            </button>
            <button
              onClick={handleCancelJob}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
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

// ── Create Job Modal ──────────────────────────────────────────────────────────

function CreateJobModal({
  onClose,
  allowedProfiles,
  userId,
}: {
  onClose: () => void
  allowedProfiles: ReturnType<typeof useProfileStore['getState']>['profiles']
  userId: string
}) {
  const { createJob } = useTeamJobStore()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', head_id: '', due_date: '',
  })
  const [subTasks, setSubTasks] = useState([
    { title: '', task_type: '', assignee_id: '', due_date: '' },
  ])

  function addRow() {
    setSubTasks((s) => [...s, { title: '', task_type: '', assignee_id: '', due_date: '' }])
  }
  function removeRow(i: number) {
    setSubTasks((s) => s.filter((_, idx) => idx !== i))
  }
  function updateRow(i: number, key: string, val: string) {
    setSubTasks((s) => s.map((r, idx) => idx === i ? { ...r, [key]: val } : r))
  }

  async function handleSubmit() {
    if (!form.title.trim()) return
    const validTasks = subTasks.filter((t) => t.title.trim() && t.assignee_id)
    setSaving(true)
    await createJob(
      {
        title: form.title.trim(),
        description: form.description.trim() || null,
        head_id: form.head_id || null,
        due_date: form.due_date || null,
      },
      validTasks.map((t) => ({
        title: t.title.trim(),
        task_type: t.task_type.trim() || null,
        assignee_id: t.assignee_id,
        due_date: t.due_date || null,
      })),
    )
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl my-auto">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-800">New Team Job</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Job details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Site Inspection at Andheri Branch"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Brief overview of the job..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Task Head</label>
                <select
                  value={form.head_id}
                  onChange={(e) => setForm((f) => ({ ...f, head_id: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select coordinator</option>
                  {allowedProfiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>

          {/* Sub-tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Sub-tasks</p>
              <button
                onClick={addRow}
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-200"
              >
                <Plus size={12} /> Add Row
              </button>
            </div>

            <div className="space-y-3">
              {subTasks.map((row, i) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={row.title}
                      onChange={(e) => updateRow(i, 'title', e.target.value)}
                      placeholder={`Sub-task ${i + 1} title *`}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    {subTasks.length > 1 && (
                      <button onClick={() => removeRow(i)} className="text-slate-400 hover:text-red-500">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={row.task_type}
                      onChange={(e) => updateRow(i, 'task_type', e.target.value)}
                      placeholder="Type (e.g. Site Survey)"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <select
                      value={row.assignee_id}
                      onChange={(e) => updateRow(i, 'assignee_id', e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Assignee *</option>
                      {allowedProfiles.map((p) => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={row.due_date}
                      onChange={(e) => updateRow(i, 'due_date', e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.title.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Plus size={15} />
            {saving ? 'Creating…' : 'Create Team Job'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── My Sub-task Row ───────────────────────────────────────────────────────────

function MySubTaskRow({
  task,
  job,
  onUpdate,
  onOpenJob,
  onToggleStatus,
}: {
  task: TeamJobTask
  job: TeamJob
  onUpdate: (t: TeamJobTask) => void
  onOpenJob: (j: TeamJob) => void
  onToggleStatus: (t: TeamJobTask) => void
}) {
  const today    = todayLocalISO()
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'Completed'
  const StatusIcon = TASK_STATUS_ICON[task.status]
  const canToggle = job.status === 'active'

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-colors',
        isOverdue
          ? 'border-red-100 bg-red-50/30'
          : task.status === 'Completed'
            ? 'border-emerald-100 bg-emerald-50/30'
            : 'border-slate-100 bg-white',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status icon */}
        {canToggle ? (
          <button
            onClick={() => onToggleStatus(task)}
            title="Click to update status"
            className={cn(
              'mt-0.5 shrink-0 transition-colors',
              task.status === 'Completed'
                ? 'text-emerald-500 hover:text-slate-300'
                : 'text-slate-400 hover:text-emerald-400',
              task.status === 'In progress' && 'text-blue-500 hover:text-emerald-500',
            )}
          >
            <StatusIcon size={17} />
          </button>
        ) : (
          <StatusIcon
            size={17}
            className={cn(
              'mt-0.5 shrink-0',
              task.status === 'Completed'   ? 'text-emerald-500' :
              task.status === 'In progress' ? 'text-blue-500'    : 'text-slate-400',
            )}
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Job context + type chips */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <button
              onClick={() => onOpenJob(job)}
              className="rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600 transition-colors truncate max-w-[160px]"
              title={job.title}
            >
              {job.title}
            </button>
            {task.task_type && (
              <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-500 uppercase tracking-wide">
                {task.task_type}
              </span>
            )}
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', TASK_STATUS_STYLE[task.status])}>
              {task.status}
            </span>
          </div>

          {/* Sub-task title */}
          <p className={cn('text-sm font-semibold leading-snug', task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-800')}>
            {task.title}
          </p>

          {/* Due date */}
          {task.due_date && (
            <div className={cn('flex items-center gap-1 mt-1.5 text-xs font-medium', isOverdue ? 'text-red-500' : 'text-slate-400')}>
              {isOverdue && <AlertCircle size={11} className="shrink-0" />}
              <span>{isOverdue ? 'Overdue · ' : 'Due '}{formatDate(task.due_date)}</span>
            </div>
          )}

          {/* Notes */}
          {task.notes && (
            <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Notes</p>
              <p className="text-xs text-slate-600 leading-relaxed">{task.notes}</p>
            </div>
          )}
        </div>

        {/* Update button */}
        {task.status !== 'Completed' && job.status === 'active' && (
          <button
            onClick={() => onUpdate(task)}
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <Edit3 size={12} /> Update
          </button>
        )}
      </div>
    </div>
  )
}

// ── Job Card ──────────────────────────────────────────────────────────────────

function JobCard({
  job,
  profiles,
  onClick,
}: {
  job: TeamJob
  profiles: ReturnType<typeof useProfileStore['getState']>['profiles']
  onClick: () => void
}) {
  const tasks     = job.tasks ?? []
  const completed = tasks.filter((t) => t.status === 'Completed').length
  const pct       = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
  const head      = profiles.find((p) => p.id === job.head_id)
  const today     = todayLocalISO()
  const isOverdue = job.due_date && job.due_date < today && job.status === 'active'

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-2xl border border-slate-100 bg-white p-5 shadow-sm text-left transition-all hover:shadow-md hover:border-slate-200"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', JOB_STATUS_STYLE[job.status])}>
              {job.status}
            </span>
            {isOverdue && (
              <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                <AlertCircle size={9} /> Overdue
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-800 leading-snug truncate">{job.title}</h3>
          {job.description && (
            <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{job.description}</p>
          )}
        </div>
        <ChevronRight size={16} className="shrink-0 text-slate-300 group-hover:text-slate-500 transition-colors mt-0.5" />
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {completed}/{tasks.length} sub-tasks
          </p>
          <p className="text-[10px] font-bold text-slate-500">{pct}%</p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={cn('h-full rounded-full', pct === 100 ? 'bg-emerald-500' : 'bg-blue-500')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {head && (
            <div className="flex items-center gap-1.5">
              <Avatar name={head.full_name} size="xs" />
              <span className="text-[11px] text-slate-500 font-medium">{head.full_name}</span>
              <span className="text-[10px] rounded bg-amber-100 text-amber-700 px-1.5 py-0.5 font-semibold">Head</span>
            </div>
          )}
        </div>
        {job.due_date && (
          <p className={cn('text-[11px] font-medium', isOverdue ? 'text-red-500' : 'text-slate-400')}>
            {formatDate(job.due_date)}
          </p>
        )}
      </div>
    </button>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function TeamJobs() {
  const { user, role } = useAuth()
  const { jobs, fetchJobs, isLoading } = useTeamJobStore()
  const profiles = useProfileStore((s) => s.profiles)
  const { allowedProfiles, allowedIds } = useRBACFilter()

  const [selectedJob, setSelectedJob]   = useState<TeamJob | null>(null)
  const [showCreate, setShowCreate]     = useState(false)
  const [viewMode, setViewMode]         = useState<'jobs' | 'mine'>('jobs')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all')
  const [updatingMyTask, setUpdatingMyTask] = useState<TeamJobTask | null>(null)

  const isManagerOrAbove = useMemo(() => {
    if (!role) return false
    return ROLE_ORDER[role] >= ROLE_ORDER.manager
  }, [role])

  useEffect(() => {
    fetchJobs()
  }, [])

  // Keep selected job in sync with store updates
  useEffect(() => {
    if (selectedJob) {
      const updated = jobs.find((j) => j.id === selectedJob.id)
      if (updated) setSelectedJob(updated)
    }
  }, [jobs])

  // Visible if the user is directly involved (creator/head/assignee), or if the job's
  // creator/head/any assignee falls within this user's RBAC-scoped team (branch/reporting-chain-aware,
  // same rule EmployeeReports/JobDirections/SpecialTasks use — not a blanket "can see everything" flag).
  const myJobs = useMemo(() => {
    if (!user) return []
    return jobs.filter((j) =>
      j.created_by === user.id ||
      j.head_id    === user.id ||
      (j.tasks ?? []).some((t) => t.assignee_id === user.id) ||
      allowedIds.has(j.created_by ?? '') ||
      allowedIds.has(j.head_id ?? '') ||
      (j.tasks ?? []).some((t) => t.assignee_id && allowedIds.has(t.assignee_id))
    )
  }, [jobs, user, allowedIds])

  const filteredJobs = useMemo(() => {
    if (statusFilter === 'all') return myJobs
    return myJobs.filter((j) => j.status === statusFilter)
  }, [myJobs, statusFilter])

  const mySubTaskList = useMemo(() => {
    if (!user) return []
    const result: Array<{ task: TeamJobTask; job: TeamJob }> = []
    for (const job of myJobs) {
      for (const task of (job.tasks ?? [])) {
        if (task.assignee_id === user.id) result.push({ task, job })
      }
    }
    return result.sort((a, b) => {
      if (a.task.status === 'Completed' && b.task.status !== 'Completed') return 1
      if (a.task.status !== 'Completed' && b.task.status === 'Completed') return -1
      if (!a.task.due_date) return 1
      if (!b.task.due_date) return -1
      return a.task.due_date.localeCompare(b.task.due_date)
    })
  }, [myJobs, user])

  const filteredMySubTasks = useMemo(() => {
    if (statusFilter === 'all') return mySubTaskList
    return mySubTaskList.filter(({ job }) => job.status === statusFilter)
  }, [mySubTaskList, statusFilter])

  const activeCount    = myJobs.filter((j) => j.status === 'active').length
  const completedCount = myJobs.filter((j) => j.status === 'completed').length
  const mySubTasks     = useMemo(
    () => myJobs.reduce((acc, j) => acc + (j.tasks ?? []).filter((t) => t.assignee_id === user?.id).length, 0),
    [myJobs, user],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Jobs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Collaborative jobs split into individual sub-tasks</p>
        </div>
        {isManagerOrAbove && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> New Team Job
          </button>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard label="Total Jobs"    value={myJobs.length}  icon={Briefcase}    color="text-blue-600"    bg="bg-blue-50" />
        <KPICard label="Active"        value={activeCount}    icon={Clock}        color="text-amber-600"   bg="bg-amber-50" />
        <KPICard label="Completed"     value={completedCount} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <KPICard label="My Sub-tasks"  value={mySubTasks}     icon={Users}        color="text-indigo-600"  bg="bg-indigo-50" />
      </div>

      {/* View mode toggle */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setViewMode('jobs')}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            viewMode === 'jobs'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
          )}
        >
          <Briefcase size={14} /> All Jobs
        </button>
        <button
          onClick={() => setViewMode('mine')}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            viewMode === 'mine'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
          )}
        >
          <CheckSquare size={14} /> My Sub-tasks
          {mySubTaskList.length > 0 && (
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
              viewMode === 'mine' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700',
            )}>
              {mySubTaskList.length}
            </span>
          )}
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['all', 'active', 'completed', 'cancelled'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors',
              statusFilter === s
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="text-sm font-medium">Loading team jobs…</div>
        </div>
      ) : viewMode === 'mine' ? (
        filteredMySubTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <CheckSquare size={36} className="opacity-25 mb-3" />
            <p className="text-sm font-medium">
              {statusFilter === 'all' ? 'You have no sub-tasks assigned to you' : `No sub-tasks in ${statusFilter} jobs`}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {filteredMySubTasks.map(({ task, job }) => (
              <MySubTaskRow
                key={task.id}
                task={task}
                job={job}
                onUpdate={(t) => setUpdatingMyTask(t)}
                onOpenJob={(j) => setSelectedJob(j)}
                onToggleStatus={(t) => useTeamJobStore.getState().updateSubTask(t.id, { status: nextSubTaskStatus(t.status) })}
              />
            ))}
          </div>
        )
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Users size={36} className="opacity-25 mb-3" />
          <p className="text-sm font-medium">
            {statusFilter === 'all' ? 'No team jobs yet' : `No ${statusFilter} jobs`}
          </p>
          {isManagerOrAbove && statusFilter === 'all' && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              <Plus size={14} /> Create the first team job
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              profiles={profiles}
              onClick={() => setSelectedJob(job)}
            />
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selectedJob && (
        <TeamJobDetailPanel
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          userId={user?.id ?? ''}
          isManagerOrAbove={isManagerOrAbove}
          profiles={profiles}
          allowedProfiles={allowedProfiles}
          allowedIds={allowedIds}
        />
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateJobModal
          onClose={() => setShowCreate(false)}
          allowedProfiles={allowedProfiles}
          userId={user?.id ?? ''}
        />
      )}

      {/* Update sub-task from My Sub-tasks view */}
      {updatingMyTask && (
        <UpdateSubTaskModal
          task={updatingMyTask}
          onClose={() => setUpdatingMyTask(null)}
          onSave={(status, notes) => useTeamJobStore.getState().updateSubTask(updatingMyTask.id, { status, notes })}
        />
      )}
    </div>
  )
}
