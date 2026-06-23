import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  delta?: number   // % change vs last period
  icon?: LucideIcon
  iconColor?: string
  trend?: 'up' | 'down' | 'flat'
  invertDelta?: boolean   // for metrics where lower is better (blocked time, cycle time)
}

export function KPICard({ title, value, subtitle, delta, icon: Icon, iconColor = 'text-brand-600', trend, invertDelta }: KPICardProps) {
  const deltaPositive = invertDelta ? (delta ?? 0) <= 0 : (delta ?? 0) >= 0
  const deltaLabel = delta != null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%` : null

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
        {Icon && (
          <span className={cn('rounded bg-slate-50 p-1.5', iconColor)}>
            <Icon size={14} />
          </span>
        )}
      </div>
      <p className="text-xl font-semibold text-[#0f172a]">{value}</p>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
  )
}
