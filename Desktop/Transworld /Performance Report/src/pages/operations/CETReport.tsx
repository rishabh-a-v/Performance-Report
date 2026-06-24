import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/contexts/AuthContext'
import { CET_REPORTS, PROFILES, BRANCHES } from '@/lib/mockData'
import { computeCETKPIs } from '@/lib/scoreEngine'
import { formatCurrency } from '@/lib/kpiEngine'
import { cn } from '@/lib/utils'
import {
  FileText, CheckCircle2, Clock, TrendingUp, DollarSign, Users, BarChart3, Star,
} from 'lucide-react'

const ROLE_ORDER: Record<string, number> = { executive: 0, manager: 1, director: 2, managing_director: 3 }

interface FormState {
  estimations_reviewed: string
  estimations_corrected: string
  jobs_confirmed: string
  quotes_pending: string
  total_estimate_value: string
  challenges: string
}

const EMPTY: FormState = {
  estimations_reviewed: '', estimations_corrected: '',
  jobs_confirmed: '', quotes_pending: '', total_estimate_value: '', challenges: '',
}

function MetricRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-600">{label}</span>
      <div className="text-right">
        <span className="text-sm font-bold text-slate-900">{value}</span>
        {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
      </div>
    </div>
  )
}

function EmployeeForm() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [submitted, setSubmitted] = useState(false)

  const num = (v: string) => parseInt(v || '0', 10)

  const preview = submitted ? computeCETKPIs({
    estimations_reviewed:  num(form.estimations_reviewed),
    estimations_corrected: num(form.estimations_corrected),
    jobs_confirmed:        num(form.jobs_confirmed),
    quotes_pending:        num(form.quotes_pending),
    total_estimate_value:  parseFloat(form.total_estimate_value || '0'),
  }) : null

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  if (submitted && preview) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800">Report submitted for {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <KPICard title="Reviews Completed"    value={preview.review_productivity} icon={FileText}   iconColor="text-blue-600" />
          <KPICard title="Conversion Rate"      value={`${preview.conversion_rate}%`} icon={TrendingUp} iconColor="text-emerald-600" />
          <KPICard title="Correction Accuracy"  value={`${preview.correction_accuracy}%`} icon={Star} iconColor="text-amber-600" />
          <KPICard title="Pending Quotes"       value={preview.quote_backlog}       icon={Clock}      iconColor="text-orange-600" />
          <KPICard title="Revenue Generated"    value={formatCurrency(preview.revenue_generated, 'INR')} icon={DollarSign} iconColor="text-emerald-600" />
        </div>
        <button
          onClick={() => { setForm(EMPTY); setSubmitted(false) }}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          ← Edit report
        </button>
      </div>
    )
  }

  const Field = ({ label, name, currency }: { label: string; name: keyof FormState; currency?: boolean }) => (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <div className="relative">
        {currency && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>}
        <input
          type="number"
          min={0}
          value={form[name]}
          onChange={set(name)}
          className={cn(
            'w-full rounded-md border border-slate-200 bg-white py-2 text-sm text-slate-900 placeholder-slate-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
            currency ? 'pl-7 pr-3' : 'px-3',
          )}
          placeholder="0"
        />
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-brand-600" />
          <CardTitle>Submit Daily CET Report</CardTitle>
        </div>
        <span className="text-xs text-slate-400">{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
      </CardHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Estimations Reviewed"  name="estimations_reviewed" />
          <Field label="Estimations Corrected" name="estimations_corrected" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Jobs Confirmed"  name="jobs_confirmed" />
          <Field label="Quotes Pending"  name="quotes_pending" />
        </div>
        <Field label="Total Estimate Value (₹)" name="total_estimate_value" currency />
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Challenges / Remarks</label>
          <textarea
            rows={3}
            value={form.challenges}
            onChange={set('challenges')}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
            placeholder="Optional"
          />
        </div>
        <button
          onClick={() => setSubmitted(true)}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          Submit Report
        </button>
      </div>
    </Card>
  )
}

function ManagerView() {
  const today = '2026-06-22'
  const todayReports = CET_REPORTS.filter((r) => r.report_date === today)

  const rows = PROFILES.filter((p) => p.department_id === 'd7').map((emp) => {
    const report = todayReports.find((r) => r.employee_id === emp.id)
    const kpis   = report ? computeCETKPIs(report) : null
    const branch = BRANCHES.find((b) => b.id === (report?.branch_id ?? ''))
    return { emp, report, kpis, branch }
  })

  const totalReviewed   = todayReports.reduce((s, r) => s + r.estimations_reviewed, 0)
  const totalConfirmed  = todayReports.reduce((s, r) => s + r.jobs_confirmed, 0)
  const totalPending    = todayReports.reduce((s, r) => s + r.quotes_pending, 0)
  const totalValue      = todayReports.reduce((s, r) => s + r.total_estimate_value, 0)
  const avgConversion   = totalReviewed > 0 ? Math.round((totalConfirmed / totalReviewed) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Estimations Reviewed" value={totalReviewed}  icon={FileText}   iconColor="text-blue-600" />
        <KPICard title="Jobs Confirmed"        value={totalConfirmed} icon={CheckCircle2} iconColor="text-emerald-600" />
        <KPICard title="Quote Backlog"         value={totalPending}   icon={Clock}       iconColor="text-amber-600" invertDelta />
        <KPICard title="Team Conversion Rate"  value={`${avgConversion}%`} icon={TrendingUp} iconColor="text-brand-600" />
      </div>
      <KPICard
        title="Total Estimate Value (Today)"
        value={formatCurrency(totalValue, 'INR')}
        icon={DollarSign}
        iconColor="text-emerald-600"
        subtitle="Across all CET executives"
      />

      <Card padding={false}>
        <div className="border-b border-slate-100 p-4 flex items-center justify-between">
          <CardTitle>CET Team Metrics — Today</CardTitle>
          <span className="text-xs text-slate-400">{new Date('2026-06-22').toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Employee</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Reviewed</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Corrected</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Confirmed</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Pending</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Conversion</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Est. Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(({ emp, report, kpis }) => (
                <tr key={emp.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-slate-800">{emp.full_name}</p>
                    <p className="text-[10px] text-slate-400">{emp.designation}</p>
                  </td>
                  {kpis ? (
                    <>
                      <td className="px-3 py-2.5 text-center tabular-nums font-medium">{report!.estimations_reviewed}</td>
                      <td className="px-3 py-2.5 text-center tabular-nums">{report!.estimations_corrected}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="font-semibold text-emerald-700">{report!.jobs_confirmed}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn('font-semibold', report!.quotes_pending > 6 ? 'text-amber-600' : 'text-slate-700')}>
                          {report!.quotes_pending}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn(
                          'inline-block rounded-full px-2 py-0.5 font-bold text-[11px]',
                          kpis.conversion_rate >= 70 ? 'bg-emerald-100 text-emerald-700' :
                          kpis.conversion_rate >= 50 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700',
                        )}>
                          {kpis.conversion_rate}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(report!.total_estimate_value, 'INR')}
                      </td>
                    </>
                  ) : (
                    <td colSpan={6} className="px-3 py-2.5 text-center text-slate-400 italic">No report submitted</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Star performers */}
      {rows.filter((r) => r.kpis && r.kpis.conversion_rate >= 70).length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star size={14} className="text-emerald-600" />
              <CardTitle className="text-emerald-800">Star Performers Today</CardTitle>
            </div>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {rows.filter((r) => r.kpis && r.kpis.conversion_rate >= 70).map(({ emp, kpis }) => (
              <span key={emp.id} className="rounded-full bg-white border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                {emp.full_name} · {kpis!.conversion_rate}% conversion
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export function CETReport() {
  const { role } = useAuth()
  const roleLevel = ROLE_ORDER[role ?? 'executive'] ?? 0
  const isManager = roleLevel >= ROLE_ORDER['manager']
  const [tab, setTab] = useState<'report' | 'team'>(isManager ? 'team' : 'report')

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-bold text-slate-900">CET Daily Report</h1>
        <p className="mt-0.5 text-xs text-slate-500">Central Estimation Team — reviews, confirmations, and quote pipeline</p>
      </div>

      {isManager && (
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
          {(['team', 'report'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-md px-4 py-1.5 text-xs font-semibold transition-colors',
                tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {t === 'team' ? 'Team KPIs' : 'My Report'}
            </button>
          ))}
        </div>
      )}

      {tab === 'report' ? <EmployeeForm /> : <ManagerView />}
    </div>
  )
}
