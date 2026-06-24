import { useState } from 'react'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Send, RefreshCw, Plus, X, GripVertical } from 'lucide-react'
import type { JobDirection, JobDirectionProgressType, JobDirectionStatus } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/Dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/Select'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatValue(value: number | null, unit: string | null): string {
  if (value === null) return '—'
  if (unit === 'INR') return `₹${value.toLocaleString('en-IN')}`
  if (unit === '%') return `${value}%`
  return `${value.toLocaleString('en-IN')} ${unit ?? ''}`
}

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

const PROGRESS_BAR_COLORS: Record<JobDirectionStatus, string> = {
  draft:     'bg-slate-400',
  active:    'bg-blue-500',
  submitted: 'bg-amber-500',
  approved:  'bg-emerald-500',
  rejected:  'bg-red-400',
  completed: 'bg-slate-400',
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-4">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
    </div>
  )
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ pct, status }: { pct: number; status: JobDirectionStatus }) {
  return (
    <div className="h-2 rounded-full bg-slate-100">
      <div
        className={cn('h-full rounded-full transition-all', PROGRESS_BAR_COLORS[status])}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  )
}

// ─── Milestone List ────────────────────────────────────────────────────────────

function MilestoneList({ jdId, status }: { jdId: string; status: JobDirectionStatus }) {
  const { getMilestonesForDirection, toggleMilestone } = useJobDirectionStore()
  const milestones = getMilestonesForDirection(jdId)
  const canToggle = status === 'active' || status === 'rejected'

  return (
    <ul className="space-y-2 mt-2">
      {milestones.map((ms) => (
        <li key={ms.id} className="flex items-center gap-2.5">
          <button
            onClick={() => canToggle && toggleMilestone(ms.id)}
            disabled={!canToggle}
            className={cn(
              'shrink-0 transition-colors',
              canToggle ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
              ms.completed ? 'text-emerald-500' : 'text-slate-300'
            )}
          >
            {ms.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
          </button>
          <span className={cn(
            'text-xs flex-1',
            ms.completed ? 'line-through text-slate-400' : 'text-slate-700'
          )}>
            {ms.title}
          </span>
          <span className="text-[10px] text-slate-400 tabular-nums shrink-0">{ms.weight}%</span>
        </li>
      ))}
    </ul>
  )
}

// ─── Direction Card ────────────────────────────────────────────────────────────

function DirectionCard({ jd, onClick }: { jd: JobDirection; onClick?: () => void }) {
  const { submitForReview, updateProgress } = useJobDirectionStore()
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const canUpdate = jd.progress_type !== 'milestone' && (jd.status === 'active' || jd.status === 'rejected')
  const canSubmit = jd.status === 'active' || jd.status === 'rejected' || jd.status === 'draft'

  function handleSubmitForReview() {
    submitForReview(jd.id)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  function handleUpdateProgress() {
    const val = parseFloat(newValue)
    if (!isNaN(val)) {
      updateProgress(jd.id, val)
      setNewValue('')
      setShowUpdateForm(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div 
        onClick={onClick}
        className="flex items-start justify-between gap-3 cursor-pointer group"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', STATUS_COLORS[jd.status])}>
              {STATUS_LABELS[jd.status]}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">{jd.title}</h3>
          {jd.description && (
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">{jd.description}</p>
          )}
        </div>
        <span className="shrink-0 text-lg font-bold tabular-nums text-slate-700">
          {jd.progress_percentage.toFixed(1)}%
        </span>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <ProgressBar pct={jd.progress_percentage} status={jd.status} />
        {jd.progress_type === 'milestone' ? (
          <MilestoneList jdId={jd.id} status={jd.status} />
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {formatValue(jd.current_value, jd.unit)}
              <span className="mx-1 text-slate-300">/</span>
              {formatValue(jd.target_value, jd.unit)}
            </span>
          </div>
        )}
      </div>

      {/* Status banners */}
      {jd.status === 'rejected' && jd.review_notes && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-3.5 py-3 text-xs text-red-700 space-y-1">
          <p className="font-semibold">Changes requested — update your progress and resubmit.</p>
          <p className="text-red-600/80">{jd.review_notes}</p>
        </div>
      )}
      {jd.status === 'approved' && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3.5 py-3 text-xs text-emerald-700">
          Approved by manager. Awaiting final completion.
        </div>
      )}
      {jd.status === 'submitted' && (
        <div className="rounded-lg bg-amber-50 border border-amber-100 px-3.5 py-3 text-xs text-amber-700">
          Submitted for review. Awaiting manager decision.
        </div>
      )}

      {/* Inline update progress form */}
      {showUpdateForm && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 space-y-2">
          <p className="text-xs font-medium text-slate-600">
            Update current value{jd.unit ? ` (${jd.unit})` : ''}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={String(jd.current_value ?? 0)}
              className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button
              onClick={handleUpdateProgress}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => { setShowUpdateForm(false); setNewValue('') }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {(canUpdate || canSubmit) && (
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
          {canUpdate && !showUpdateForm && (
            <button
              onClick={() => setShowUpdateForm(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={12} />
              Update Progress
            </button>
          )}
          {canSubmit && (
            <button
              onClick={handleSubmitForReview}
              disabled={submitted || jd.status === 'submitted'}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                submitted
                  ? 'bg-emerald-100 text-emerald-700 cursor-default'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              <Send size={12} />
              {submitted ? 'Submitted!' : 'Submit for Review'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Add Direction Modal ───────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '',
  description: '',
  progress_type: 'quantity' as JobDirectionProgressType,
  target_value: '',
  unit: '',
  due_date: '',
}

function AddDirectionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const { addDirectionWithMilestones } = useJobDirectionStore()
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [subtasks, setSubtasks] = useState<string[]>([])
  const [subtaskInput, setSubtaskInput] = useState('')

  function setField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setError('')
  }

  function addSubtask() {
    const val = subtaskInput.trim()
    if (!val) return
    setSubtasks((s) => [...s, val])
    setSubtaskInput('')
  }

  function removeSubtask(i: number) {
    setSubtasks((s) => s.filter((_, idx) => idx !== i))
  }

  const perWeight = subtasks.length > 0 ? Math.floor(100 / subtasks.length) : 0

  function handleSubmit() {
    if (!form.title.trim()) { setError('Title is required.'); return }
    const isMilestone = form.progress_type === 'milestone'
    const targetVal = isMilestone ? null : (form.target_value ? parseFloat(form.target_value) : null)

    addDirectionWithMilestones(
      {
        title:           form.title.trim(),
        description:     form.description.trim() || null,
        employee_id:     user?.id ?? '',
        manager_id:      user?.manager_id ?? '',
        department_id:   user?.department_id ?? null,
        progress_type:   form.progress_type,
        target_value:    targetVal,
        current_value:   isMilestone ? null : 0,
        unit:            isMilestone ? null : (form.unit.trim() || null),
        progress_percentage: 0,
        status:          'draft',
        review_notes:    null,
        due_date:        form.due_date || null,
        submitted_for_review_at: null,
        approved_at:     null,
        rejected_at:     null,
      },
      isMilestone ? subtasks : []
    )

    setForm(EMPTY_FORM)
    setSubtasks([])
    setSubtaskInput('')
    onClose()
  }

  const isMilestone = form.progress_type === 'milestone'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Job Direction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            id="jd-title"
            label="Title *"
            placeholder="e.g. Increase quarterly revenue by 15%"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            error={error}
          />

          <Textarea
            id="jd-desc"
            label="Description"
            placeholder="Optional details..."
            rows={2}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-foreground/70">Progress Type</label>
            <Select value={form.progress_type} onValueChange={(v) => setField('progress_type', v as JobDirectionProgressType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quantity">Quantity (numeric count)</SelectItem>
                <SelectItem value="value">Value (monetary / INR)</SelectItem>
                <SelectItem value="milestone">Milestone (checklist)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isMilestone && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="jd-target"
                label="Target Value"
                type="number"
                placeholder="e.g. 100"
                value={form.target_value}
                onChange={(e) => setField('target_value', e.target.value)}
              />
              <Input
                id="jd-unit"
                label="Unit"
                placeholder={form.progress_type === 'value' ? 'INR' : 'units'}
                value={form.unit}
                onChange={(e) => setField('unit', e.target.value)}
              />
            </div>
          )}

          {/* Milestone subtask builder */}
          {isMilestone && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground/70">
                Subtasks / Milestones
                {subtasks.length > 0 && (
                  <span className="ml-1.5 text-slate-400 font-normal">
                    ({subtasks.length} item{subtasks.length !== 1 ? 's' : ''} · ~{perWeight}% each)
                  </span>
                )}
              </label>

              {/* Add row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }}
                  placeholder="e.g. Draft initial proposal"
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button variant="outline" size="sm" onClick={addSubtask} type="button">
                  <Plus size={14} />
                  Add
                </Button>
              </div>

              {/* Subtask list */}
              {subtasks.length > 0 && (
                <ul className="rounded-lg border border-slate-100 bg-slate-50/60 divide-y divide-slate-100 overflow-hidden">
                  {subtasks.map((title, i) => (
                    <li key={i} className="flex items-center gap-2.5 px-3 py-2.5">
                      <GripVertical size={13} className="text-slate-300 shrink-0" />
                      <span className="text-xs text-slate-400 tabular-nums w-4 shrink-0">{i + 1}.</span>
                      <span className="flex-1 text-xs text-slate-700 leading-snug">{title}</span>
                      <span className="text-[10px] font-medium text-slate-400 tabular-nums shrink-0">
                        {i === subtasks.length - 1
                          ? 100 - perWeight * (subtasks.length - 1)
                          : perWeight}%
                      </span>
                      <button
                        onClick={() => removeSubtask(i)}
                        className="shrink-0 rounded p-0.5 text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {subtasks.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-200 rounded-lg">
                  No subtasks added yet. Add at least one to track progress.
                </p>
              )}
            </div>
          )}

          <Input
            id="jd-due"
            label="Due Date"
            type="date"
            value={form.due_date}
            onChange={(e) => setField('due_date', e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit}>Add Direction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function JobDirections() {
  const { user } = useAuth()
  const [showAdd, setShowAdd] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<{ kind: 'jd'; data: JobDirection } | null>(null)

  const directions = useJobDirectionStore((s) =>
    s.directions.filter((d) => d.employee_id === (user?.id ?? ''))
  )

  const activeCount    = directions.filter((d) => d.status === 'active').length
  const submittedCount = directions.filter((d) => d.status === 'submitted').length
  const approvedCount  = directions.filter((d) => d.status === 'approved').length
  const completedCount = directions.filter((d) => d.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div />
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} />
          New Direction
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard label="Active"       value={activeCount}    color="text-blue-600" />
        <KPICard label="Under Review" value={submittedCount} color="text-amber-600" />
        <KPICard label="Approved"     value={approvedCount}  color="text-emerald-600" />
        <KPICard label="Completed"    value={completedCount} color="text-slate-600" />
      </div>

      {/* Directions List */}
      {directions.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-12 text-center">
          <p className="text-sm text-slate-400">No job directions yet.</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add your first direction
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {directions.map((jd) => (
            <DirectionCard 
              key={jd.id} 
              jd={jd} 
              onClick={() => setSelectedDetail({ kind: 'jd', data: jd })}
            />
          ))}
        </div>
      )}

      <AddDirectionModal open={showAdd} onClose={() => setShowAdd(false)} />
      <TaskDetailModal item={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </div>
  )
}
