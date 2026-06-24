import { useState } from 'react'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useChangeRequestStore } from '@/store/changeRequestStore'
import { useTaskStore } from '@/store/taskStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useAuth } from '@/contexts/AuthContext'
import { PROFILES } from '@/lib/mockData'
import { cn, formatRelative, formatDate } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { 
  ChevronDown, ChevronUp, Check, X, MessageSquare, Compass, 
  Calendar, CheckCircle2, XCircle, Clock
} from 'lucide-react'
import type { JobDirection, JobDirectionStatus } from '@/types/database'

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<JobDirectionStatus, string> = {
  draft:     'bg-slate-100 text-slate-500',
  active:    'bg-blue-100 text-blue-700',
  submitted: 'bg-amber-100 text-amber-700',
  approved:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-700',
  completed: 'bg-slate-100 text-slate-600',
}

const STATUS_LABELS: Record<JobDirectionStatus, string> = {
  draft:     'Draft',
  active:    'Active',
  submitted: 'Under Review',
  approved:  'Approved',
  rejected:  'Changes Needed',
  completed: 'Completed',
}

function formatValue(value: number | null, unit: string | null): string {
  if (value === null) return '—'
  if (unit === 'INR') return `₹${value.toLocaleString('en-IN')}`
  if (unit === '%') return `${value}%`
  return `${value.toLocaleString('en-IN')} ${unit ?? ''}`
}

// ─── Local KPI Card ────────────────────────────────────────────────────────────

function KPICard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-4">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
    </div>
  )
}

// ─── JD Pending Card ─────────────────────────────────────────────────────────────

function PendingCard({ jd }: { jd: JobDirection }) {
  const { approveDirection, rejectDirection, requestChanges } = useJobDirectionStore()
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | 'request_changes' | null>(null)
  const [notes, setNotes] = useState('')
  const { user } = useAuth()

  const employee = PROFILES.find((p) => p.id === jd.employee_id)

  function handleConfirm() {
    if (!activeAction) return
    if (activeAction === 'approve') approveDirection(jd.id, user?.id ?? '', notes)
    else if (activeAction === 'reject') rejectDirection(jd.id, notes)
    else if (activeAction === 'request_changes') requestChanges(jd.id, notes)
    setActiveAction(null)
    setNotes('')
  }

  function openAction(action: 'approve' | 'reject' | 'request_changes' | null) {
    setActiveAction((prev) => (prev === action ? null : action))
    setNotes('')
  }

  const target = jd.pendingEdits ? jd.pendingEdits.target_value : jd.target_value
  const pct = (target && jd.current_value) ? Math.min(100, (jd.current_value / target) * 100) : jd.progress_percentage

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 space-y-4">
      {/* Employee */}
      <div className="flex items-start gap-3">
        <Avatar name={employee?.full_name ?? '?'} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800">{employee?.full_name ?? '—'}</p>
          <p className="text-[10px] text-slate-400">{employee?.designation ?? ''}</p>
        </div>
        {jd.submitted_for_review_at && (
          <span className="text-[10px] text-slate-400 whitespace-nowrap">
            {formatRelative(jd.submitted_for_review_at)}
          </span>
        )}
      </div>

      {/* JD Info */}
      <div>
        {jd.pendingEdits ? (
          <div className="space-y-2">
            <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">Proposed Value Changes</span>
            <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-3 space-y-2">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-400">Title</p>
                <p className={cn(
                  'text-xs font-semibold text-slate-800',
                  jd.pendingEdits.title !== jd.title && 'text-amber-800 font-bold'
                )}>
                  {jd.pendingEdits.title}
                </p>
                {jd.pendingEdits.title !== jd.title && (
                  <p className="text-[10px] text-slate-400 line-through">Original: {jd.title}</p>
                )}
              </div>
              
              {(jd.pendingEdits.description !== jd.description) && (
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Description</p>
                  <p className="text-xs text-slate-700">{jd.pendingEdits.description || 'None'}</p>
                  {jd.description && (
                    <p className="text-[10px] text-slate-400 line-through">Original: {jd.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-slate-800 leading-snug mb-1">{jd.title}</h3>
            {jd.description && (
              <p className="text-xs text-slate-500 leading-relaxed">{jd.description}</p>
            )}
          </>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {jd.progress_type === 'milestone'
              ? 'Milestone progress'
              : `${formatValue(jd.current_value, jd.unit)} / ${formatValue(target, jd.unit)}`
            }
          </span>
          <span className="font-semibold text-slate-700 tabular-nums">{pct.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-amber-400 transition-all"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        {jd.pendingEdits && jd.pendingEdits.target_value !== jd.target_value && (
          <p className="text-[10px] text-slate-400 mt-1">
            Target change: <span className="line-through">{formatValue(jd.target_value, jd.unit)}</span> → <span className="text-amber-800 font-semibold">{formatValue(jd.pendingEdits.target_value, jd.unit)}</span>
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => openAction('approve')}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
            activeAction === 'approve'
              ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          )}
        >
          <Check size={12} /> Approve
        </button>
        <button
          onClick={() => openAction('reject')}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
            activeAction === 'reject'
              ? 'bg-red-100 text-red-700 ring-1 ring-red-200'
              : 'bg-red-50 text-red-700 hover:bg-red-100'
          )}
        >
          <X size={12} /> Reject
        </button>
        <button
          onClick={() => openAction('request_changes')}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
            activeAction === 'request_changes'
              ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          )}
        >
          <MessageSquare size={12} /> Request Changes
        </button>
      </div>

      {/* Inline Action Panel */}
      {activeAction && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-medium text-slate-600">
            {activeAction === 'approve' && 'Add a note (optional)'}
            {activeAction === 'reject' && 'Reason for rejection (required)'}
            {activeAction === 'request_changes' && 'Describe the changes needed'}
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={
              activeAction === 'approve'
                ? 'Great work! Keep it up...'
                : activeAction === 'reject'
                ? 'Please explain why...'
                : 'Please update the following before resubmitting...'
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirm}
              disabled={(activeAction === 'reject' || activeAction === 'request_changes') && !notes.trim()}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                activeAction === 'approve' ? 'bg-emerald-600 text-white hover:bg-emerald-700' :
                activeAction === 'reject'  ? 'bg-red-600 text-white hover:bg-red-700' :
                                            'bg-amber-500 text-white hover:bg-amber-600',
                ((activeAction === 'reject' || activeAction === 'request_changes') && !notes.trim())
                  ? 'opacity-40 cursor-not-allowed' : ''
              )}
            >
              Confirm
            </button>
            <button
              onClick={() => { setActiveAction(null); setNotes('') }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── JD History Row ───────────────────────────────────────────────────────────────

function HistoryRow({ jd }: { jd: JobDirection }) {
  const employee = PROFILES.find((p) => p.id === jd.employee_id)
  const decisionDate = jd.approved_at ?? jd.rejected_at ?? jd.updated_at

  const decisionLabel =
    jd.status === 'approved' ? 'Approved' :
    jd.status === 'rejected' ? 'Rejected' :
    jd.status === 'active'   ? 'Changes Requested' :
    STATUS_LABELS[jd.status]

  const decisionColor =
    jd.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
    jd.status === 'rejected' ? 'bg-red-100 text-red-700' :
    'bg-amber-100 text-amber-700'

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <Avatar name={employee?.full_name ?? '?'} size="xs" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-700">{employee?.full_name ?? '—'}</span>
          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', decisionColor)}>
            {decisionLabel}
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-0.5 truncate">{jd.title}</p>
        {jd.review_notes && (
          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{jd.review_notes}</p>
        )}
      </div>
      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
        {formatDate(decisionDate)}
      </span>
    </div>
  )
}

// ─── Date Pending Card ───────────────────────────────────────────────────────────

function DatePendingCard({ 
  req, 
  onApprove, 
  onReject, 
  rejectingId, 
  setRejectingId, 
  rejectNote, 
  setRejectNote 
}: { 
  req: any
  onApprove: (id: string) => void
  onReject: (id: string) => void
  rejectingId: string | null
  setRejectingId: (id: string | null) => void
  rejectNote: string
  setRejectNote: (val: string) => void
}) {
  const employee = PROFILES.find((p) => p.id === req.requested_by_id)

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 space-y-4">
      {/* Employee */}
      <div className="flex items-start gap-3">
        <Avatar name={req.requested_by_name ?? '?'} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800">{req.requested_by_name ?? '—'}</p>
          <p className="text-[10px] text-slate-400">{employee?.designation ?? ''}</p>
        </div>
        {req.created_at && (
          <span className="text-[10px] text-slate-400 whitespace-nowrap">
            {formatRelative(req.created_at)}
          </span>
        )}
      </div>

      {/* Task */}
      <div>
        <p className="text-xs text-slate-500">
          Task: <span className="font-semibold text-slate-855">{req.task_title}</span>
        </p>
      </div>

      {/* Date change */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Calendar size={11} />
          <span className="line-through">{req.current_date ? formatDate(req.current_date) : '—'}</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex items-center gap-1.5 font-semibold text-blue-600">
          <Calendar size={11} />
          <span>{formatDate(req.requested_date)}</span>
        </div>
      </div>

      {/* Reason */}
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Reason</p>
        <p className="text-xs text-slate-700 leading-relaxed">{req.reason}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {rejectingId === req.id ? (
          <div className="flex flex-col gap-2 w-full mt-1">
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Reason for rejection (optional)…"
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-red-300"
            />
            <div className="flex gap-2">
              <button
                onClick={() => onReject(req.id)}
                className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => { setRejectingId(null); setRejectNote('') }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 w-full">
            <button
              onClick={() => onApprove(req.id)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors flex-1 justify-center"
            >
              <CheckCircle2 size={13} />
              Approve
            </button>
            <button
              onClick={() => setRejectingId(req.id)}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors flex-1 justify-center"
            >
              <XCircle size={13} />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Unified Page ──────────────────────────────────────────────────────────

export function ApprovalCenter() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'jd' | 'date'>('jd')
  const [showHistory, setShowHistory] = useState(false)
  const [showResolvedDates, setShowResolvedDates] = useState(false)

  // Stores
  const directions = useJobDirectionStore((s) => s.directions)
  const { requests, approveRequest, rejectRequest } = useChangeRequestStore()
  const { updateTask } = useTaskStore()

  // Date Change Reject State
  const [rejectingDateId, setRejectingDateId] = useState<string | null>(null)
  const [rejectDateNote, setRejectDateNote] = useState('')

  const managerId = user?.id ?? ''

  // 1. Job Direction review metrics
  const pendingJDs  = directions.filter((d) => d.manager_id === managerId && d.status === 'submitted')
  const approvedJDs = directions.filter((d) => d.manager_id === managerId && d.status === 'approved')
  const rejectedJDs = directions.filter((d) => d.manager_id === managerId && d.status === 'rejected')
  const jdHistory   = directions.filter(
    (d) => d.manager_id === managerId && ['approved', 'rejected', 'active'].includes(d.status) && (d.approved_at || d.rejected_at || d.review_notes)
  )

  // 2. Date approvals metrics (for manager reportees)
  // Fetch direct reportees IDs
  const reporteeIds = PROFILES.filter((p) => p.manager_id === managerId).map((p) => p.id)
  
  const pendingDates = requests.filter((r) => r.status === 'pending' && reporteeIds.includes(r.requested_by_id))
  const approvedDates = requests.filter((r) => r.status === 'approved' && reporteeIds.includes(r.requested_by_id))
  const rejectedDates = requests.filter((r) => r.status === 'rejected' && reporteeIds.includes(r.requested_by_id))
  const resolvedDates = requests.filter((r) => r.status !== 'pending' && reporteeIds.includes(r.requested_by_id))

  // Date Change Handlers
  function handleDateApprove(id: string) {
    const req = requests.find((r) => r.id === id)
    if (!req) return
    approveRequest(id, user!.id, user!.full_name)
    
    // Apply the new date immediately based on task type
    if (req.task_id.startsWith('jd')) {
      useJobDirectionStore.getState().updateDirectionDate(req.task_id, req.requested_date)
    } else if (req.task_id.startsWith('st')) {
      useSpecialTaskStore.getState().updateTask(req.task_id, { due_date: req.requested_date })
    } else {
      updateTask(req.task_id, { due_date: req.requested_date })
    }
  }

  function handleDateReject(id: string) {
    rejectRequest(id, user!.id, user!.full_name, rejectDateNote)
    setRejectingDateId(null)
    setRejectDateNote('')
  }

  return (
    <div className="space-y-6">
      
      {/* Unified Tab Switcher */}
      <div className="border border-slate-200/80 px-1 py-1 flex items-center gap-1.5 bg-white rounded-xl shadow-sm max-w-sm">
        <button
          onClick={() => { setActiveTab('jd'); setShowHistory(false) }}
          className={cn(
            'rounded-lg px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 flex-1 justify-center',
            activeTab === 'jd' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          )}
        >
          <Compass size={13} />
          <span>Plan Reviews</span>
          <span className={cn(
            'rounded-full px-1.5 py-px text-[9px] font-bold',
            activeTab === 'jd' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
          )}>
            {pendingJDs.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('date'); setShowResolvedDates(false) }}
          className={cn(
            'rounded-lg px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 flex-1 justify-center',
            activeTab === 'date' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          )}
        >
          <Calendar size={13} />
          <span>Date Approvals</span>
          <span className={cn(
            'rounded-full px-1.5 py-px text-[9px] font-bold',
            activeTab === 'date' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
          )}>
            {pendingDates.length}
          </span>
        </button>
      </div>

      {activeTab === 'jd' ? (
        /* ==================== PLAN REVIEWS TAB ==================== */
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-3 gap-3">
            <KPICard label="Pending Reviews" value={pendingJDs.length}  color="text-amber-600" />
            <KPICard label="Approved"        value={approvedJDs.length} color="text-emerald-600" />
            <KPICard label="Rejected"        value={rejectedJDs.length} color="text-red-600" />
          </div>

          {/* Pending Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              Pending Plan Reviews
              {pendingJDs.length > 0 && (
                <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-semibold">
                  {pendingJDs.length}
                </span>
              )}
            </h2>
            {pendingJDs.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-10 text-center">
                <p className="text-sm text-slate-400">No job directions pending review. All caught up!</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {pendingJDs.map((jd) => (
                  <PendingCard key={jd.id} jd={jd} />
                ))}
              </div>
            )}
          </div>

          {/* History Section */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>Review History</span>
              <span className="flex items-center gap-2">
                {jdHistory.length > 0 && (
                  <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px] font-semibold">
                    {jdHistory.length}
                  </span>
                )}
                {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </button>
            {showHistory && (
              <div className="border-t border-slate-100 px-5 py-2">
                {jdHistory.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">No review history yet.</p>
                ) : (
                  jdHistory.map((jd) => <HistoryRow key={jd.id} jd={jd} />)
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================== DATE APPROVALS TAB ==================== */
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-3 gap-3">
            <KPICard label="Pending Requests" value={pendingDates.length}  color="text-amber-600" />
            <KPICard label="Approved Requests" value={approvedDates.length} color="text-emerald-600" />
            <KPICard label="Rejected Requests" value={rejectedDates.length} color="text-red-600" />
          </div>

          {/* Pending Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              Pending Date Change Requests
              {pendingDates.length > 0 && (
                <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-semibold">
                  {pendingDates.length}
                </span>
              )}
            </h2>
            {pendingDates.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-10 text-center">
                <p className="text-sm text-slate-400">No pending date change requests. All caught up!</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {pendingDates.map((req) => (
                  <DatePendingCard 
                    key={req.id} 
                    req={req} 
                    onApprove={handleDateApprove}
                    onReject={handleDateReject}
                    rejectingId={rejectingDateId}
                    setRejectingId={setRejectingDateId}
                    rejectNote={rejectDateNote}
                    setRejectNote={setRejectDateNote}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Resolved Section */}
          {resolvedDates.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowResolvedDates((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>Resolved Requests</span>
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px] font-semibold">
                    {resolvedDates.length}
                  </span>
                  {showResolvedDates ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>
              {showResolvedDates && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {resolvedDates.map((req) => {
                    const requester = PROFILES.find((p) => p.id === req.requested_by_id)
                    return (
                      <div key={req.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50/50">
                        <Avatar name={req.requested_by_name} size="xs" />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-700">{req.requested_by_name}</span>
                            <span className={cn(
                              'rounded-full px-2 py-0.5 text-[9px] font-bold',
                              req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            )}>
                              {req.status === 'approved' ? 'Approved' : 'Rejected'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 truncate">{req.task_title}</p>
                          <p className="text-[10px] text-slate-400">
                            {req.current_date ? formatDate(req.current_date) : '—'} → {formatDate(req.requested_date)}
                            {req.reviewed_at && <span className="ml-2">· {formatRelative(req.reviewed_at)}</span>}
                          </p>
                          {req.rejection_note && (
                            <p className="text-[10px] text-red-500 italic mt-0.5">Reason: "{req.rejection_note}"</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
