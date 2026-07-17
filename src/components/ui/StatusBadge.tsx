import { cn } from '@/lib/utils'

type StatusVariant = 'neutral' | 'info' | 'warning' | 'success' | 'danger'

const STATUS_VARIANT: Record<string, StatusVariant> = {
  draft: 'neutral',
  'yet to start': 'neutral',
  active: 'info',
  'in progress': 'info',
  submitted: 'warning',
  'in review': 'warning',
  pending: 'warning',
  'deletion requested': 'warning',
  approved: 'success',
  completed: 'success',
  rejected: 'danger',
  overdue: 'danger',
  cancelled: 'danger',
}

const STATUS_DOT_CLASSES: Record<StatusVariant, string> = {
  neutral: 'bg-slate-400',
  info:    'bg-blue-500',
  warning: 'bg-amber-500',
  success: 'bg-emerald-500',
  danger:  'bg-red-500',
}

export function statusVariant(status: string): StatusVariant {
  return STATUS_VARIANT[status.toLowerCase().replace(/_/g, ' ')] ?? 'neutral'
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const variant = statusVariant(status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize border border-border bg-card text-foreground shadow-sm shrink-0',
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', STATUS_DOT_CLASSES[variant])} />
      {status.replace(/_/g, ' ')}
    </span>
  )
}
