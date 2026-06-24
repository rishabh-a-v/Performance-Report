import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DPR_REPORTS, BRANCHES, PROFILES } from '@/lib/mockData'
import { formatCurrency } from '@/lib/kpiEngine'
import { cn } from '@/lib/utils'
import {
  TrendingUp, CheckSquare, AlertTriangle, DollarSign, Phone,
  MapPin, Clock, Trophy, ChevronUp, ChevronDown,
} from 'lucide-react'

type SortKey = 'revenue' | 'jobs' | 'billing_eff' | 'followup'

function DeltaChip({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-semibold', up ? 'text-emerald-600' : 'text-red-600')}>
      {up ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      {Math.abs(value).toLocaleString()}
    </span>
  )
}

export function BranchPerformance() {
  const [sortKey, setSortKey] = useState<SortKey>('revenue')
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)

  const today     = '2026-06-22'
  const yesterday = '2026-06-21'
  const todayDPRs  = DPR_REPORTS.filter((r) => r.report_date === today)
  const yesterdayDPRs = DPR_REPORTS.filter((r) => r.report_date === yesterday)

  const totalRevenue    = todayDPRs.reduce((s, r) => s + r.daily_revenue, 0)
  const totalJobs       = todayDPRs.reduce((s, r) => s + r.jobs_completed, 0)
  const totalDelayed    = todayDPRs.reduce((s, r) => s + r.jobs_delayed, 0)
  const totalFollowups  = todayDPRs.reduce((s, r) => s + r.customer_followups, 0)
  const totalPendingBilling = todayDPRs.reduce((s, r) => s + r.pending_billing, 0)

  const branchRows = BRANCHES.map((branch) => {
    const dpr  = todayDPRs.find((r) => r.branch_id === branch.id)
    const ydpr = yesterdayDPRs.find((r) => r.branch_id === branch.id)
    if (!dpr) return null
    const submittedBy = PROFILES.find((p) => p.id === dpr.submitted_by)
    const totalJobsHere = dpr.jobs_completed + dpr.jobs_open
    const billingEff = totalJobsHere > 0 ? Math.round((dpr.jobs_completed / totalJobsHere) * 100) : 0
    const revenueVsYday = ydpr ? dpr.daily_revenue - ydpr.daily_revenue : 0
    const jobsVsYday    = ydpr ? dpr.jobs_completed - ydpr.jobs_completed : 0
    return { branch, dpr, ydpr, submittedBy, billingEff, revenueVsYday, jobsVsYday }
  }).filter(Boolean) as NonNullable<ReturnType<typeof BRANCHES['map']>[0]>[]

  const sorted = [...branchRows].sort((a: any, b: any) => {
    if (sortKey === 'revenue')     return b.dpr.daily_revenue - a.dpr.daily_revenue
    if (sortKey === 'jobs')        return b.dpr.jobs_completed - a.dpr.jobs_completed
    if (sortKey === 'billing_eff') return b.billingEff - a.billingEff
    if (sortKey === 'followup')    return b.dpr.customer_followups - a.dpr.customer_followups
    return 0
  }) as typeof branchRows

  const topBranch = sorted[0] as any
  const selected  = selectedBranch ? (sorted.find((b: any) => b.branch.id === selectedBranch) as any) : null

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => setSortKey(k)}
      className={cn(
        'rounded px-2.5 py-1 text-[11px] font-semibold transition-colors',
        sortKey === k ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100',
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Branch Performance</h1>
        <p className="mt-0.5 text-xs text-slate-500">Daily Performance Reports — revenue, jobs, and customer follow-ups by branch</p>
      </div>

      {/* Company totals */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Total Revenue (Today)"   value={formatCurrency(totalRevenue, 'INR')} icon={DollarSign}   iconColor="text-emerald-600" />
        <KPICard title="Jobs Completed"          value={totalJobs}                            icon={CheckSquare}  iconColor="text-brand-600" />
        <KPICard title="Jobs Delayed"            value={totalDelayed}                         icon={AlertTriangle} iconColor="text-red-500" invertDelta />
        <KPICard title="Customer Follow-ups"     value={totalFollowups}                       icon={Phone}        iconColor="text-purple-600" />
      </div>
      <KPICard
        title="Pending Billing (Today)"
        value={formatCurrency(totalPendingBilling, 'INR')}
        icon={Clock}
        iconColor="text-amber-600"
        subtitle="Across all branches"
        invertDelta
      />

      {/* Top performer callout */}
      {topBranch && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-3">
          <Trophy size={18} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-800">Top Performing Branch Today</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {topBranch.branch.name} — {formatCurrency(topBranch.dpr.daily_revenue, 'INR')} revenue · {topBranch.dpr.jobs_completed} jobs completed
            </p>
          </div>
        </div>
      )}

      {/* Rankings table */}
      <Card padding={false}>
        <div className="border-b border-slate-100 p-4 flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Branch Rankings</CardTitle>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 mr-1">Sort by:</span>
            <SortBtn k="revenue"     label="Revenue" />
            <SortBtn k="jobs"        label="Jobs" />
            <SortBtn k="billing_eff" label="Efficiency" />
            <SortBtn k="followup"    label="Follow-ups" />
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {sorted.map((row: any, idx: number) => {
            const { branch, dpr, billingEff, revenueVsYday, jobsVsYday } = row
            const isSelected = selectedBranch === branch.id
            return (
              <div
                key={branch.id}
                className={cn('px-4 py-3 cursor-pointer hover:bg-slate-50/60 transition-colors', isSelected && 'bg-blue-50/40')}
                onClick={() => setSelectedBranch(isSelected ? null : branch.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-slate-100 text-slate-600' :
                    idx === 2 ? 'bg-orange-50 text-orange-600' :
                                'bg-white border border-slate-200 text-slate-400',
                  )}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin size={11} className="text-slate-400 shrink-0" />
                        <p className="text-sm font-semibold text-slate-900">{branch.name}</p>
                        {dpr.jobs_delayed > 2 && (
                          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                            {dpr.jobs_delayed} delayed
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(dpr.daily_revenue, 'INR')}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-4 flex-wrap">
                      <span className="text-xs text-slate-500">
                        Jobs: <strong className="text-slate-800">{dpr.jobs_completed}</strong> <DeltaChip value={jobsVsYday} />
                      </span>
                      <span className="text-xs text-slate-500">
                        Revenue <DeltaChip value={revenueVsYday} />
                      </span>
                      <span className="text-xs text-slate-500">
                        Eff: <strong className={cn(billingEff >= 75 ? 'text-emerald-600' : 'text-amber-600')}>{billingEff}%</strong>
                      </span>
                      <span className="text-xs text-slate-500">
                        Follow-ups: <strong className="text-slate-800">{dpr.customer_followups}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isSelected && (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-100 pt-3">
                    <div className="rounded-lg bg-slate-50 p-2.5 space-y-0.5">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Pending Billing</p>
                      <p className="text-sm font-bold text-amber-700">{formatCurrency(dpr.pending_billing, 'INR')}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5 space-y-0.5">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Damage Claims</p>
                      <p className="text-sm font-bold text-red-600">{formatCurrency(dpr.pending_damage_claims, 'INR')}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5 space-y-0.5">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Jobs Open</p>
                      <p className="text-sm font-bold text-slate-800">{dpr.jobs_open}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5 space-y-0.5">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Jobs Delayed</p>
                      <p className={cn('text-sm font-bold', dpr.jobs_delayed > 2 ? 'text-red-600' : 'text-slate-800')}>{dpr.jobs_delayed}</p>
                    </div>
                    {dpr.challenges && (
                      <div className="col-span-2 sm:col-span-4 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                        <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Challenges</p>
                        <p className="text-xs text-amber-800">{dpr.challenges}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
