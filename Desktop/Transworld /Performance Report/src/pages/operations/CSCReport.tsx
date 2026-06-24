import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/contexts/AuthContext'
import { CSC_REPORTS, PROFILES, BRANCHES } from '@/lib/mockData'
import { computeCSCKPIs } from '@/lib/scoreEngine'
import { cn } from '@/lib/utils'
import {
  Phone, Package, Truck, BarChart3, Users, AlertTriangle, CheckCircle2,
} from 'lucide-react'

const ROLE_ORDER: Record<string, number> = { executive: 0, manager: 1, director: 2, managing_director: 3 }

interface FormState {
  hhg_packing_jobs: string
  customers_called_packing: string
  or_dc_commercial_moves: string
  customers_called_move: string
  in_transit_shipments: string
  customers_called_transit: string
  challenges: string
}

const EMPTY: FormState = {
  hhg_packing_jobs: '', customers_called_packing: '',
  or_dc_commercial_moves: '', customers_called_move: '',
  in_transit_shipments: '', customers_called_transit: '',
  challenges: '',
}

function CoverageIndicator({ rate, label }: { rate: number; label: string }) {
  const color = rate >= 90 ? 'text-emerald-600' : rate >= 70 ? 'text-amber-600' : 'text-red-600'
  const bg    = rate >= 90 ? 'bg-emerald-50' : rate >= 70 ? 'bg-amber-50' : 'bg-red-50'
  return (
    <div className={cn('rounded-lg p-3 flex flex-col gap-1', bg)}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className={cn('text-xl font-bold', color)}>{rate}%</span>
      <ProgressBar value={rate} size="sm" />
    </div>
  )
}

function EmployeeForm() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [submitted, setSubmitted] = useState(false)

  const num = (v: string) => parseInt(v || '0', 10)

  const preview = submitted ? computeCSCKPIs({
    hhg_packing_jobs: num(form.hhg_packing_jobs),
    customers_called_packing: num(form.customers_called_packing),
    or_dc_commercial_moves: num(form.or_dc_commercial_moves),
    customers_called_move: num(form.customers_called_move),
    in_transit_shipments: num(form.in_transit_shipments),
    customers_called_transit: num(form.customers_called_transit),
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 size={15} className="text-brand-600" />
              <CardTitle>Today's KPI Summary</CardTitle>
            </div>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CoverageIndicator rate={preview.packing_followup_rate}   label="Packing Follow-up" />
            <CoverageIndicator rate={preview.move_coordination_rate}  label="Move Coordination" />
            <CoverageIndicator rate={preview.transit_monitoring_rate} label="Transit Monitoring" />
            <CoverageIndicator rate={preview.daily_productivity_score} label="Productivity Score" />
          </div>
        </Card>
        <button
          onClick={() => { setForm(EMPTY); setSubmitted(false) }}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          ← Edit report
        </button>
      </div>
    )
  }

  const Field = ({ label, name, help }: { label: string; name: keyof FormState; help?: string }) => (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      {help && <p className="text-[10px] text-slate-400">{help}</p>}
      <input
        type="number"
        min={0}
        value={form[name]}
        onChange={set(name)}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        placeholder="0"
      />
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package size={15} className="text-brand-600" />
          <CardTitle>Submit Daily CSC Report</CardTitle>
        </div>
        <span className="text-xs text-slate-400">{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
      </CardHeader>
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <Package size={12} /> HHG Packing
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="HHG Packing Jobs Handled" name="hhg_packing_jobs" />
            <Field label="Customers Called (Packing)" name="customers_called_packing" />
          </div>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <Truck size={12} /> Move Coordination
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="OR / DC / Commercial Moves" name="or_dc_commercial_moves" />
            <Field label="Customers Called (Move)" name="customers_called_move" />
          </div>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <Phone size={12} /> Transit Follow-up
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="HHG / Commercial Shipments In Transit" name="in_transit_shipments" />
            <Field label="Customers Called (Transit)" name="customers_called_transit" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Challenges / Remarks</label>
          <textarea
            rows={3}
            value={form.challenges}
            onChange={set('challenges')}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
            placeholder="Optional — describe any challenges faced today"
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
  const todayReports = CSC_REPORTS.filter((r) => r.report_date === today)

  const rows = PROFILES.filter((p) => p.department_id === 'd6').map((emp) => {
    const report = todayReports.find((r) => r.employee_id === emp.id)
    const kpis   = report ? computeCSCKPIs(report) : null
    const branch = BRANCHES.find((b) => b.id === (report?.branch_id ?? ''))
    return { emp, report, kpis, branch }
  })

  const totalPackingJobs  = todayReports.reduce((s, r) => s + r.hhg_packing_jobs, 0)
  const totalTransit      = todayReports.reduce((s, r) => s + r.in_transit_shipments, 0)
  const totalCallsMade    = todayReports.reduce((s, r) => s + r.customers_called_packing + r.customers_called_move + r.customers_called_transit, 0)
  const avgProductivity   = rows.filter((r) => r.kpis).length
    ? Math.round(rows.filter((r) => r.kpis).reduce((s, r) => s + (r.kpis!.daily_productivity_score), 0) / rows.filter((r) => r.kpis).length)
    : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Team Size"         value={rows.length}         icon={Users}     iconColor="text-blue-600" />
        <KPICard title="Reports Submitted" value={todayReports.length} icon={CheckCircle2} iconColor="text-emerald-600" />
        <KPICard title="Total Calls Today" value={totalCallsMade}      icon={Phone}     iconColor="text-brand-600" />
        <KPICard title="Avg Productivity"  value={`${avgProductivity}%`} icon={BarChart3} iconColor="text-purple-600" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KPICard title="HHG Packing Jobs (Today)" value={totalPackingJobs} icon={Package} iconColor="text-amber-600" />
        <KPICard title="Shipments In Transit"      value={totalTransit}    icon={Truck}   iconColor="text-cyan-600" />
      </div>

      <Card padding={false}>
        <div className="border-b border-slate-100 p-4 flex items-center justify-between">
          <CardTitle>CSC Team KPIs — Today</CardTitle>
          <span className="text-xs text-slate-400">{new Date('2026-06-22').toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Employee</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Branch</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Packing Jobs</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Calls Made</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Packing %</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Move %</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Transit %</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(({ emp, report, kpis, branch }) => {
                const totalCalls = report
                  ? report.customers_called_packing + report.customers_called_move + report.customers_called_transit
                  : 0
                const missedTransit = report && kpis && kpis.transit_monitoring_rate < 70
                return (
                  <tr key={emp.id} className={cn('hover:bg-slate-50/60', missedTransit && 'bg-red-50/30')}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {missedTransit && <AlertTriangle size={11} className="text-red-500 shrink-0" />}
                        <div>
                          <p className="font-semibold text-slate-800">{emp.full_name}</p>
                          <p className="text-[10px] text-slate-400">{emp.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{branch?.city ?? '—'}</td>
                    <td className="px-3 py-2.5 text-center tabular-nums">{report?.hhg_packing_jobs ?? '—'}</td>
                    <td className="px-3 py-2.5 text-center tabular-nums">{report ? totalCalls : '—'}</td>
                    {kpis ? (
                      <>
                        <td className="px-3 py-2.5 text-center">
                          <span className={cn('font-semibold', kpis.packing_followup_rate >= 80 ? 'text-emerald-600' : 'text-amber-600')}>
                            {kpis.packing_followup_rate}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={cn('font-semibold', kpis.move_coordination_rate >= 80 ? 'text-emerald-600' : 'text-amber-600')}>
                            {kpis.move_coordination_rate}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={cn('font-semibold', kpis.transit_monitoring_rate >= 70 ? 'text-emerald-600' : 'text-red-600')}>
                            {kpis.transit_monitoring_rate}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={cn(
                            'inline-block rounded-full px-2 py-0.5 font-bold text-[11px]',
                            kpis.daily_productivity_score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                            kpis.daily_productivity_score >= 60 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700',
                          )}>
                            {kpis.daily_productivity_score}
                          </span>
                        </td>
                      </>
                    ) : (
                      <td colSpan={4} className="px-3 py-2.5 text-center text-slate-400 italic">No report submitted</td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Alerts */}
      {rows.some((r) => r.kpis && r.kpis.transit_monitoring_rate < 70) && (
        <Card className="border-red-200 bg-red-50/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-600" />
              <CardTitle className="text-red-800">Attention Required</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-2">
            {rows.filter((r) => r.kpis && r.kpis.transit_monitoring_rate < 70).map(({ emp, kpis }) => (
              <div key={emp.id} className="rounded-lg border border-red-200 bg-white p-3">
                <p className="text-xs font-semibold text-red-800">{emp.full_name} — Transit monitoring at {kpis!.transit_monitoring_rate}%</p>
                <p className="mt-0.5 text-[11px] text-red-600">Below 70% threshold — missed follow-ups may impact customer satisfaction.</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export function CSCReport() {
  const { role } = useAuth()
  const roleLevel = ROLE_ORDER[role ?? 'executive'] ?? 0
  const isManager = roleLevel >= ROLE_ORDER['manager']
  const [tab, setTab] = useState<'report' | 'team'>(isManager ? 'team' : 'report')

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-bold text-slate-900">CSC Daily Report</h1>
        <p className="mt-0.5 text-xs text-slate-500">Customer Service Center — packing, moves, and transit follow-ups</p>
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
