import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, differenceInHours } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateShort(date: string | Date) {
  return format(new Date(date), 'MMM d')
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy · h:mm a')
}

export function hoursBlocked(reportedAt: string): number {
  return differenceInHours(new Date(), new Date(reportedAt))
}

export function completionRate(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export function kpiScore(metrics: { completed: number; total: number; blockedHours: number; cycleTime: number | null }): number {
  const { completed, total, blockedHours, cycleTime } = metrics
  const rate = completionRate(completed, total)
  const blockerPenalty = Math.min(blockedHours / 8, 20)
  const cycleBonus = cycleTime != null && cycleTime < 24 ? 5 : 0
  return Math.max(0, Math.min(100, rate - blockerPenalty + cycleBonus))
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    backlog:     'bg-slate-100 text-slate-600',
    ready:       'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    blocked:     'bg-red-100 text-red-700',
    done:        'bg-emerald-100 text-emerald-700',
    pending:     'bg-yellow-100 text-yellow-700',
    processed:   'bg-emerald-100 text-emerald-700',
    overdue:     'bg-red-100 text-red-700',
    cancelled:   'bg-gray-100 text-gray-500',
    assigned:    'bg-blue-100 text-blue-700',
    completed:   'bg-emerald-100 text-emerald-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

export function priorityColor(priority: string) {
  const map: Record<string, string> = {
    low:      'text-slate-500',
    medium:   'text-blue-600',
    high:     'text-amber-600',
    critical: 'text-red-600',
  }
  return map[priority] ?? 'text-slate-500'
}

export function riskLevel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Low',      color: 'text-emerald-600' }
  if (score >= 60) return { label: 'Moderate', color: 'text-amber-600' }
  if (score >= 40) return { label: 'High',     color: 'text-orange-600' }
  return              { label: 'Critical',  color: 'text-red-600' }
}

export function currency(value: number, cur = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(value)
}

export function percent(value: number) {
  return `${value.toFixed(1)}%`
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function currentWeekLabel() {
  return format(new Date(), "'W'ww · yyyy")
}
