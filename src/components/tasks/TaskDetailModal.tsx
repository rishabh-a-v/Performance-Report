import { useState, useEffect } from 'react'
import {
  X, Calendar, Compass, ListTodo, CheckCircle2, Circle
} from 'lucide-react'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/store/profileStore'
import { cn, formatDate } from '@/lib/utils'
import type { JobDirection, SpecialTask, TaskPriority } from '@/types/database'

const PRIORITY_ORDER: Record<TaskPriority, number> = { urgent: 3, high: 2, medium: 1, low: 0 }

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  urgent: 'bg-red-100 text-red-700',
  high:   'bg-amber-100 text-amber-700',
  medium: 'bg-blue-100 text-blue-700',
  low:    'bg-slate-100 text-slate-500',
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low',
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', PRIORITY_STYLES[priority])}>
      {PRIORITY_LABELS[priority]}
    </span>
  )
}

interface Props {
  item: { kind: 'jd'; data: JobDirection } | { kind: 'st'; data: SpecialTask } | null
  onClose: () => void
}

export function TaskDetailModal({ item, onClose }: Props) {
  const { user, role } = useAuth()
  const profiles = useProfileStore((s) => s.profiles)
  const directions = useJobDirectionStore((s) => s.directions)
  const tasks = useSpecialTaskStore((s) => s.tasks)

  const [progressValue, setProgressValue] = useState('')
  const [isLoggingProgress, setIsLoggingProgress] = useState(false)

  // Editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editWorkDetails, setEditWorkDetails] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editExpectedOutput, setEditExpectedOutput] = useState('')
  const [editDailyTarget, setEditDailyTarget] = useState('')
  const [editWeeklyTarget, setEditWeeklyTarget] = useState('')
  const [editMonthlyTarget, setEditMonthlyTarget] = useState('')
  const [editRemarks, setEditRemarks] = useState('')

  const [editTaskName, setEditTaskName] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium')

  useEffect(() => {
    if (item) {
      if (item.kind === 'jd') {
        const jdData = item.data as JobDirection
        setEditWorkDetails(jdData.work_details ?? '')
        setEditDescription(jdData.description ?? '')
        setEditExpectedOutput(jdData.expected_output ?? '')
        setEditDailyTarget(String(jdData.daily_target))
        setEditWeeklyTarget(String(jdData.weekly_target))
        setEditMonthlyTarget(String(jdData.monthly_target))
        setEditRemarks(jdData.remarks ?? '')
      } else {
        const stData = item.data as SpecialTask
        setEditTaskName(stData.task_name)
        setEditDueDate(stData.due_date ?? '')
        setEditRemarks(stData.remarks ?? '')
        setEditPriority(stData.priority ?? 'medium')
      }
    }
  }, [item, isEditing])

  if (!item) return null

  const isJD = item.kind === 'jd'
  const jd = isJD ? (directions.find((d) => d.id === item.data.id) || (item.data as JobDirection)) : null
  const st = !isJD ? (tasks.find((t) => t.id === item.data.id) || (item.data as SpecialTask)) : null

  async function handleLogProgress(e: React.FormEvent) {
    e.preventDefault()
    if (!jd || !progressValue) return
    const val = parseFloat(progressValue)
    if (isNaN(val) || val <= 0) return

    setIsLoggingProgress(true)
    await useJobDirectionStore.getState().updateProgress(jd.id, val)
    setProgressValue('')
    setIsLoggingProgress(false)
  }

  const employee = profiles.find((p) => p.id === (jd ? jd.employee_id : ''))
  const manager = profiles.find((p) => p.id === (jd ? jd.manager_id : st ? st.assigned_by : ''))
  const allAssignees = !isJD && st
    ? (st.assignees ?? []).map((a) => profiles.find((p) => p.id === a.employee_id)).filter(Boolean) as typeof profiles
    : []

  const isAssigner = !!(st && user?.id === st.assigned_by)
  const isAssignee = !!(st && st.assignees?.some((a) => a.employee_id === user?.id))
  const isJDAdmin = ['managing_director', 'executive_assistant', 'hr'].includes(user?.role ?? '')
  const isSTAdmin = ['managing_director', 'executive_assistant', 'hr', 'director'].includes(role ?? '')

  const canEdit = isJD
    ? (
        isJDAdmin ||
        (!!jd && jd.manager_id === user?.id) ||
        (!!jd && jd.employee_id === user?.id)
      )
    : (isAssignee || isAssigner || isSTAdmin)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!item) return
    if (isJD) {
      const isEmployee = !!(jd && user?.id === jd.employee_id)
      const isManagerOrAdmin = !!(jd && jd.manager_id === user?.id) || isJDAdmin
      // Only force back to "submitted" when the editor genuinely needs someone else's approval —
      // not when they're also the manager/admin who'd just be approving themselves.
      const statusUpdate = (isEmployee && !isManagerOrAdmin) ? { status: 'submitted' } : {}
      useJobDirectionStore.getState().updateDirection(item.data.id, {
        work_details: editWorkDetails.trim() || null,
        description: editDescription.trim() || null,
        expected_output: editExpectedOutput.trim() || null,
        daily_target: parseFloat(editDailyTarget) || 0,
        weekly_target: parseFloat(editWeeklyTarget) || 0,
        monthly_target: parseFloat(editMonthlyTarget) || 0,
        remarks: editRemarks.trim() || null,
        ...statusUpdate,
      })
    } else {
      const needsApproval = isAssignee && !isAssigner
      if (needsApproval) {
        useSpecialTaskStore.getState().updateTask(item.data.id, {
          pending_changes: {
            task_name: editTaskName.trim(),
            due_date: editDueDate || null,
            remarks: editRemarks.trim() || null,
            priority: editPriority,
          },
          approval_status: 'pending',
        })
      } else {
        useSpecialTaskStore.getState().updateTask(item.data.id, {
          task_name: editTaskName.trim(),
          due_date: editDueDate || null,
          remarks: editRemarks.trim() || null,
          priority: editPriority,
          pending_changes: null,
          approval_status: 'approved',
        })
      }
    }
    setIsEditing(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Main Container */}
      <div className="relative flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-slide-in">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {isJD ? (
              <>
                <Compass size={14} className="text-blue-500" />
                <span>Job Direction Details</span>
              </>
            ) : (
              <>
                <ListTodo size={14} className="text-slate-500" />
                <span>Special Task Details</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Edit Form or Static View */}
        {isEditing ? (
          <form onSubmit={handleSave} className="p-6 overflow-y-auto max-h-[70vh] space-y-4 text-slate-700">
            {isJD ? (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Work Details</label>
                  <textarea
                    required
                    value={editWorkDetails}
                    onChange={(e) => setEditWorkDetails(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 resize-none focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    placeholder="Add more context or details (optional)..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 resize-none focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expected Output</label>
                  <textarea
                    value={editExpectedOutput}
                    onChange={(e) => setEditExpectedOutput(e.target.value)}
                    rows={3}
                    placeholder="Describe what the result of this work should look like (optional)..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 resize-none focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Target</label>
                    <input
                      type="number"
                      value={editDailyTarget}
                      onChange={(e) => setEditDailyTarget(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weekly Target</label>
                    <input
                      type="number"
                      value={editWeeklyTarget}
                      onChange={(e) => setEditWeeklyTarget(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Target</label>
                    <input
                      type="number"
                      value={editMonthlyTarget}
                      onChange={(e) => setEditMonthlyTarget(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remarks</label>
                  <textarea
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 resize-none focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Task Name *</label>
                  <input
                    type="text"
                    required
                    value={editTaskName}
                    onChange={(e) => setEditTaskName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Date</label>
                    {editDueDate && (
                      <button
                        type="button"
                        onClick={() => setEditDueDate('')}
                        className="text-[10px] font-semibold text-red-500 hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remarks / Details</label>
                  <textarea
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 resize-none focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Priority</label>
                  <div className="flex gap-1.5">
                    {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setEditPriority(p)}
                        className={cn(
                          'flex-1 rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition-colors',
                          editPriority === p
                            ? cn(PRIORITY_STYLES[p], 'border-transparent')
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        )}
                      >
                        {PRIORITY_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          /* Static View Content */
          <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5 text-slate-700">
            {/* Title / Name */}
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-snug">
                {isJD ? 'Job Direction' : st?.task_name}
              </h3>
              {isJD && jd?.work_details && (
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed bg-slate-50/55 rounded-lg p-3 border border-slate-100">
                  {jd.work_details}
                </p>
              )}
              {isJD && (
                <div className="mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Description</span>
                  <p className={cn('text-xs leading-relaxed bg-slate-50/55 rounded-lg p-3 border border-slate-100 whitespace-pre-wrap', jd?.description ? 'text-slate-600' : 'text-slate-300 italic')}>
                    {jd?.description || 'No description added.'}
                  </p>
                </div>
              )}
              {isJD && jd?.expected_output && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expected Output</span>
                    {jd.expected_output_achieved ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <CheckCircle2 size={10} /> Achieved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        <Circle size={10} /> Not yet achieved
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed bg-slate-50/55 rounded-lg p-3 border border-slate-100 whitespace-pre-wrap text-slate-600">
                    {jd.expected_output}
                  </p>
                </div>
              )}
              {!isJD && st?.remarks && (
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed bg-slate-50/55 rounded-lg p-3 border border-slate-100">
                  {st.remarks}
                </p>
              )}
            </div>

            {/* Key-Value Details Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-b border-slate-100 py-4 text-xs">
              {/* Status */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status</span>
                <span className={cn(
                  'inline-block rounded-full px-2 py-0.5 font-semibold text-[10px]',
                  isJD
                    ? {
                        active:              'bg-blue-100 text-blue-700',
                        submitted:           'bg-amber-100 text-amber-700',
                        approved:            'bg-emerald-100 text-emerald-700',
                        rejected:            'bg-red-100 text-red-700',
                        completed:           'bg-slate-100 text-slate-600',
                        deletion_requested:  'bg-red-100 text-red-700',
                      }[jd?.status || ''] ?? 'bg-blue-100 text-blue-700'
                    : {
                        'Yet to start': 'bg-slate-100 text-slate-600',
                        'In progress':  'bg-blue-100 text-blue-700',
                        'Completed':    'bg-emerald-100 text-emerald-700',
                        'In review':    'bg-purple-100 text-purple-700',
                      }[st?.status as string]
                )}>
                  {isJD
                    ? ({
                        active:              'Active',
                        submitted:           'Under Review',
                        approved:            'Approved',
                        rejected:            'Changes Needed',
                        completed:           'Completed',
                        deletion_requested:  'Deletion Pending',
                      }[jd?.status || ''] ?? jd?.status)
                    : st?.status}
                </span>
              </div>

              {/* Priority (ST only) */}
              {!isJD && st && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Priority</span>
                  <PriorityBadge priority={st.priority ?? 'medium'} />
                </div>
              )}

              {/* Approval Status (ST only) */}
              {!isJD && st && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Approval Status</span>
                  <span className={cn(
                    'inline-block rounded-full px-2 py-0.5 font-semibold text-[10px]',
                    {
                      pending:  'bg-amber-100 text-amber-700',
                      approved: 'bg-emerald-100 text-emerald-700',
                      rejected: 'bg-red-100 text-red-700',
                    }[st.approval_status || 'approved']
                  )}>
                    {st.approval_status === 'pending' ? 'Pending Approval' : st.approval_status === 'rejected' ? 'Changes Requested' : 'Approved'}
                  </span>
                </div>
              )}

              {/* Employee / Assignees */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Assigned To</span>
                {isJD ? (
                  <span className="font-medium text-slate-800">{employee?.full_name ?? '—'}</span>
                ) : allAssignees.length === 0 ? (
                  <span className="font-medium text-slate-400">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {allAssignees.map((p) => (
                      <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {p.full_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Manager / Reviewer */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isJD ? 'Manager / Reviewer' : 'Assigned By'}
                </span>
                <span className="font-medium text-slate-800">{manager?.full_name ?? '—'}</span>
              </div>

              {/* Targets (JD only) */}
              {isJD && (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Daily Target</span>
                    <span className="font-medium text-slate-800">{jd?.daily_target ? `${jd.daily_completed} / ${jd.daily_target}` : '—'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Weekly Target</span>
                    <span className="font-medium text-slate-800">{jd?.weekly_target ? `${jd.weekly_completed} / ${jd.weekly_target}` : '—'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Monthly Target</span>
                    <span className="font-medium text-slate-800">{jd?.monthly_target ? `${jd.monthly_completed} / ${jd.monthly_target}` : '—'}</span>
                  </div>
                </>
              )}

              {/* Due Date & Date Created (ST only) */}
              {!isJD && (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Date Created</span>
                    <span className="font-medium text-slate-800">{st ? formatDate(st.created_at) : '—'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Due Date</span>
                    <span className="font-medium text-slate-800">{st?.due_date ? formatDate(st.due_date) : '—'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Remarks (JD only) */}
            {isJD && jd?.remarks && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs space-y-1">
                <p className="font-bold text-slate-500">Remarks</p>
                <p className="text-slate-700">{jd.remarks}</p>
              </div>
            )}

            {/* Log Progress Actions (JD only, for the assignee when active) */}
            {isJD && jd && user?.id === jd.employee_id && jd.status === 'active' && (
              <div className="border-t border-slate-100 pt-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Log Progress</span>
                <form onSubmit={handleLogProgress} className="flex gap-2">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Enter amount completed..."
                    value={progressValue}
                    onChange={(e) => setProgressValue(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoggingProgress}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shrink-0"
                  >
                    {isLoggingProgress ? 'Logging...' : 'Log Progress'}
                  </button>
                </form>
              </div>
            )}

            {/* Mark Expected Output as Achieved (JD only, for the assignee when active and an expected output exists) */}
            {isJD && jd && jd.expected_output && user?.id === jd.employee_id && jd.status === 'active' && (
              <div className="border-t border-slate-100 pt-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Expected Output</span>
                {jd.expected_output_achieved ? (
                  <button
                    onClick={() => useJobDirectionStore.getState().updateDirection(jd.id, { expected_output_achieved: false })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Mark as Not Achieved
                  </button>
                ) : (
                  <button
                    onClick={() => useJobDirectionStore.getState().updateDirection(jd.id, { expected_output_achieved: true })}
                    className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <CheckCircle2 size={12} className="inline mr-1.5 -mt-0.5" />
                    Mark as Achieved
                  </button>
                )}
              </div>
            )}

            {isJD && jd && (
              (() => {
                const isManager = jd.manager_id === user?.id
                const isAdmin = ['managing_director', 'executive_assistant', 'hr', 'director'].includes(role ?? '')
                const canDelete = isManager || isAdmin

                if (!canDelete) return null

                return (
                  <div className="border-t border-slate-100 pt-3.5 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Actions</span>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this Job Direction?')) {
                          useJobDirectionStore.getState().deleteDirection(jd.id)
                          onClose()
                        }
                      }}
                      className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
                    >
                      Delete Job Direction
                    </button>
                  </div>
                )
              })()
            )}

            {!isJD && st && (
              <div className="border-t border-slate-100 pt-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Actions</span>
                <div className="flex flex-wrap gap-2">
                  {st.approval_status === 'pending' && (
                    <p className="text-xs text-amber-600 font-semibold bg-amber-50 rounded-lg p-2.5 border border-amber-100 flex-1 text-center">
                      Awaiting details approval from manager before you can start or complete this task.
                    </p>
                  )}
                  {st.approval_status === 'rejected' && (
                    <div className="flex flex-col gap-1.5 flex-1">
                      <p className="text-xs text-red-600 font-semibold bg-red-50 rounded-lg p-2.5 border border-red-100 text-center">
                        Changes requested by manager: {st.rejection_note || 'No notes left.'}
                      </p>
                      <p className="text-[10px] text-slate-500 text-center">
                        Click "Edit" in the top right to make changes and submit for approval.
                      </p>
                    </div>
                  )}
                  {(st.approval_status === 'approved' || !st.approval_status) && (
                    <>
                      {isAssignee && st.status === 'Yet to start' && (
                        <button
                          onClick={() => { useSpecialTaskStore.getState().setStatus(st.id, 'In progress'); onClose() }}
                          className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                          Mark In Progress
                        </button>
                      )}
                      {isAssignee && st.status === 'In progress' && (
                        <button
                          onClick={() => { useSpecialTaskStore.getState().setStatus(st.id, 'In review'); onClose() }}
                          className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                        >
                          Submit for Review
                        </button>
                      )}
                      {isAssignee && st.status === 'In review' && (
                        <button
                          onClick={() => { useSpecialTaskStore.getState().setStatus(st.id, 'In progress'); onClose() }}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Undo Submit (back to In Progress)
                        </button>
                      )}
                      {isAssignee && st.status === 'Completed' && (
                        <button
                          onClick={() => { useSpecialTaskStore.getState().setStatus(st.id, 'In progress'); onClose() }}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Undo (back to In Progress)
                        </button>
                      )}
                      {isAssigner && st.status === 'In review' && (
                        <>
                          <button
                            onClick={() => { useSpecialTaskStore.getState().setStatus(st.id, 'Completed'); onClose() }}
                            className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                          >
                            ✓ Approve & Complete
                          </button>
                          <button
                            onClick={() => { useSpecialTaskStore.getState().setStatus(st.id, 'In progress'); onClose() }}
                            className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                          >
                            ✕ Request Revision
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Delete Task — assigner or admin only */}
                {(isAssigner || ['managing_director', 'executive_assistant', 'hr', 'director'].includes(role ?? '')) && (
                  <div className="border-t border-slate-100 pt-2">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this Special Task?')) {
                          useSpecialTaskStore.getState().deleteTask(st.id)
                          onClose()
                        }
                      }}
                      className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
                    >
                      Delete Special Task
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
