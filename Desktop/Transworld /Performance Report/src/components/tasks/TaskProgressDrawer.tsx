import { useState } from 'react'
import { X, TrendingUp, Calendar, Check } from 'lucide-react'
import { format } from 'date-fns'
import { useTaskStore } from '@/store/taskStore'
import {
  calcForecast, forecastLabel, forecastBg, progressPct,
  formatQuantity, formatCurrency, progressSummary,
  isQuantity, isValue, isMilestone,
} from '@/lib/kpiEngine'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Checkbox } from '@/components/ui/Checkbox'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/database'

interface Props {
  task: Task
  onClose: () => void
}

export function TaskProgressDrawer({ task, onClose }: Props) {
  const { updateProgress, updateValue, toggleMilestone, getMilestonesForTask, getHistoryForTask } = useTaskStore()
  const milestones = getMilestonesForTask(task.id)
  const history = getHistoryForTask(task.id)
  const forecast = calcForecast(task, milestones)
  const pct = progressPct(task, milestones)

  // quantity state
  const [inputVal, setInputVal] = useState(String(task.completed_quantity ?? 0))
  // value state
  const [valueInput, setValueInput] = useState(String(task.current_value ?? 0))
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  function handleSave() {
    if (isValue(task)) {
      const val = parseFloat(valueInput)
      if (isNaN(val) || val < 0) { setErr('Enter a valid amount'); return }
      if (task.target_value && val > task.target_value) {
        setErr(`Cannot exceed target (${formatCurrency(task.target_value, task.currency ?? 'INR')})`)
        return
      }
      setErr('')
      updateValue(task.id, val)
    } else if (isQuantity(task)) {
      const val = parseFloat(inputVal)
      if (isNaN(val) || val < 0) { setErr('Enter a valid number'); return }
      if (task.target_quantity && val > task.target_quantity) {
        setErr(`Cannot exceed target (${task.target_quantity})`)
        return
      }
      setErr('')
      updateProgress(task.id, val)
    }
    setSaved(true)
    setTimeout(onClose, 700)
  }

  const milestoneTasks = milestones
  const completedWeight = milestoneTasks.filter((m) => m.completed).reduce((s, m) => s + m.weight, 0)

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="flex w-[400px] flex-col bg-background shadow-2xl border-l border-border">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {isMilestone(task) ? 'Milestone Progress' : 'Update Progress'}
            </p>
            <h3 className="mt-1 text-base font-bold text-foreground leading-snug">{task.title}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Current progress */}
        <div className="border-b border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Current Progress</span>
            <span className="text-lg font-bold text-foreground">{pct}%</span>
          </div>
          <ProgressBar value={pct} size="md" />
          <p className="text-sm text-muted-foreground">{progressSummary(task, milestones)}</p>

          {forecast && (
            <div className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium', forecastBg(forecast))}>
              <TrendingUp size={12} />
              <span>{forecastLabel(forecast)}</span>
              <span className="ml-auto flex items-center gap-1 opacity-70">
                <Calendar size={10} />
                {format(forecast.forecastDate, 'MMM d')}
              </span>
            </div>
          )}
        </div>

        {/* Content area — varies by model */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* MILESTONE model */}
          {isMilestone(task) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Milestones · {completedWeight}% complete
              </p>
              {milestoneTasks.map((ms) => (
                <div
                  key={ms.id}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                    ms.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-card border-border',
                  )}
                >
                  <Checkbox
                    checked={ms.completed}
                    onCheckedChange={() => toggleMilestone(ms.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', ms.completed && 'line-through text-muted-foreground')}>
                      {ms.title}
                    </p>
                    {ms.completed_at && (
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Done {format(new Date(ms.completed_at), 'MMM d')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">{ms.weight}%</span>
                  {ms.completed && <Check size={12} className="text-emerald-500 shrink-0" />}
                </div>
              ))}
              {milestoneTasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No milestones configured.</p>
              )}
            </div>
          )}

          {/* VALUE model */}
          {isValue(task) && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Current Amount ({task.currency ?? 'INR'})
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {task.currency === 'INR' ? '₹' : task.currency === 'EUR' ? '€' : task.currency === 'GBP' ? '£' : '$'}
                </span>
                <input
                  type="number"
                  value={valueInput}
                  onChange={(e) => { setValueInput(e.target.value); setErr(''); setSaved(false) }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  min={0}
                  className="flex-1 rounded-xl border border-input bg-muted/30 px-4 py-2.5 text-lg font-bold text-foreground text-right tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Target: {formatCurrency(task.target_value ?? 0, task.currency ?? 'INR')}
              </p>
              {!isNaN(parseFloat(valueInput)) && (
                <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                  <ProgressBar
                    value={Math.min(100, ((parseFloat(valueInput) || 0) / (task.target_value ?? 1)) * 100)}
                    size="sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    After update:{' '}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(parseFloat(valueInput) || 0, task.currency ?? 'INR')}
                    </span>
                    {' / '}
                    {formatCurrency(task.target_value ?? 0, task.currency ?? 'INR')}
                  </p>
                </div>
              )}
              {err && <p className="text-xs text-red-600">{err}</p>}
            </div>
          )}

          {/* QUANTITY model */}
          {isQuantity(task) && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                New Total ({task.unit})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={inputVal}
                  onChange={(e) => { setInputVal(e.target.value); setErr(''); setSaved(false) }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  min={0}
                  max={task.target_quantity ?? undefined}
                  className="flex-1 rounded-xl border border-input bg-muted/30 px-4 py-2.5 text-lg font-bold text-foreground text-right tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  / {formatQuantity(task.target_quantity ?? 0)}
                </span>
              </div>
              {err && <p className="text-xs text-red-600">{err}</p>}
              {!isNaN(parseFloat(inputVal)) && (
                <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                  <ProgressBar
                    value={Math.min(100, ((parseFloat(inputVal) || 0) / (task.target_quantity ?? 1)) * 100)}
                    size="sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    After update:{' '}
                    <span className="font-semibold text-foreground">{formatQuantity(parseFloat(inputVal) || 0)}</span> done ·{' '}
                    <span className="font-semibold text-foreground">
                      {formatQuantity(Math.max(0, (task.target_quantity ?? 0) - (parseFloat(inputVal) || 0)))}
                    </span>{' '}
                    remaining
                  </p>
                </div>
              )}

              {/* History */}
              {history.length > 1 && (
                <div className="pt-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">History</p>
                  <div className="space-y-1">
                    {[...history].reverse().slice(0, 5).map((h) => (
                      <div key={h.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{format(new Date(h.recorded_date), 'MMM d')}</span>
                        <span className="font-medium text-foreground">{formatQuantity(h.completed_quantity)} {task.unit}</span>
                        <span className={cn('font-medium', h.daily_delta >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                          +{formatQuantity(h.daily_delta)}/day
                        </span>
                        <span className="text-muted-foreground">{h.progress_percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — milestones auto-save, others need button */}
        {!isMilestone(task) && (
          <div className="border-t border-border p-5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saved}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all text-white',
                saved ? 'bg-emerald-500' : 'bg-primary hover:opacity-90',
              )}
            >
              {saved ? 'Saved' : 'Save Progress'}
            </button>
          </div>
        )}
        {isMilestone(task) && (
          <div className="border-t border-border p-5">
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
