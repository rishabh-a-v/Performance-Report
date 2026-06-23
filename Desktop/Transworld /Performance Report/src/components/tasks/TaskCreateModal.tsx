import { useState } from 'react'
import { ChevronRight, ChevronLeft, Plus, Trash2, ChevronDown } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import { PROFILES, DEPARTMENTS } from '@/lib/mockData'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import type { Task, TaskPriority, TaskStatus, MeasurementType, CurrencyCode, Milestone } from '@/types/database'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, eachDayOfInterval, isSameDay, isSameMonth, isToday } from 'date-fns'

interface Props {
  currentUserId: string
  defaultDeptId?: string | null
  onClose: () => void
}

const MEASUREMENT_OPTIONS: { value: MeasurementType; label: string; defaultUnit: string }[] = [
  { value: 'emails',     label: 'Emails',     defaultUnit: 'Emails' },
  { value: 'calls',      label: 'Calls',      defaultUnit: 'Calls' },
  { value: 'leads',      label: 'Leads',      defaultUnit: 'Leads' },
  { value: 'invoices',   label: 'Invoices',   defaultUnit: 'Invoices' },
  { value: 'audits',     label: 'Audits',     defaultUnit: 'Audits' },
  { value: 'documents',  label: 'Documents',  defaultUnit: 'Documents' },
  { value: 'count',      label: 'Count',      defaultUnit: 'Items' },
  { value: 'hours',      label: 'Hours',      defaultUnit: 'Hours' },
  { value: 'percentage', label: 'Percentage', defaultUnit: '%' },
  { value: 'custom',     label: 'Custom',     defaultUnit: '' },
]

const CURRENCIES = [
  { value: 'INR', label: 'INR — ₹' },
  { value: 'USD', label: 'USD — $' },
  { value: 'EUR', label: 'EUR — €' },
  { value: 'GBP', label: 'GBP — £' },
  { value: 'AED', label: 'AED' },
] as const

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; chip: string; selected: string }[] = [
  { value: 'low',      label: 'Low Priority',      chip: 'border-slate-200 text-slate-500 hover:border-slate-300',          selected: 'bg-slate-100 border-slate-300 text-slate-700' },
  { value: 'medium',   label: 'Medium Priority',   chip: 'border-slate-200 text-slate-500 hover:border-amber-300',           selected: 'bg-amber-50 border-amber-300 text-amber-700' },
  { value: 'high',     label: 'High Priority',     chip: 'border-slate-200 text-slate-500 hover:border-orange-300',          selected: 'bg-orange-50 border-orange-300 text-orange-700' },
  { value: 'critical', label: 'Critical',          chip: 'border-slate-200 text-slate-500 hover:border-red-300',             selected: 'bg-red-50 border-red-300 text-red-700' },
]

const DEPT_COLORS: Record<string, string> = {
  d1: 'bg-blue-500', d2: 'bg-emerald-500', d3: 'bg-amber-500',
  d4: 'bg-cyan-500', d5: 'bg-violet-500',
}

const TIME_SLOTS = Array.from({ length: 24 }, (_, h) => {
  const ampm = h < 12 ? 'AM' : 'PM'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return { value: `${String(h).padStart(2, '0')}:00`, label: `${hour}:00 ${ampm}` }
})

interface MilestoneRow { tempId: string; title: string; weight: string }
function newMilestoneRow(): MilestoneRow {
  return { tempId: `tmp_${Date.now()}_${Math.random()}`, title: '', weight: '' }
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function TaskCreateModal({ currentUserId, defaultDeptId, onClose }: Props) {
  const { addTask, addMilestones } = useTaskStore()

  const [title, setTitle]         = useState('')
  const [description, setDesc]    = useState('')
  const [assigneeId, setAssignee] = useState(currentUserId)
  const [deptId, setDept]         = useState(defaultDeptId ?? '')
  const [dueDate, setDueDate]     = useState(format(new Date(), 'yyyy-MM-dd'))
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()))
  const [dueTime, setDueTime]     = useState('09:00')
  const [priority, setPriority]   = useState<TaskPriority>('medium')
  const [status, setStatus]       = useState<TaskStatus>('ready')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [progressTab, setProgressTab]   = useState<'none' | 'quantity' | 'value' | 'milestone'>('none')

  const [measureType, setMeasureType] = useState<MeasurementType>('count')
  const [unit, setUnit]               = useState('Items')
  const [targetQty, setTargetQty]     = useState('')
  const [currency, setCurrency]       = useState<'INR' | 'USD' | 'EUR' | 'GBP' | 'AED'>('INR')
  const [targetValue, setTargetValue] = useState('')
  const [milestoneRows, setMilestoneRows] = useState<MilestoneRow[]>([newMilestoneRow(), newMilestoneRow()])

  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleTypeChange(t: MeasurementType) {
    setMeasureType(t)
    const opt = MEASUREMENT_OPTIONS.find((o) => o.value === t)
    if (opt?.defaultUnit) setUnit(opt.defaultUnit)
  }

  const milestoneWeightSum = milestoneRows.reduce((s, r) => s + (parseFloat(r.weight) || 0), 0)

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!assigneeId)   e.assignee = 'Select an assignee'
    if (progressTab === 'quantity') {
      if (!targetQty || isNaN(Number(targetQty)) || Number(targetQty) <= 0) e.target = 'Enter a positive target'
      if (!unit.trim()) e.unit = 'Unit name required'
    }
    if (progressTab === 'value') {
      if (!targetValue || isNaN(Number(targetValue)) || Number(targetValue) <= 0) e.value = 'Enter a positive amount'
    }
    if (progressTab === 'milestone') {
      const valid = milestoneRows.filter((r) => r.title.trim())
      if (valid.length < 2) e.milestones = 'Add at least 2 milestones'
      if (Math.abs(milestoneWeightSum - 100) > 0.5) e.weights = `Weights must sum to 100% (${milestoneWeightSum}%)`
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const now = new Date().toISOString()
    const taskId = `task_${Date.now()}`
    const task: Task = {
      id: taskId, title: title.trim(), description: description.trim() || null,
      status, priority, assignee_id: assigneeId, created_by: currentUserId,
      department_id: deptId || null, due_date: dueDate || null,
      started_at: null, completed_at: null, cycle_time_hours: null, estimated_hours: null,
      tags: [], created_at: now, updated_at: now,
      progress_model: progressTab === 'none' ? undefined : progressTab,
      measurement_type: progressTab === 'quantity' ? measureType : undefined,
      target_quantity: progressTab === 'quantity' ? Number(targetQty) : undefined,
      completed_quantity: progressTab === 'quantity' ? 0 : undefined,
      unit: progressTab === 'quantity' ? unit.trim() : undefined,
      target_value: progressTab === 'value' ? Number(targetValue) : undefined,
      current_value: progressTab === 'value' ? 0 : undefined,
      currency: progressTab === 'value' ? currency : undefined,
    }
    addTask(task)
    if (progressTab === 'milestone') {
      addMilestones(milestoneRows.filter((r) => r.title.trim()).map((r, idx) => ({
        id: `ms_${taskId}_${idx}`, task_id: taskId, title: r.title.trim(),
        weight: parseFloat(r.weight) || 0, completed: false, completed_at: null,
        sort_order: idx + 1, created_at: now,
      })))
    }
    onClose()
  }

  const employees = PROFILES.filter((p) => p.role !== 'executive')

  // Calendar helpers
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(calendarMonth)),
    end: endOfWeek(endOfMonth(calendarMonth)),
  })

  const fieldBase = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-colors'

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 rounded-2xl flex flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">Create Task</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ maxHeight: 'calc(90vh - 130px)' }}>
          {/* Title */}
          <div>
            <label className="block text-base font-bold text-slate-900 mb-2">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Email Outreach Campaign"
              className={cn(fieldBase, errors.title && 'border-red-400')}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-base font-bold text-slate-900 mb-2">Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Add any details, context, or reminders…"
              rows={3}
              className={cn(fieldBase, 'resize-none')}
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-base font-bold text-slate-900 mb-2">Assignee</label>
            <div className="relative">
              <select
                value={assigneeId}
                onChange={(e) => setAssignee(e.target.value)}
                className={cn(fieldBase, 'appearance-none pr-10', errors.assignee && 'border-red-400')}
              >
                {employees.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            {errors.assignee && <p className="mt-1 text-xs text-red-500">{errors.assignee}</p>}
          </div>

          {/* Category / Department */}
          <div>
            <label className="block text-base font-bold text-slate-900 mb-2">Category</label>
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <span className={cn('h-2 w-2 rounded-full inline-block', deptId ? (DEPT_COLORS[deptId] ?? 'bg-slate-400') : 'bg-slate-300')} />
              </div>
              <select
                value={deptId}
                onChange={(e) => setDept(e.target.value)}
                className={cn(fieldBase, 'appearance-none pl-8 pr-10')}
              >
                <option value="">— No Department —</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Calendar */}
          <div>
            <label className="block text-base font-bold text-slate-900 mb-2">Date</label>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-sm font-semibold text-slate-800">
                  {format(calendarMonth, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400 py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Date cells */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {calendarDays.map((day) => {
                  const iso = format(day, 'yyyy-MM-dd')
                  const isSelected = dueDate === iso
                  const isCurrentMonth = isSameMonth(day, calendarMonth)
                  const isTodayDate = isToday(day)
                  return (
                    <button
                      key={iso}
                      onClick={() => setDueDate(iso)}
                      className={cn(
                        'flex h-8 w-full items-center justify-center rounded-lg text-sm transition-all',
                        isSelected
                          ? 'bg-[#0f172a] text-white font-semibold'
                          : isTodayDate
                          ? 'bg-brand-50 text-brand-700 font-semibold ring-1 ring-brand-200'
                          : isCurrentMonth
                          ? 'text-slate-700 hover:bg-slate-100'
                          : 'text-slate-300 hover:bg-slate-50',
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="block text-base font-bold text-slate-900 mb-2">Time</label>
            <div className="relative">
              <select
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className={cn(fieldBase, 'appearance-none pr-10')}
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Priority chips */}
          <div>
            <label className="block text-base font-bold text-slate-900 mb-2">Priority</label>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                    priority === opt.value ? opt.selected : opt.chip,
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status chips */}
          <div>
            <label className="block text-base font-bold text-slate-900 mb-2">Status</label>
            <div className="flex gap-2">
              {([
                { value: 'backlog',     label: 'Backlog',      sel: 'bg-slate-100 border-slate-300 text-slate-700' },
                { value: 'ready',       label: 'Ready',        sel: 'bg-blue-50 border-blue-300 text-blue-700' },
                { value: 'in_progress', label: 'In Progress',  sel: 'bg-amber-50 border-amber-300 text-amber-700' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value as TaskStatus)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                    status === opt.value
                      ? opt.sel
                      : 'border-slate-200 text-slate-500 hover:border-slate-300',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress tracking — collapsible */}
          <div>
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <span>Progress Tracking</span>
              <ChevronDown size={15} className={cn('transition-transform', showAdvanced && 'rotate-180')} />
            </button>

            {showAdvanced && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                {/* Progress type chips */}
                <div className="flex gap-2 flex-wrap">
                  {(['none', 'quantity', 'value', 'milestone'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setProgressTab(t)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all',
                        progressTab === t
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'border-slate-200 text-slate-500 hover:border-brand-300',
                      )}
                    >
                      {t === 'none' ? 'No tracking' : t}
                    </button>
                  ))}
                </div>

                {progressTab === 'quantity' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                        <select value={measureType} onChange={(e) => handleTypeChange(e.target.value as MeasurementType)} className={cn(fieldBase, 'py-2')}>
                          {MEASUREMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Unit Label *</label>
                        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. Emails" className={cn(fieldBase, 'py-2', errors.unit && 'border-red-400')} />
                        {errors.unit && <p className="mt-1 text-xs text-red-500">{errors.unit}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Target *</label>
                      <input type="number" value={targetQty} onChange={(e) => setTargetQty(e.target.value)} placeholder="e.g. 500" min={1} className={cn(fieldBase, 'py-2', errors.target && 'border-red-400')} />
                      {errors.target && <p className="mt-1 text-xs text-red-500">{errors.target}</p>}
                    </div>
                  </div>
                )}

                {progressTab === 'value' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Currency</label>
                      <select value={currency} onChange={(e) => setCurrency(e.target.value as typeof currency)} className={cn(fieldBase, 'py-2')}>
                        {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Target Amount *</label>
                      <input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="e.g. 1000000" min={1} className={cn(fieldBase, 'py-2', errors.value && 'border-red-400')} />
                      {errors.value && <p className="mt-1 text-xs text-red-500">{errors.value}</p>}
                    </div>
                  </div>
                )}

                {progressTab === 'milestone' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">Weights must sum to 100% — currently <strong className={cn(Math.abs(milestoneWeightSum - 100) < 0.5 ? 'text-emerald-600' : 'text-amber-600')}>{milestoneWeightSum}%</strong></p>
                    {milestoneRows.map((row, idx) => (
                      <div key={row.tempId} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-4 shrink-0">{idx + 1}.</span>
                        <input value={row.title} onChange={(e) => setMilestoneRows((r) => r.map((m) => m.tempId === row.tempId ? { ...m, title: e.target.value } : m))} placeholder={`Milestone ${idx + 1}`} className={cn(fieldBase, 'py-2 flex-1')} />
                        <input type="number" value={row.weight} onChange={(e) => setMilestoneRows((r) => r.map((m) => m.tempId === row.tempId ? { ...m, weight: e.target.value } : m))} placeholder="%" min={1} max={100} className={cn(fieldBase, 'py-2 w-16 text-center')} />
                        <span className="text-xs text-slate-400">%</span>
                        {milestoneRows.length > 2 && (
                          <button onClick={() => setMilestoneRows((r) => r.filter((m) => m.tempId !== row.tempId))} className="p-1 text-slate-400 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    {errors.milestones && <p className="text-xs text-red-500">{errors.milestones}</p>}
                    {errors.weights && <p className="text-xs text-red-500">{errors.weights}</p>}
                    <button onClick={() => setMilestoneRows((r) => [...r, newMilestoneRow()])} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
                      <Plus size={13} /> Add Milestone
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors shadow-sm"
          >
            Create Task
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
