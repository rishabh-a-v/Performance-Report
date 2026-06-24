import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { UNBILLED_REPORTS, BRANCHES, PROFILES } from '@/lib/mockData'
import { formatCurrency } from '@/lib/kpiEngine'
import { cn } from '@/lib/utils'
import { AlertTriangle, FileX, DollarSign, ShieldAlert, Percent, TrendingDown } from 'lucide-react'

export function UnbilledMonitor() {
  const reports = UNBILLED_REPORTS

  const totalUnbilledJobs  = reports.reduce((s, r) => s + r.completed_jobs_not_billed, 0)
  const totalUnbilledValue = reports.reduce((s, r) => s + r.unbilled_job_value, 0)
  const totalDamages       = reports.reduce((s, r) => s + r.damages_pending, 0)
  const totalDamageValue   = reports.reduce((s, r) => s + r.damage_value, 0)
  const totalPendingPOs    = reports.reduce((s, r) => s + r.pending_pos, 0)
  const totalPOValue       = reports.reduce((s, r) => s + r.pending_po_value, 0)

  // KPI: Billing Efficiency = billed / total completed
  const billedJobs    = reports.reduce((s, r) => s + r.billed_jobs, 0)
  const totalComplete = reports.reduce((s, r) => s + r.total_completed_jobs, 0)
  const billingEff    = totalComplete > 0 ? Math.round((billedJobs / totalComplete) * 100) : 0

  // KPI: Damage Resolution Rate
  const resolvedDamages = reports.reduce((s, r) => s + r.resolved_damages, 0)
  const allDamages      = totalDamages + resolvedDamages
  const damageResRate   = allDamages > 0 ? Math.round((resolvedDamages / allDamages) * 100) : 0

  // KPI: PO Closure Rate
  const closedPOs   = reports.reduce((s, r) => s + r.closed_pos, 0)
  const allPOs      = totalPendingPOs + closedPOs
  const poClosureRate = allPOs > 0 ? Math.round((closedPOs / allPOs) * 100) : 0

  // Per-branch breakdown
  const branchRows = reports.map((r) => {
    const branch    = BRANCHES.find((b) => b.id === r.branch_id)
    const submitted = PROFILES.find((p) => p.id === r.employee_id)
    const branchBillingEff = r.total_completed_jobs > 0
      ? Math.round((r.billed_jobs / r.total_completed_jobs) * 100)
      : 0
    const branchDamageRes = (r.damages_pending + r.resolved_damages) > 0
      ? Math.round((r.resolved_damages / (r.damages_pending + r.resolved_damages)) * 100)
      : 100
    const isHighRisk = r.unbilled_job_value > 1000000 || r.damages_pending >= 4
    return { r, branch, submitted, branchBillingEff, branchDamageRes, isHighRisk }
  }).sort((a, b) => b.r.unbilled_job_value - a.r.unbilled_job_value)

  const highRiskBranches = branchRows.filter((b) => b.isHighRisk)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Unbilled Monitor</h1>
        <p className="mt-0.5 text-xs text-slate-500">Track pending billing, PO closure, and damage resolution across branches</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Unbilled Jobs"     value={totalUnbilledJobs}                       icon={FileX}        iconColor="text-orange-600" invertDelta />
        <KPICard title="Unbilled Exposure" value={formatCurrency(totalUnbilledValue, 'INR')} icon={DollarSign}  iconColor="text-red-600" invertDelta />
        <KPICard title="Billing Efficiency" value={`${billingEff}%`}                        icon={Percent}     iconColor="text-emerald-600" />
        <KPICard title="Damage Claims"     value={totalDamages}                              icon={AlertTriangle} iconColor="text-red-500" invertDelta />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Damage Resolution Rate</p>
          <p className="text-xl font-bold text-slate-900">{damageResRate}%</p>
          <ProgressBar value={damageResRate} size="sm" />
          <p className="text-[10px] text-slate-400">{resolvedDamages} resolved of {allDamages} total</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">PO Closure Rate</p>
          <p className="text-xl font-bold text-slate-900">{poClosureRate}%</p>
          <ProgressBar value={poClosureRate} size="sm" />
          <p className="text-[10px] text-slate-400">{closedPOs} closed of {allPOs} total</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Pending PO Value</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalPOValue, 'INR')}</p>
          <p className="text-[10px] text-slate-400">{totalPendingPOs} open purchase orders</p>
        </div>
      </div>

      {/* Branch table */}
      <Card padding={false}>
        <div className="border-b border-slate-100 p-4 flex items-center justify-between">
          <CardTitle>Unbilled Exposure by Branch</CardTitle>
          <span className="text-xs text-slate-400">As of 22 Jun 2026</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Branch</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Pending POs</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-500">PO Value</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Unbilled Jobs</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Unbilled Value</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Damages</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Billing Eff.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {branchRows.map(({ r, branch, branchBillingEff, isHighRisk }) => (
                <tr key={r.id} className={cn('hover:bg-slate-50/60', isHighRisk && 'bg-red-50/20')}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {isHighRisk && <AlertTriangle size={11} className="text-red-500 shrink-0" />}
                      <div>
                        <p className="font-semibold text-slate-800">{branch?.name}</p>
                        {r.remarks && <p className="text-[10px] text-amber-600 mt-0.5">{r.remarks}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums">{r.pending_pos}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{formatCurrency(r.pending_po_value, 'INR')}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums">{r.completed_jobs_not_billed}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={cn('font-bold tabular-nums', r.unbilled_job_value > 1000000 ? 'text-red-600' : 'text-slate-900')}>
                      {formatCurrency(r.unbilled_job_value, 'INR')}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn(
                      'inline-block rounded-full px-2 py-0.5 font-semibold text-[10px]',
                      r.damages_pending >= 4 ? 'bg-red-100 text-red-700' :
                      r.damages_pending >= 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600',
                    )}>
                      {r.damages_pending}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className={cn('font-semibold', branchBillingEff >= 80 ? 'text-emerald-600' : 'text-amber-600')}>
                        {branchBillingEff}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Risk panel */}
      {highRiskBranches.length > 0 && (
        <Card className="border-red-200 bg-red-50/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-red-600" />
              <CardTitle className="text-red-800">High Unbilled Exposure Risk</CardTitle>
            </div>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              {highRiskBranches.length} branch{highRiskBranches.length > 1 ? 'es' : ''}
            </span>
          </CardHeader>
          <div className="space-y-2">
            {highRiskBranches.map(({ r, branch }) => (
              <div key={r.id} className="rounded-lg border border-red-200 bg-white p-3">
                <p className="text-xs font-semibold text-red-800">{branch?.name} — Unbilled: {formatCurrency(r.unbilled_job_value, 'INR')}</p>
                <p className="mt-0.5 text-[11px] text-red-600">
                  {r.completed_jobs_not_billed} jobs completed but not billed · {r.damages_pending} damage claims outstanding
                  {r.remarks ? ` · ${r.remarks}` : ''}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
