import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'default' | 'warn' | 'danger' | 'success'

const TONE_VALUE: Record<Tone, string> = {
  default: 'text-foreground',
  warn:    'text-amber-600 dark:text-amber-400',
  danger:  'text-red-600 dark:text-red-400',
  success: 'text-emerald-600 dark:text-emerald-400',
}

/**
 * Compact stat pill — replaces the old 4-card KPI grids. When `onClick` is
 * given the chip doubles as a filter toggle (`active` renders it selected).
 */
export function StatChip({
  label,
  value,
  tone = 'default',
  onClick,
  active,
}: {
  label: string
  value: number
  tone?: Tone
  onClick?: () => void
  active?: boolean
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground',
        onClick && !active && 'hover:bg-muted hover:text-foreground cursor-pointer',
      )}
    >
      {label}
      <span className={cn('font-semibold tabular-nums', active ? 'text-primary' : TONE_VALUE[tone])}>
        {value}
      </span>
    </Comp>
  )
}

export function StatChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}
