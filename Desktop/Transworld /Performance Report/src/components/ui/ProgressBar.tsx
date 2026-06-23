import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'
import { progressBarColor } from '@/lib/kpiEngine'

// ── shadcn Progress primitive ─────────────────────────────────────────────────
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all duration-500"
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

// ── Domain ProgressBar (colour-coded, optional label) ─────────────────────────
interface ProgressBarProps {
  value: number
  showLabel?: boolean
  size?: 'xs' | 'sm' | 'md'
  className?: string
  colorOverride?: string
}

const heights: Record<string, string> = { xs: 'h-1', sm: 'h-1.5', md: 'h-2' }

function ProgressBar({ value, showLabel = true, size = 'md', className, colorOverride }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const color   = colorOverride ?? progressBarColor(clamped)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <ProgressPrimitive.Root
        className={cn('flex-1 overflow-hidden rounded-full bg-slate-100', heights[size])}
        value={clamped}
      >
        <ProgressPrimitive.Indicator
          className={cn('h-full transition-all duration-500', color)}
          style={{ width: `${clamped}%`, transform: 'none' }}
        />
      </ProgressPrimitive.Root>
      {showLabel && (
        <span className="w-9 text-right text-xs font-semibold tabular-nums text-muted-foreground">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  )
}

export { ProgressBar, Progress }
