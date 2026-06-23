import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { Badge } from '@/components/ui/Badge'
import { TrendLine } from '@/components/charts/TrendLine'
import { INVOICES, AUDITS, FINANCE_KPIS, REVENUE_TREND, profileById } from '@/lib/mockData'
import { formatDate, formatRelative, currency, percent, statusColor, cn } from '@/lib/utils'
import { DollarSign, FileText, CheckSquare, Clock, TrendingUp, AlertCircle } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  processed: 'bg-emerald-100 text-emerald-700',
  pending:   'bg-amber-100 text-amber-700',
  overdue:   'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState<'billing' | 'audits' | 'kpis'>('billing')

  const totalInvoiced   = INVOICES.reduce((s, i) => s + i.amount, 0)
  const totalProcessed  = INVOICES.filter((i) => i.status === 'processed').reduce((s, i) => s + i.amount, 0)
  const totalPending    = INVOICES.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
  const totalOverdue    = INVOICES.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
  const collectionRate  = Math.round((totalProcessed / totalInvoiced) * 100)

  const auditDone       = AUDITS.filter((a) => a.status === 'completed').length
  const auditTotal      = AUDITS.length
  const auditRate       = Math.round((auditDone / auditTotal) * 100)

  const latestKPI = FINANCE_KPIS[FINANCE_KPIS.length - 1]
  const prevKPI   = FINANCE_KPIS[0]

  const TABS = [
    { id: 'billing', label: 'Billing & Invoices', icon: DollarSign },
    { id: 'audits',  label: 'Audits',             icon: FileText },
    { id: 'kpis',    label: 'KPIs & Trends',      icon: TrendingUp },
  ] as const

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Total Invoiced"   value={currency(totalInvoiced)}  icon={DollarSign}  iconColor="text-blue-600" />
        <KPICard title="Collection Rate"  value={`${collectionRate}%`}     icon={TrendingUp}  delta={-3.5} iconColor="text-emerald-600" invertDelta={false} />
        <KPICard title="Pending"          value={currency(totalPending)}   icon={Clock}       iconColor="text-amber-600" />
        <KPICard title="Overdue"          value={currency(totalOverdue)}   icon={AlertCircle} iconColor="text-red-500" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all',
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800',
            )}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Billing tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Invoice status summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(['processed', 'pending', 'overdue', 'cancelled'] as const).map((status) => {
              const count = INVOICES.filter((i) => i.status === status).length
              const amt   = INVOICES.filter((i) => i.status === status).reduce((s, i) => s + i.amount, 0)
              return (
                <div key={status} className={cn('rounded-xl border p-4', STATUS_COLORS[status].replace('text-', 'border-').split(' ')[0].replace('bg-', 'border-'), STATUS_COLORS[status])}>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70 capitalize">{status}</p>
                  <p className="mt-1 text-2xl font-bold">{count}</p>
                  <p className="text-xs opacity-80">{currency(amt)}</p>
                </div>
              )
            })}
          </div>

          {/* Revenue trend */}
          <Card>
            <CardHeader><CardTitle>Revenue Trend — 2026</CardTitle></CardHeader>
            <TrendLine
              data={REVENUE_TREND}
              xKey="month"
              series={[
                { key: 'invoiced',  color: '#5568f5', label: 'Invoiced' },
                { key: 'collected', color: '#10b981', label: 'Collected' },
              ]}
              yFormatter={(v) => v >= 10_000_000 ? `₹${(v / 10_000_000).toFixed(1)}Cr` : v >= 100_000 ? `₹${(v / 100_000).toFixed(0)}L` : `₹${(v / 1_000).toFixed(0)}K`}
            />
          </Card>

          {/* Invoice table */}
          <Card padding={false}>
            <div className="border-b border-slate-100 p-4">
              <CardTitle>All Invoices</CardTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/80">
                    {['Invoice #', 'Client', 'Amount', 'Issued', 'Due', 'Paid', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INVOICES.map((inv) => (
                    <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{inv.client_name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{currency(inv.amount)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(inv.issued_date)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(inv.due_date)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{inv.paid_date ? formatDate(inv.paid_date) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-600')}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Audits tab */}
      {activeTab === 'audits' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-500">Total Audits</p>
              <p className="mt-1.5 text-3xl font-bold text-blue-700">{auditTotal}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Completed</p>
              <p className="mt-1.5 text-3xl font-bold text-emerald-700">{auditDone}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-600">In Progress</p>
              <p className="mt-1.5 text-3xl font-bold text-amber-700">{AUDITS.filter((a) => a.status === 'in_progress').length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Completion Rate</p>
              <p className="mt-1.5 text-3xl font-bold text-slate-700">{auditRate}%</p>
            </div>
          </div>

          <Card padding={false}>
            <div className="border-b border-slate-100 p-4">
              <CardTitle>Audit Register</CardTitle>
            </div>
            <div className="divide-y divide-slate-50">
              {AUDITS.map((audit) => {
                const assignee = profileById(audit.assigned_to)
                const isOverdue = audit.due_date && new Date(audit.due_date) < new Date() && audit.status !== 'completed'
                return (
                  <div key={audit.id} className="px-4 py-3 hover:bg-slate-50/60">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{audit.title}</p>
                        <p className="text-xs text-slate-400">
                          Assigned to {assignee?.full_name ?? '—'} · Due {audit.due_date ? formatDate(audit.due_date) : '—'}
                          {isOverdue && <span className="ml-2 text-red-600 font-semibold">Overdue</span>}
                        </p>
                      </div>
                      <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', statusColor(audit.status))}>
                        {audit.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* KPIs tab */}
      {activeTab === 'kpis' && latestKPI && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[
              { label: 'DSO (Days)',              value: latestKPI.dso_days,                    prev: prevKPI?.dso_days,                    unit: 'd',  invert: true },
              { label: 'Invoice Processing',      value: latestKPI.invoice_processing_time_hrs, prev: prevKPI?.invoice_processing_time_hrs, unit: 'h',  invert: true },
              { label: 'Cost Per Invoice',        value: latestKPI.cost_per_invoice,            prev: prevKPI?.cost_per_invoice,            unit: '₹',  invert: true },
              { label: 'Audit Completion Rate',   value: latestKPI.audit_completion_rate,       prev: prevKPI?.audit_completion_rate,       unit: '%',  invert: false },
              { label: 'Collection Rate',         value: latestKPI.collection_rate,             prev: prevKPI?.collection_rate,             unit: '%',  invert: false },
            ].map((kpi) => {
              const delta = kpi.prev != null && kpi.value != null
                ? Math.round(((kpi.value - kpi.prev) / kpi.prev) * 1000) / 10
                : null
              const isGood = kpi.invert ? (delta ?? 0) <= 0 : (delta ?? 0) >= 0
              return (
                <div key={kpi.label} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{kpi.label}</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {kpi.unit === '₹' ? '₹' : ''}{kpi.value ?? '—'}{kpi.unit !== '₹' ? kpi.unit : ''}
                  </p>
                  {delta != null && (
                    <p className={cn('text-xs font-semibold', isGood ? 'text-emerald-600' : 'text-red-500')}>
                      {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% vs Q1
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <Card>
            <CardHeader><CardTitle>Finance KPI Summary — Q1 vs Q2 2026</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Metric</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Q1 2026</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Q2 2026</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Days Sales Outstanding',      q1: prevKPI.dso_days,                    q2: latestKPI.dso_days,                    unit: ' days', invert: true },
                    { label: 'Invoice Processing Time',     q1: prevKPI.invoice_processing_time_hrs, q2: latestKPI.invoice_processing_time_hrs, unit: 'h',     invert: true },
                    { label: 'Cost Per Invoice',            q1: prevKPI.cost_per_invoice,            q2: latestKPI.cost_per_invoice,            unit: '₹',     invert: true },
                    { label: 'Audit Completion Rate',       q1: prevKPI.audit_completion_rate,       q2: latestKPI.audit_completion_rate,       unit: '%',     invert: false },
                    { label: 'Collection Rate',             q1: prevKPI.collection_rate,             q2: latestKPI.collection_rate,             unit: '%',     invert: false },
                  ].map((row) => {
                    const delta = row.q1 != null && row.q2 != null ? ((row.q2 - row.q1) / row.q1) * 100 : null
                    const isGood = row.invert ? (delta ?? 0) <= 0 : (delta ?? 0) >= 0
                    return (
                      <tr key={row.label} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-4 py-3 text-sm text-slate-800">{row.label}</td>
                        <td className="px-4 py-3 text-right text-sm text-slate-500">{row.unit === '₹' ? `₹${row.q1}` : `${row.q1}${row.unit}`}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{row.unit === '₹' ? `₹${row.q2}` : `${row.q2}${row.unit}`}</td>
                        <td className={cn('px-4 py-3 text-right text-sm font-semibold', isGood ? 'text-emerald-600' : 'text-red-500')}>
                          {delta != null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
