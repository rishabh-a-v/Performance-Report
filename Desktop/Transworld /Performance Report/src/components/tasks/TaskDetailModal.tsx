import { useState, useEffect } from 'react'
import {
  X, Calendar, Compass, ListTodo, CheckCircle2, Circle, SendHorizonal
} from 'lucide-react'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useChangeRequestStore } from '@/store/changeRequestStore'
import { useAuth } from '@/contexts/AuthContext'
import { PROFILES } from '@/lib/mockData'
import { cn, formatDate } from '@/lib/utils'
import type { JobDirection, SpecialTask } from '@/types/database'

interface Props {
  item: { kind: 'jd'; data: JobDirection } | { kind: 'st'; data: SpecialTask } | null
  onClose: () => void
}

export function TaskDetailModal({ item, onClose }: Props) {
  if (!item) return null

  const isJD = item.kind === 'jd'
  const isSentForReview = isJD && item.data.status === 'submitted'
  const { user } = useAuth()
  const { addRequest, requests } = useChangeRequestStore()
  
  // Fetch milestones for JD
  const milestones = isJD 
    ? useJobDirectionStore.getState().getMilestonesForDirection(item.data.id) 
    : []

  const employee = PROFILES.find((p) => p.id === (isJD ? (item.data as JobDirection).employee_id : (item.data as SpecialTask).assigned_to))
  const manager = PROFILES.find((p) => p.id === (isJD ? (item.data as JobDirection).manager_id : (item.data as SpecialTask).assigned_by))

  // Editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [editTargetValue, setEditTargetValue] = useState('')

  // Date change request state
  const [showDateRequest, setShowDateRequest] = useState(false)
  const [requestedDate, setRequestedDate] = useState('')
  const [requestReason, setRequestReason] = useState('')
  const [dateRequestSent, setDateRequestSent] = useState(false)

  const pendingDateRequest = requests.find(
    (r) => r.task_id === item.data.id && r.status === 'pending'
  )

  useEffect(() => {
    if (item) {
      if (item.kind === 'jd') {
        const jd = item.data as JobDirection
        const displayTitle = jd.pendingEdits?.title ?? jd.title
        const displayDesc = jd.pendingEdits?.description ?? jd.description ?? ''
        const displayTarget = jd.pendingEdits ? String(jd.pendingEdits.target_value ?? '') : String(jd.target_value ?? '')
        setEditTitle(displayTitle)
        setEditDesc(displayDesc)
        setEditTargetValue(displayTarget)
      } else {
        setEditTitle(item.data.title)
        setEditDesc(item.data.description ?? '')
        setEditPriority((item.data as SpecialTask).priority)
      }
    }
  }, [item, isEditing])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!item) return
    if (isJD) {
      useJobDirectionStore.getState().updateDirection(item.data.id, {
        title: editTitle.trim(),
        description: editDesc.trim() || null,
        target_value: editTargetValue ? parseFloat(editTargetValue) : null,
      })
    } else {
      useSpecialTaskStore.getState().updateTask(item.data.id, {
        title: editTitle.trim(),
        description: editDesc.trim() || null,
        priority: editPriority,
      })
    }
    setIsEditing(false)
    onClose()
  }

  function handleSubmitDateRequest() {
    if (!requestedDate || !requestReason.trim() || !user || !item) return
    addRequest({
      task_id: item.data.id,
      task_title: item.data.title,
      requested_by_id: user.id,
      requested_by_name: user.full_name,
      current_date: item.data.due_date ?? null,
      requested_date: requestedDate,
      reason: requestReason.trim(),
    })
    setShowDateRequest(false)
    setRequestedDate('')
    setRequestReason('')
    setDateRequestSent(true)
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
            {!isEditing && !isSentForReview && (
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
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Title *</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 resize-none focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {isJD ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Value</label>
                  <input
                    type="number"
                    value={editTargetValue}
                    onChange={(e) => setEditTargetValue(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              )}
            </div>

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
            {/* Title */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 leading-snug">{item.data.title}</h3>
                {item.data.description && (
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed bg-slate-50/55 rounded-lg p-3 border border-slate-100">
                    {item.data.description}
                  </p>
                )}
              </div>

              {isJD && (item.data as JobDirection).status === 'submitted' && (item.data as JobDirection).pendingEdits && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-700 space-y-1.5 shadow-sm">
                  <p className="font-semibold text-[11px] text-amber-800 uppercase tracking-wide">Proposed Edits (Awaiting Approval)</p>
                  <div className="space-y-1 text-amber-800/90 font-medium">
                    {(item.data as JobDirection).pendingEdits?.title !== (item.data as JobDirection).title && (
                      <p>· Title: <span className="font-semibold text-slate-800">{(item.data as JobDirection).pendingEdits?.title}</span></p>
                    )}
                    {(item.data as JobDirection).pendingEdits?.description !== (item.data as JobDirection).description && (
                      <p>· Description: <span className="font-semibold text-slate-800">{(item.data as JobDirection).pendingEdits?.description || 'None'}</span></p>
                    )}
                    {(item.data as JobDirection).pendingEdits?.target_value !== (item.data as JobDirection).target_value && (
                      <p>· Target Value: <span className="font-semibold text-slate-800">
                        {(() => {
                          const jd = item.data as JobDirection
                          const v = jd.pendingEdits?.target_value
                          if (v === null || v === undefined) return '—'
                          if (jd.unit === 'INR') return `₹${v.toLocaleString('en-IN')}`
                          return `${v.toLocaleString('en-IN')} ${jd.unit ?? ''}`
                        })()}
                      </span></p>
                    )}
                  </div>
                </div>
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
                        draft:     'bg-slate-100 text-slate-500',
                        active:    'bg-blue-100 text-blue-700',
                        submitted: 'bg-amber-100 text-amber-700',
                        approved:  'bg-emerald-100 text-emerald-700',
                        rejected:  'bg-red-100 text-red-700',
                        completed: 'bg-slate-100 text-slate-600',
                      }[item.data.status as string]
                    : {
                        pending:     'bg-slate-100 text-slate-600',
                        in_progress: 'bg-blue-100 text-blue-700',
                        on_hold:     'bg-amber-100 text-amber-700',
                        completed:   'bg-emerald-100 text-emerald-700',
                      }[item.data.status as string]
                )}>
                  {isJD 
                    ? {
                        draft:     'Draft',
                        active:    'Active',
                        submitted: 'Under Review',
                        approved:  'Approved',
                        rejected:  'Changes Needed',
                        completed: 'Completed',
                      }[item.data.status as string]
                    : {
                        pending:     'Pending',
                        in_progress: 'In Progress',
                        on_hold:     'On Hold',
                        completed:   'Completed',
                      }[item.data.status as string]
                  }
                </span>
              </div>

              {/* Priority/Progress type */}
              <div className="space-y-1">
                {isJD ? (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Progress Type</span>
                    <span className="font-semibold text-slate-700 uppercase text-[10px] tracking-wide">
                      {(item.data as JobDirection).progress_type}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Priority</span>
                    <span className={cn(
                      'inline-block rounded px-1.5 py-0.5 font-bold uppercase text-[9px] tracking-wide',
                      {
                        low:      'bg-slate-100 text-slate-500',
                        medium:   'bg-blue-50 text-blue-600',
                        high:     'bg-amber-50 text-amber-700',
                        critical: 'bg-red-50 text-red-700',
                      }[(item.data as SpecialTask).priority]
                    )}>
                      {(item.data as SpecialTask).priority}
                    </span>
                  </>
                )}
              </div>

              {/* Employee */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Assigned To</span>
                <span className="font-medium text-slate-800">{employee?.full_name ?? '—'}</span>
                {employee?.designation && <span className="block text-[10px] text-slate-400">{employee.designation}</span>}
              </div>

              {/* Manager / Assigner */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isJD ? 'Manager / Reviewer' : 'Assigned By'}
                </span>
                <span className="font-medium text-slate-800">{manager?.full_name ?? '—'}</span>
                {manager?.designation && <span className="block text-[10px] text-slate-400">{manager.designation}</span>}
              </div>

              {/* Current Value / Target (for JD only) */}
              {isJD && (item.data as JobDirection).target_value !== null && (
                <div className="space-y-1 col-span-2 border-t border-slate-100/60 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Progress</span>
                  <span className="font-semibold text-slate-700">
                    {(() => {
                      const jd = item.data as JobDirection
                      const val = (v: number | null) => {
                        if (v === null) return '—'
                        if (jd.unit === 'INR') return `₹${v.toLocaleString('en-IN')}`
                        return `${v.toLocaleString('en-IN')} ${jd.unit ?? ''}`
                      }
                      return `${val(jd.current_value)} / ${val(jd.target_value)} (${jd.progress_percentage.toFixed(0)}%)`
                    })()}
                  </span>
                </div>
              )}
            </div>

            {/* Due Date with Request Change Workflow */}
            <div className="space-y-1 border-t border-slate-100 pt-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Due Date</span>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700">
                    {item.data.due_date ? formatDate(item.data.due_date) : '—'}
                  </span>
                </div>
                {!pendingDateRequest && !showDateRequest && !isSentForReview && (
                  <button
                    onClick={() => { setShowDateRequest(true); setDateRequestSent(false) }}
                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Request Change
                  </button>
                )}
              </div>

              {/* Pending request badge */}
              {pendingDateRequest && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 space-y-0.5">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Pending Approval from Higher Employee</p>
                  <p className="text-xs text-amber-800">
                    Requested Date: <strong>{formatDate(pendingDateRequest.requested_date)}</strong>
                  </p>
                  <p className="text-[10px] text-amber-600 italic line-clamp-2">Reason: "{pendingDateRequest.reason}"</p>
                </div>
              )}

              {/* Sent confirmation */}
              {dateRequestSent && !pendingDateRequest && (
                <p className="text-[10px] text-emerald-600 font-semibold mt-1.5">✓ Request sent for approval</p>
              )}

              {/* Request form */}
              {showDateRequest && (
                <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">New Due Date</p>
                  <input
                    type="date"
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <textarea
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Reason for change..."
                    rows={2}
                    className="w-full resize-none rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmitDateRequest}
                      disabled={!requestedDate || !requestReason.trim()}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
                    >
                      <SendHorizonal size={11} />
                      Send for Approval
                    </button>
                    <button
                      onClick={() => { setShowDateRequest(false); setRequestedDate(''); setRequestReason('') }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] text-slate-500 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Job Direction Review Notes (if present) */}
            {isJD && (item.data as JobDirection).review_notes && (
              <div className={cn(
                'rounded-xl border p-3.5 text-xs space-y-1',
                (item.data as JobDirection).status === 'rejected'
                  ? 'bg-red-50 border-red-100 text-red-700'
                  : 'bg-emerald-50 border-emerald-100 text-emerald-700'
              )}>
                <p className="font-bold">Manager Feedback</p>
                <p className="opacity-90">{(item.data as JobDirection).review_notes}</p>
              </div>
            )}

            {/* Milestones Checklist (JD only) */}
            {isJD && milestones.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Milestones Checklist</span>
                <ul className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 divide-y divide-slate-100/60 overflow-hidden">
                  {milestones.map((ms) => (
                    <li key={ms.id} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
                      <span className={cn('shrink-0', ms.completed ? 'text-emerald-500' : 'text-slate-300')}>
                        {ms.completed ? <CheckCircle2 size={14} /> : <Circle size={14} className="stroke-[1.8]" />}
                      </span>
                      <span className={cn('text-xs flex-1 truncate', ms.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium')}>
                        {ms.title}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 tabular-nums">{ms.weight}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Date Information */}
            <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-400 font-medium pt-2">
              <div>Created: {formatDate(item.data.created_at)}</div>
              {item.data.updated_at && (
                <div className="text-right">Updated: {formatDate(item.data.updated_at)}</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
