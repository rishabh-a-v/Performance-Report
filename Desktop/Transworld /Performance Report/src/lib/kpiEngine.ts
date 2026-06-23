import { differenceInDays, addDays, format } from 'date-fns'
import type { Task, Milestone, ForecastResult, CurrencyCode } from '@/types/database'

// ── Model detection ───────────────────────────────────────────────────────────

export function isMeasurable(task: Task): boolean {
  if (task.progress_model === 'quantity')  return task.target_quantity != null
  if (task.progress_model === 'value')     return task.target_value    != null
  if (task.progress_model === 'milestone') return true
  return task.measurement_type != null && task.target_quantity != null
}

export function isQuantity(task: Task): boolean {
  return task.progress_model === 'quantity' || (task.progress_model == null && task.measurement_type != null)
}
export function isValue(task: Task): boolean {
  return task.progress_model === 'value'
}
export function isMilestone(task: Task): boolean {
  return task.progress_model === 'milestone'
}

// ── Progress percentage ───────────────────────────────────────────────────────

export function progressPct(task: Task, milestones?: Milestone[]): number {
  if (isMilestone(task)) {
    if (!milestones?.length) return 0
    const done = milestones.filter((m) => m.task_id === task.id && m.completed)
    return parseFloat(done.reduce((s, m) => s + m.weight, 0).toFixed(1))
  }
  if (isValue(task)) {
    if (!task.target_value || task.current_value == null) return 0
    return Math.min(100, parseFloat(((task.current_value / task.target_value) * 100).toFixed(1)))
  }
  if (!task.target_quantity || task.completed_quantity == null) return 0
  return Math.min(100, parseFloat(((task.completed_quantity / task.target_quantity) * 100).toFixed(1)))
}

// ── Forecast (quantity and value only) ───────────────────────────────────────

export function calcForecast(task: Task, milestones?: Milestone[]): ForecastResult | null {
  if (isMilestone(task)) return null
  if (!task.started_at)  return null

  const today = new Date()
  const daysElapsed = Math.max(1, differenceInDays(today, new Date(task.started_at)))
  const pct = progressPct(task, milestones)

  let completed: number
  let target: number

  if (isValue(task)) {
    if (!task.target_value || task.current_value == null) return null
    completed = task.current_value
    target    = task.target_value
  } else {
    if (!task.target_quantity || task.completed_quantity == null) return null
    completed = task.completed_quantity
    target    = task.target_quantity
  }

  const dailyThroughput = parseFloat((completed / daysElapsed).toFixed(2))
  if (dailyThroughput === 0) return null

  const remaining      = target - completed
  const daysToComplete = remaining <= 0 ? 0 : parseFloat((remaining / dailyThroughput).toFixed(1))
  const forecastDate   = addDays(today, Math.ceil(daysToComplete))
  const daysUntilDue   = task.due_date ? differenceInDays(new Date(task.due_date), today) : null

  const isOnTrack = daysUntilDue == null || daysToComplete <= daysUntilDue
  const isAtRisk  = !isOnTrack && daysUntilDue != null && daysToComplete <= daysUntilDue * 1.25
  const isBehind  = !isOnTrack && !isAtRisk

  return { dailyThroughput, remaining, daysToComplete, forecastDate, isOnTrack, isAtRisk, isBehind, daysUntilDue, pct }
}

// ── Remaining display ─────────────────────────────────────────────────────────

export function remainingLabel(task: Task): string {
  if (isValue(task)) {
    const rem = (task.target_value ?? 0) - (task.current_value ?? 0)
    return `${formatCurrency(rem, task.currency ?? 'INR')} remaining`
  }
  if (isQuantity(task)) {
    const rem = (task.target_quantity ?? 0) - (task.completed_quantity ?? 0)
    return `${formatQuantity(Math.max(0, rem))} ${task.unit ?? ''} remaining`.trim()
  }
  return ''
}

// ── Currency helpers ──────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED ',
}

export function currencySymbol(code: CurrencyCode): string {
  return CURRENCY_SYMBOLS[code] ?? code
}

export function formatCurrency(n: number, code: CurrencyCode = 'INR'): string {
  const sym = currencySymbol(code)
  if (code === 'INR') {
    if (n >= 10_000_000) return `${sym}${(n / 10_000_000).toFixed(2)}Cr`
    if (n >= 100_000)    return `${sym}${(n / 100_000).toFixed(2)}L`
  }
  if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${sym}${(n / 1_000).toFixed(1)}K`
  return `${sym}${n.toLocaleString()}`
}

// ── Summary string ────────────────────────────────────────────────────────────

export function progressSummary(task: Task, milestones?: Milestone[]): string {
  if (isMilestone(task)) {
    const ms   = (milestones ?? []).filter((m) => m.task_id === task.id)
    const done = ms.filter((m) => m.completed).length
    return `${done} / ${ms.length} milestones`
  }
  if (isValue(task)) {
    const cur = formatCurrency(task.current_value ?? 0, task.currency ?? 'INR')
    const tgt = formatCurrency(task.target_value  ?? 0, task.currency ?? 'INR')
    return `${cur} / ${tgt}`
  }
  return `${formatQuantity(task.completed_quantity ?? 0)} / ${formatQuantity(task.target_quantity ?? 0)} ${task.unit ?? ''}`.trim()
}

// ── Labels & colours ──────────────────────────────────────────────────────────

export function forecastLabel(forecast: ForecastResult): string {
  if (forecast.daysToComplete <= 0) return 'Complete'
  if (forecast.isOnTrack) return `On Track · ${Math.ceil(forecast.daysToComplete)}d remaining`
  if (forecast.isAtRisk)  return `At Risk · ${Math.ceil(forecast.daysToComplete)}d (due in ${forecast.daysUntilDue}d)`
  return `Behind · ${Math.ceil(forecast.daysToComplete)}d needed, ${forecast.daysUntilDue}d remain`
}

export function forecastColor(forecast: ForecastResult): string {
  if (forecast.daysToComplete <= 0) return 'text-emerald-600'
  if (forecast.isOnTrack) return 'text-emerald-600'
  if (forecast.isAtRisk)  return 'text-amber-600'
  return 'text-red-600'
}

export function forecastBg(forecast: ForecastResult): string {
  if (forecast.daysToComplete <= 0) return 'bg-emerald-100 text-emerald-700'
  if (forecast.isOnTrack) return 'bg-emerald-100 text-emerald-700'
  if (forecast.isAtRisk)  return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export function progressBarColor(pct: number): string {
  if (pct >= 75) return 'bg-emerald-500'
  if (pct >= 50) return 'bg-blue-500'
  if (pct >= 25) return 'bg-amber-500'
  return 'bg-red-500'
}

export function formatQuantity(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export function forecastDateStr(forecast: ForecastResult): string {
  return format(forecast.forecastDate, 'MMM d')
}
