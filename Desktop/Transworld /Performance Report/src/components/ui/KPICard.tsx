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
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
        {Icon && (
          <span className={cn('rounded-lg bg-slate-50 p-2', iconColor)}>
            <Icon size={16} />
          </span>
        )}
      </div>

      <div>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>

      {deltaLabel && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', deltaPositive ? 'text-emerald-600' : 'text-red-500')}>
          <span>{deltaPositive ? '↑' : '↓'}</span>
          <span>{deltaLabel} vs last week</span>
        </div>
      )}
    </div>
  )
}
