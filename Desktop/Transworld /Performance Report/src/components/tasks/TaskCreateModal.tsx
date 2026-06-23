import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import { PROFILES, DEPARTMENTS } from '@/lib/mockData'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import type { Task, TaskPriority, TaskStatus, MeasurementType, ProgressModel, CurrencyCode, Milestone } from '@/types/database'

interface Props {
  currentUserId: string
  defaultDeptId?: string | null
  onClose: () => void
}

const MEASUREMENT_OPTIONS: { value: MeasurementType; label: string; defaultUnit: string }[] = [
  { value: 'emails',     label: 'Emails',    defaultUnit: 'Emails' },
  { value: 'calls',      label: 'Calls',     defaultUnit: 'Calls' },
  { value: 'leads',      label: 'Leads',     defaultUnit: 'Leads' },
  { value: 'invoices',   label: 'Invoices',  defaultUnit: 'Invoices' },
  { value: 'audits',     label: 'Audits',    defaultUnit: 'Audits' },
  { value: 'documents',  label: 'Documents', defaultUnit: 'Documents' },
  { value: 'count',      label: 'Count',     defaultUnit: 'Items' },
  { value: 'hours',      label: 'Hours',     defaultUnit: 'Hours' },
  { value: 'percentage', label: 'Percentage',defaultUnit: '%' },
  { value: 'custom',     label: 'Custom',    defaultUnit: '' },
]

const CURRENCIES: { value: CurrencyCode; label: string }[] = [
  { value: 'INR', label: 'INR — Indian Rupee (₹)' },
  { value: 'USD', label: 'USD — US Dollar ($)' },
  { value: 'EUR', label: 'EUR — Euro (€)' },
  { value: 'GBP', label: 'GBP — British Pound (£)' },
  { value: 'AED', label: 'AED — UAE Dirham' },
]

interface MilestoneRow { tempId: string; title: string; weight: string }

function newMilestoneRow(): MilestoneRow {
  return { tempId: `tmp_${Date.now()}_${Math.random()}`, title: '', weight: '' }
}

export function TaskCreateModal({ currentUserId, defaultDeptId, onClose }: Props) {
  const { addTask, addMilestones } = useTaskStore()

  const [title, setTitle]       = useState('')
  const [description, setDesc]  = useState('')
  const [assigneeId, setAssignee] = useState(currentUserId)
  const [deptId, setDept]       = useState(defaultDeptId ?? '')
  const [dueDate, setDueDate]   = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [status, setStatus]     = useState<TaskStatus>('ready')
  const [progressTab, setProgressTab] = useState<'none' | 'quantity' | 'value' | 'milestone'>('none')

  // Quantity fields
  const [measureType, setMeasureType] = useState<MeasurementType>('count')
  const [unit, setUnit]             = useState('Items')
  const [targetQty, setTargetQty]   = useState('')

  // Value fields
  const [currency, setCurrency]     = useState<CurrencyCode>('INR')
  const [targetValue, setTargetValue] = useState('')

  // Milestone rows
  const [milestoneRows, setMilestoneRows] = useState<MilestoneRow[]>([newMilestoneRow(), newMilestoneRow()])

  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleTypeChange(t: MeasurementType) {
    setMeasureType(t)
    const opt = MEASUREMENT_OPTIONS.find((o) => o.value === t)
    if (opt?.defaultUnit) setUnit(opt.defaultUnit)
  }

  function addMilestoneRowFn() {
    setMilestoneRows((r) => [...r, newMilestoneRow()])
  }

  function removeMilestoneRow(tempId: string) {
    setMilestoneRows((r) => r.filter((m) => m.tempId !== tempId))
  }

  function updateMilestoneRow(tempId: string, field: 'title' | 'weight', val: string) {
    setMilestoneRows((r) => r.map((m) => m.tempId === tempId ? { ...m, [field]: val } : m))
  }

  const milestoneWeightSum = milestoneRows.reduce((s, r) => s + (parseFloat(r.weight) || 0), 0)

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!assigneeId)   e.assignee = 'Select an assignee'
    if (progressTab === 'quantity') {
      if (!targetQty || isNaN(Number(targetQty)) || Number(targetQty) <= 0)
        e.target = 'Enter a positive target quantity'
      if (!unit.trim()) e.unit = 'Unit name is required'
    }
    if (progressTab === 'value') {
      if (!targetValue || isNaN(Number(targetValue)) || Number(targetValue) <= 0)
        e.value = 'Enter a positive target amount'
    }
    if (progressTab === 'milestone') {
      const valid = milestoneRows.filter((r) => r.title.trim())
      if (valid.length < 2) e.milestones = 'Add at least 2 milestones'
      if (Math.abs(milestoneWeightSum - 100) > 0.5) e.weights = `Weights must sum to 100% (currently ${milestoneWeightSum}%)`
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const now = new Date().toISOString()
    const taskId = `task_${Date.now()}`

    const task: Task = {
      id: taskId,
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      assignee_id: assigneeId,
      created_by: currentUserId,
      department_id: deptId || null,
      due_date: dueDate || null,
      started_at: null,
      completed_at: null,
      cycle_time_hours: null,
      estimated_hours: null,
      tags: [],
      created_at: now,
      updated_at: now,
      // progress model
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
      const newMs: Milestone[] = milestoneRows
        .filter((r) => r.title.trim())
        .map((r, idx) => ({
          id: `ms_${taskId}_${idx}`,
          task_id: taskId,
          title: r.title.trim(),
          weight: parseFloat(r.weight) || 0,
          completed: false,
          completed_at: null,
          sort_order: idx + 1,
          created_at: now,
        }))
      addMilestones(newMs)
    }

    onClose()
  }

  const employees = PROFILES.filter((p) => p.role !== 'executive')

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Email Outreach Campaign"
              className={cn(
                'w-full rounded-lg border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                errors.title ? 'border-destructive' : 'border-input',
              )}
            />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What needs to be done?"
              rows={2}
              className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Assignee + Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Assignee *</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssignee(e.target.value)}
                className={cn(
                  'w-full rounded-lg border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                  errors.assignee ? 'border-destructive' : 'border-input',
                )}
              >
                {employees.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
              {errors.assignee && <p className="mt-1 text-xs text-destructive">{errors.assignee}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department</label>
              <select
                value={deptId}
                onChange={(e) => setDept(e.target.value)}
                className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— None —</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date + Priority + Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="backlog">Backlog</option>
                <option value="ready">Ready</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>
          </div>

          {/* Progress Model selector */}
          <div className="rounded-xl border border-border overflow-hidden">
            <p className="px-4 py-2.5 bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
              Progress Tracking
            </p>
            <div className="p-4">
              <Tabs value={progressTab} onValueChange={(v) => setProgressTab(v as typeof progressTab)}>
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="none">None</TabsTrigger>
                  <TabsTrigger value="quantity">Quantity</TabsTrigger>
                  <TabsTrigger value="value">Value</TabsTrigger>
                  <TabsTrigger value="milestone">Milestones</TabsTrigger>
                </TabsList>

                <TabsContent value="none">
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No automatic tracking — progress updated manually.
                  </p>
                </TabsContent>

                <TabsContent value="quantity" className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Type</label>
                      <select
                        value={measureType}
                        onChange={(e) => handleTypeChange(e.target.value as MeasurementType)}
                        className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {MEASUREMENT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Unit Label *</label>
                      <input
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="e.g. Emails, Audits, %"
                        className={cn(
                          'w-full rounded-lg border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                          errors.unit ? 'border-destructive' : 'border-input',
                        )}
                      />
                      {errors.unit && <p className="mt-1 text-xs text-destructive">{errors.unit}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Target Quantity *</label>
                    <input
                      type="number"
                      value={targetQty}
                      onChange={(e) => setTargetQty(e.target.value)}
                      placeholder="e.g. 500"
                      min={1}
                      className={cn(
                        'w-full rounded-lg border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                        errors.target ? 'border-destructive' : 'border-input',
                      )}
                    />
                    {errors.target && <p className="mt-1 text-xs text-destructive">{errors.target}</p>}
                  </div>
                </TabsContent>

                <TabsContent value="value" className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                      className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Target Amount *</label>
                    <input
                      type="number"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      placeholder="e.g. 1000000"
                      min={1}
                      className={cn(
                        'w-full rounded-lg border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                        errors.value ? 'border-destructive' : 'border-input',
                      )}
                    />
                    {errors.value && <p className="mt-1 text-xs text-destructive">{errors.value}</p>}
                  </div>
                </TabsContent>

                <TabsContent value="milestone" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Weights must sum to 100%{' '}
                      <span className={cn(
                        'font-semibold',
                        Math.abs(milestoneWeightSum - 100) < 0.5 ? 'text-emerald-600' : 'text-amber-600',
                      )}>
                        ({milestoneWeightSum}%)
                      </span>
                    </p>
                  </div>
                  {milestoneRows.map((row, idx) => (
                    <div key={row.tempId} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
                      <input
                        value={row.title}
                        onChange={(e) => updateMilestoneRow(row.tempId, 'title', e.target.value)}
                        placeholder={`Milestone ${idx + 1}`}
                        className="flex-1 rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <input
                        type="number"
                        value={row.weight}
                        onChange={(e) => updateMilestoneRow(row.tempId, 'weight', e.target.value)}
                        placeholder="%"
                        min={1}
                        max={100}
                        className="w-16 rounded-lg border border-input bg-muted/30 px-2 py-2 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                      {milestoneRows.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeMilestoneRow(row.tempId)}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  {errors.milestones && <p className="text-xs text-destructive">{errors.milestones}</p>}
                  {errors.weights && <p className="text-xs text-destructive">{errors.weights}</p>}
                  <Button variant="outline" size="sm" onClick={addMilestoneRowFn} className="w-full gap-1.5">
                    <Plus size={13} /> Add Milestone
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
