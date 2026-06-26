import { useState, useEffect } from 'react'
import {
  X, Calendar, Compass, ListTodo, CheckCircle2, Circle
} from 'lucide-react'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/store/profileStore'
import { cn, formatDate } from '@/lib/utils'
import type { JobDirection, SpecialTask } from '@/types/database'

interface Props {
  item: { kind: 'jd'; data: JobDirection } | { kind: 'st'; data: SpecialTask } | null
  onClose: () => void
}

export function TaskDetailModal({ item, onClose }: Props) {
  if (!item) return null

  const isJD = item.kind === 'jd'
  const { user } = useAuth()
  const profiles = useProfileStore((s) => s.profiles)

  const jd = isJD ? (item.data as JobDirection) : null
  const st = !isJD ? (item.data as SpecialTask) : null

  const employee = profiles.find((p) => p.id === (jd ? jd.employee_id : ''))
  const manager = profiles.find((p) => p.id === (jd ? jd.manager_id : st ? st.assigned_by : ''))
  const allAssignees = !isJD && st
    ? (st.assignees ?? []).map((a) => profiles.find((p) => p.id === a.employee_id)).filter(Boolean) as typeof profiles
    : []

  // Editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editWorkDetails, setEditWorkDetails] = useState('')
  const [editDailyTarget, setEditDailyTarget] = useState('')
  const [editWeeklyTarget, setEditWeeklyTarget] = useState('')
  const [editMonthlyTarget, setEditMonthlyTarget] = useState('')
  const [editRemarks, setEditRemarks] = useState('')

  const [editTaskName, setEditTaskName] = useState('')
  const [editDueDate, setEditDueDate] = useState('')

  useEffect(() => {
    if (item) {
      if (item.kind === 'jd') {
        const jdData = item.data as JobDirection
        setEditWorkDetails(jdData.work_details ?? '')
        setEditDailyTarget(String(jdData.daily_target))
        setEditWeeklyTarget(String(jdData.weekly_target))
        setEditMonthlyTarget(String(jdData.monthly_target))
        setEditRemarks(jdData.remarks ?? '')
      } else {
        const stData = item.data as SpecialTask
        setEditTaskName(stData.task_name)
        setEditDueDate(stData.due_date ?? '')
        setEditRemarks(stData.remarks ?? '')
      }
    }
  }, [item, isEditing])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!item) return
    if (isJD) {
      useJobDirectionStore.getState().updateDirection(item.data.id, {
        work_details: editWorkDetails.trim() || null,
        daily_target: parseFloat(editDailyTarget) || 0,
        weekly_target: parseFloat(editWeeklyTarget) || 0,
        monthly_target: parseFloat(editMonthlyTarget) || 0,
        remarks: editRemarks.trim() || null,
      })
    } else {
      useSpecialTaskStore.getState().updateTask(item.data.id, {
        task_name: editTaskName.trim(),
        due_date: editDueDate || null,
        remarks: editRemarks.trim() || null,
      })
    }
    setIsEditing(false)
    onClose()
  }

  const isAssigner = st && user?.id === st.assigned_by
  const isAssignee = st && st.assignees?.some((a) => a.employee_id === user?.id)

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
            {!isEditing && (
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Date</label>
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
                    ? 'bg-blue-100 text-blue-700'
                    : {
                        yet_to_start: 'bg-slate-100 text-slate-600',
                        in_progress:  'bg-blue-100 text-blue-700',
                        completed:    'bg-emerald-100 text-emerald-700',
                        cancelled:    'bg-red-100 text-red-600',
                        acknowledged: 'bg-teal-100 text-teal-700',
                      }[st?.status as string]
                )}>
                  {isJD ? jd?.status : st?.status}
                </span>
              </div>

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

            {/* Status Actions (ST only) */}
            {!isJD && st && (
              <div className="border-t border-slate-100 pt-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Actions</span>
                <div className="flex flex-wrap gap-2">
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
                      onClick={() => { useSpecialTaskStore.getState().setStatus(st.id, 'Completed'); onClose() }}
                      className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                      Mark Complete
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
                  {isAssigner && st.status === 'Completed' && (
                    <button
                      onClick={() => { useSpecialTaskStore.getState().setStatus(st.id, 'Acknowledged'); onClose() }}
                      className="flex-1 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition-colors"
                    >
                      ✓ Acknowledge
                    </button>
                  )}
                  {isAssigner && !['Completed', 'Acknowledged', 'Cancelled'].includes(st.status) && (
                    <button
                      onClick={() => { useSpecialTaskStore.getState().setStatus(st.id, 'Cancelled'); onClose() }}
                      className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Cancel Task
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
