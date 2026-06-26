import { useState } from 'react'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/store/profileStore'
import { usePermissionStore } from '@/store/permissionStore'
import { Card, CardTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import {
  Compass, CheckCircle2, XCircle, MessageSquare,
  X, Check, CheckSquare, Clock, Trash2,
} from 'lucide-react'
import type { JobDirection, SpecialTask } from '@/types/database'

const ADMIN_ROLES: readonly string[] = ['managing_director', 'executive_assistant', 'hr']

export function ApprovalCenter() {
  const { user, role } = useAuth()
  const directions = useJobDirectionStore((s) => s.directions)
  const { approveDirection, rejectDirection, approveDeletion, rejectDeletion } = useJobDirectionStore()
  const tasks = useSpecialTaskStore((s) => s.tasks)
  const { setStatus } = useSpecialTaskStore()
  const profiles = useProfileStore((s) => s.profiles)
  const canApproveJDs   = usePermissionStore((s) => s.permissions?.can_approve_job_directions ?? false)
  const canApproveTasks = usePermissionStore((s) => s.permissions?.can_approve_tasks ?? false)

  const [activeTab, setActiveTab] = useState<'jd' | 'tasks' | 'deletions'>('jd')
  const [showHistory, setShowHistory] = useState(false)

  // JD action state
  const [activeJdAction, setActiveJdAction] = useState<'approve' | 'reject' | null>(null)
  const [activeJdId, setActiveJdId] = useState<string | null>(null)
  const [jdNotes, setJdNotes] = useState('')

  // Task action state
  const [activeTaskAction, setActiveTaskAction] = useState<'acknowledge' | 'revise' | 'approve_change' | 'reject_change' | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [taskNotes, setTaskNotes] = useState('')

  if (!user) return null

  const isAdmin = ADMIN_ROLES.includes(role ?? '')

  // ── JD Approvals ────────────────────────────────────────────────────────────
  const pendingJDs = directions.filter((d) => {
    if (d.status !== 'submitted') return false
    if (isAdmin) return true
    return d.manager_id === user.id
  })
  const historyJDs = directions.filter((d) => {
    if (!['active', 'completed', 'approved', 'rejected'].includes(d.status)) return false
    if (isAdmin) return true
    return d.manager_id === user.id
  })

  // ── Deletion Requests ────────────────────────────────────────────────────────
  // Visible to: the employee's reporting manager (manager_id) OR MD/EA/HR
  const pendingDeletions = directions.filter((d) => {
    if (d.status !== 'deletion_requested') return false
    return isAdmin || d.manager_id === user.id
  })

  function handleJDConfirm(jdId: string) {
    if (!activeJdAction || !user) return
    if (activeJdAction === 'approve') approveDirection(jdId, user.id, jdNotes)
    else rejectDirection(jdId, jdNotes)
    setActiveJdAction(null); setActiveJdId(null); setJdNotes('')
  }

  // ── Task Approvals ───────────────────────────────────────────────────────────
  const reporteeIds = new Set(profiles.filter((p) => p.manager_id === user.id).map((p) => p.id))

  // Detail changes pending approval (by supervisor or MD/EA)
  const pendingTaskChanges = tasks.filter((t) => {
    if (t.approval_status !== 'pending') return false
    const assigneeIds = t.assignees?.map((a) => a.employee_id) ?? []
    if (isAdmin) return true
    return assigneeIds.some((id) => reporteeIds.has(id))
  })

  const pendingTaskApprovals = tasks.filter((t) => {
    if (t.status !== 'In review') return false
    const assigneeIds = t.assignees?.map((a) => a.employee_id) ?? []
    if (isAdmin) return true
    return assigneeIds.some((id) => reporteeIds.has(id))
  })

  const historyTaskApprovals = tasks.filter((t) => {
    if (t.status !== 'Completed') return false
    const assigneeIds = t.assignees?.map((a) => a.employee_id) ?? []
    if (isAdmin) return true
    return assigneeIds.some((id) => reporteeIds.has(id))
  })

  function handleTaskConfirm(taskId: string) {
    if (!activeTaskAction || !user) return
    if (activeTaskAction === 'acknowledge') {
      setStatus(taskId, 'Completed')
    } else if (activeTaskAction === 'revise') {
      setStatus(taskId, 'In progress')
    } else if (activeTaskAction === 'approve_change') {
      useSpecialTaskStore.getState().approveTaskDetailChange(taskId, user.id)
    } else if (activeTaskAction === 'reject_change') {
      useSpecialTaskStore.getState().rejectTaskDetailChange(taskId, user.id, taskNotes)
    }
    setActiveTaskAction(null); setActiveTaskId(null); setTaskNotes('')
  }

  const hasJDAccess   = canApproveJDs
  const hasTaskAccess = canApproveTasks

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Approval Center</h1>
          <p className="text-sm text-slate-500">Review and action submissions from your team</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-white border border-slate-200 rounded-lg px-3.5 py-2 shadow-sm transition-colors self-start sm:self-auto"
        >
          {showHistory ? 'View Pending' : 'View History'}
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-slate-200">
        {hasJDAccess && (
          <button
            onClick={() => setActiveTab('jd')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
              activeTab === 'jd'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            <Compass size={14} />
            Job Directions
            {pendingJDs.length > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                {pendingJDs.length}
              </span>
            )}
          </button>
        )}
        {hasTaskAccess && (
          <button
            onClick={() => setActiveTab('tasks')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
              activeTab === 'tasks'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            <CheckSquare size={14} />
            Tasks
            {pendingTaskApprovals.length + pendingTaskChanges.length > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                {pendingTaskApprovals.length + pendingTaskChanges.length}
              </span>
            )}
          </button>
        )}
        {(hasJDAccess || isAdmin) && (
          <button
            onClick={() => setActiveTab('deletions')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
              activeTab === 'deletions'
                ? 'border-red-600 text-red-700'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            <Trash2 size={14} />
            Deletion Requests
            {pendingDeletions.length > 0 && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                {pendingDeletions.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ── JD Approvals ──────────────────────────────────────────────────── */}
      {activeTab === 'jd' && hasJDAccess && (
        showHistory ? (
          <Card padding={false}>
            <div className="border-b border-slate-100 p-4">
              <CardTitle>JD Approval History</CardTitle>
            </div>
            <div className="divide-y divide-slate-100">
              {historyJDs.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">No review history found.</div>
              ) : historyJDs.map((jd) => {
                const emp = profiles.find((p) => p.id === jd.employee_id)
                return (
                  <div key={jd.id} className="p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp?.full_name ?? '?'} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{emp?.full_name}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{emp?.role?.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        ['active', 'completed', 'approved'].includes(jd.status) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      )}>
                        {['active', 'completed', 'approved'].includes(jd.status) ? 'Approved' : jd.status}
                      </span>
                    </div>
                    <JDDetailBlock jd={jd} />
                    {jd.remarks && <RemarksBlock text={jd.remarks} />}
                  </div>
                )
              })}
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingJDs.length === 0 ? (
              <EmptyState icon={<Compass size={32} className="mx-auto opacity-30 mb-2" />} message="No pending Job Directions for review." />
            ) : pendingJDs.map((jd) => {
              const emp = profiles.find((p) => p.id === jd.employee_id)
              const isEditing = activeJdId === jd.id

              return (
                <Card key={jd.id} className="p-5 space-y-4">
                  <EmployeeHeader profile={emp} />
                  <JDDetailBlock jd={jd} />

                  {isEditing && activeJdAction ? (
                    <ActionConfirm
                      action={activeJdAction === 'approve' ? 'approve' : 'reject'}
                      notes={jdNotes}
                      onNotesChange={setJdNotes}
                      onCancel={() => { setActiveJdAction(null); setActiveJdId(null) }}
                      onConfirm={() => handleJDConfirm(jd.id)}
                    />
                  ) : (
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setActiveJdId(jd.id); setActiveJdAction('reject'); setJdNotes('') }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <X size={14} /> Request Changes
                      </button>
                      <button
                        onClick={() => { setActiveJdId(jd.id); setActiveJdAction('approve'); setJdNotes('') }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <Check size={14} /> Approve
                      </button>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )
      )}

      {/* ── Task Approvals ─────────────────────────────────────────────────── */}
      {activeTab === 'tasks' && hasTaskAccess && (
        showHistory ? (
          <Card padding={false}>
            <div className="border-b border-slate-100 p-4">
              <CardTitle>Task Completion History</CardTitle>
            </div>
            <div className="divide-y divide-slate-100">
              {historyTaskApprovals.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">No task completion history found.</div>
              ) : historyTaskApprovals.map((task) => {
                const assigneeProfiles = (task.assignees ?? []).map((a) => profiles.find((p) => p.id === a.employee_id)).filter(Boolean)
                return (
                  <div key={task.id} className="p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {assigneeProfiles.map((p) => p && (
                          <div key={p.id} className="flex items-center gap-2">
                            <Avatar name={p.full_name} size="sm" />
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{p.full_name}</p>
                              <p className="text-[10px] text-slate-400 capitalize">{p.role?.replace('_', ' ')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Completed
                      </span>
                    </div>
                    <TaskDetailBlock task={task} />
                  </div>
                )
              })}
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {isAdmin && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-2.5 text-xs text-blue-700 font-medium">
                As {role?.replace('_', ' ')}, you see completed tasks and detail changes from all employees.
              </div>
            )}

            {/* Section 1: Task Details Changes Awaiting Approval */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Task Details & New Tasks Awaiting Approval</h3>
              {pendingTaskChanges.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                  No task detail changes pending approval.
                </div>
              ) : (
                pendingTaskChanges.map((task) => {
                  const assigneeProfiles = (task.assignees ?? [])
                    .map((a) => profiles.find((p) => p.id === a.employee_id))
                    .filter(Boolean)
                  const isEditing = activeTaskId === task.id && (activeTaskAction === 'approve_change' || activeTaskAction === 'reject_change')

                  return (
                    <Card key={task.id} className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {assigneeProfiles.map((p) => p && (
                            <div key={p.id} className="flex items-center gap-2">
                              <Avatar name={p.full_name} size="sm" />
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{p.full_name}</p>
                                <p className="text-[10px] text-slate-400 capitalize">{p.role?.replace('_', ' ')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 shrink-0">
                          Pending Details Approval
                        </span>
                      </div>

                      <TaskDetailBlock task={task} />

                      {isEditing && activeTaskAction ? (
                        <ActionConfirm
                          action={activeTaskAction === 'approve_change' ? 'approve' : 'reject'}
                          notes={taskNotes}
                          onNotesChange={setTaskNotes}
                          onCancel={() => { setActiveTaskAction(null); setActiveTaskId(null) }}
                          onConfirm={() => handleTaskConfirm(task.id)}
                          approveLabel="Approve Changes"
                          rejectLabel="Request Changes"
                        />
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setActiveTaskId(task.id); setActiveTaskAction('reject_change'); setTaskNotes('') }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <XCircle size={14} /> Request Changes
                          </button>
                          <button
                            onClick={() => { setActiveTaskId(task.id); setActiveTaskAction('approve_change'); setTaskNotes('') }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                          >
                            <CheckCircle2 size={14} /> Approve Details
                          </button>
                        </div>
                      )}
                    </Card>
                  )
                })
              )}
            </div>

            {/* Section 2: Tasks Awaiting Review & Completion */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-slate-700">Tasks Awaiting Review & Completion</h3>
              {pendingTaskApprovals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                  No tasks pending review.
                </div>
              ) : (
                pendingTaskApprovals.map((task) => {
                  const assigneeProfiles = (task.assignees ?? [])
                    .map((a) => profiles.find((p) => p.id === a.employee_id))
                    .filter(Boolean)
                  const assigner = profiles.find((p) => p.id === task.assigned_by)
                  const isEditing = activeTaskId === task.id && (activeTaskAction === 'acknowledge' || activeTaskAction === 'revise')

                  return (
                    <Card key={task.id} className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {assigneeProfiles.map((p) => p && (
                            <div key={p.id} className="flex items-center gap-2">
                              <Avatar name={p.full_name} size="sm" />
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{p.full_name}</p>
                                <p className="text-[10px] text-slate-400 capitalize">{p.role?.replace('_', ' ')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 shrink-0">
                          In Review
                        </span>
                      </div>

                      <TaskDetailBlock task={task} assigner={assigner} />

                      {isEditing && activeTaskAction ? (
                        <ActionConfirm
                          action={activeTaskAction === 'acknowledge' ? 'approve' : 'reject'}
                          notes={taskNotes}
                          onNotesChange={setTaskNotes}
                          onCancel={() => { setActiveTaskAction(null); setActiveTaskId(null) }}
                          onConfirm={() => handleTaskConfirm(task.id)}
                          approveLabel="Acknowledge"
                          rejectLabel="Request Revision"
                        />
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setActiveTaskId(task.id); setActiveTaskAction('revise'); setTaskNotes('') }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <XCircle size={14} /> Request Revision
                          </button>
                          <button
                            onClick={() => { setActiveTaskId(task.id); setActiveTaskAction('acknowledge'); setTaskNotes('') }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                          >
                            <CheckCircle2 size={14} /> Acknowledge
                          </button>
                        </div>
                      )}
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        )
      )}

      {/* ── Deletion Requests ──────────────────────────────────────────────── */}
      {activeTab === 'deletions' && (
        <div className="space-y-4">
          {pendingDeletions.length === 0 ? (
            <EmptyState icon={<Trash2 size={32} className="mx-auto opacity-30 mb-2" />} message="No pending deletion requests." />
          ) : pendingDeletions.map((jd) => {
            const emp = profiles.find((p) => p.id === jd.employee_id)
            return (
              <Card key={jd.id} className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <EmployeeHeader profile={emp} />
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 shrink-0">
                    Deletion Pending
                  </span>
                </div>
                <JDDetailBlock jd={jd} />
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-700">
                  <strong>{emp?.full_name ?? 'This employee'}</strong> has requested this Job Direction to be deleted. Approve to permanently remove it, or reject to keep it active.
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => rejectDeletion(jd.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <X size={14} /> Keep Active
                  </button>
                  <button
                    onClick={() => approveDeletion(jd.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
                  >
                    <Trash2 size={14} /> Approve Deletion
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* No access fallback */}
      {!hasJDAccess && !hasTaskAccess && (
        <EmptyState
          icon={<Compass size={32} className="mx-auto opacity-30 mb-2" />}
          message="You don't have approval permissions. Contact your admin."
        />
      )}
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function EmployeeHeader({ profile }: { profile: ReturnType<typeof useProfileStore['getState']>['profiles'][number] | undefined }) {
  if (!profile) return null
  return (
    <div className="flex items-center gap-3">
      <Avatar name={profile.full_name} size="sm" />
      <div>
        <p className="text-sm font-semibold text-slate-800">{profile.full_name}</p>
        <p className="text-[10px] text-slate-400 capitalize">{profile.role?.replace('_', ' ')}</p>
      </div>
    </div>
  )
}

function JDDetailBlock({ jd }: { jd: JobDirection }) {
  return (
    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-2">
      <p className="text-sm text-slate-800 font-medium leading-relaxed">{jd.work_details}</p>
      <div className="flex gap-4 text-xs text-slate-500 font-semibold">
        {jd.daily_target > 0   && <span>Daily: <strong className="text-slate-700">{jd.daily_target}</strong></span>}
        {jd.weekly_target > 0  && <span>Weekly: <strong className="text-slate-700">{jd.weekly_target}</strong></span>}
        {jd.monthly_target > 0 && <span>Monthly: <strong className="text-slate-700">{jd.monthly_target}</strong></span>}
      </div>
    </div>
  )
}

function TaskDetailBlock({
  task, assigner,
}: {
  task: SpecialTask
  assigner?: ReturnType<typeof useProfileStore['getState']>['profiles'][number]
}) {
  return (
    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-1.5">
      <p className="text-sm text-slate-800 font-medium leading-relaxed">{task.task_name}</p>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        {assigner && (
          <span className="flex items-center gap-1">
            <Clock size={11} /> Assigned by <strong className="text-slate-700">{assigner.full_name}</strong>
          </span>
        )}
        {task.due_date && (
          <span>Due <strong className="text-slate-700">{task.due_date}</strong></span>
        )}
      </div>
      {task.remarks && <p className="text-xs text-slate-400 italic">{task.remarks}</p>}
    </div>
  )
}

function RemarksBlock({ text }: { text: string }) {
  return (
    <div className="flex gap-2 text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
      <MessageSquare size={13} className="mt-0.5 text-slate-400" />
      <p><strong>Remarks:</strong> {text}</p>
    </div>
  )
}

function ActionConfirm({
  action, notes, onNotesChange, onCancel, onConfirm, approveLabel = 'Approve', rejectLabel = 'Request Changes',
}: {
  action: 'approve' | 'reject'
  notes: string
  onNotesChange: (v: string) => void
  onCancel: () => void
  onConfirm: () => void
  approveLabel?: string
  rejectLabel?: string
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        {action === 'approve'
          ? <><CheckCircle2 size={14} className="text-emerald-500" /><span>Confirm {approveLabel}</span></>
          : <><XCircle size={14} className="text-red-500" /><span>{rejectLabel}</span></>
        }
      </div>
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Add remarks or notes..."
        rows={3}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-slate-300"
      />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={cn(
            'rounded-lg px-4 py-1.5 text-xs font-semibold text-white shadow-sm',
            action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
          )}
        >
          Confirm
        </button>
      </div>
    </div>
  )
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <Card className="py-12 text-center text-slate-400">
      {icon}
      <p className="text-sm font-medium">{message}</p>
    </Card>
  )
}
