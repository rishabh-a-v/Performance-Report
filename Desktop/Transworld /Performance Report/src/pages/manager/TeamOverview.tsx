import { useAuth } from '@/contexts/AuthContext'
import { Card, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { reportees, tasksByUser, PERF_SNAPSHOTS, BLOCKERS } from '@/lib/mockData'
import { completionRate, cn } from '@/lib/utils'
import type { Profile } from '@/types/database'
import { Users, CheckSquare, AlertTriangle, TrendingUp } from 'lucide-react'

interface MemberRow {
  member: Profile
  assigned: number
  completed: number
  blocked: number
  rate: number
  kpi: number
  activeBlocker: boolean
}

function buildMemberRows(managerId: string): MemberRow[] {
  const members = reportees(managerId)
  return members.map((m) => {
    const tasks    = tasksByUser(m.id)
    const done     = tasks.filter((t) => t.status === 'done').length
    const blocked  = tasks.filter((t) => t.status === 'blocked').length
    const snap     = PERF_SNAPSHOTS.find((s) => s.user_id === m.id)
    const hasBlock = BLOCKERS.some((b) => b.employee_id === m.id && !b.resolved_at)
    return {
      member: m,
      assigned: tasks.length,
      completed: done,
      blocked,
      rate: completionRate(done, tasks.length),
      kpi: snap?.kpi_score ?? 70,
      activeBlocker: hasBlock,
    }
  })
}

export function TeamOverview() {
  const { user } = useAuth()
  if (!user) return null

  const rows = buildMemberRows(user.id)
  const totalAssigned  = rows.reduce((s, r) => s + r.assigned, 0)
  const totalCompleted = rows.reduce((s, r) => s + r.completed, 0)
  const totalBlocked   = rows.reduce((s, r) => s + (r.activeBlocker ? 1 : 0), 0)
  const teamRate       = completionRate(totalCompleted, totalAssigned)
  const avgKpi         = rows.length ? Math.round(rows.reduce((s, r) => s + r.kpi, 0) / rows.length) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Team Members"    value={rows.length}      icon={Users}          iconColor="text-blue-600" />
        <KPICard title="Completion Rate" value={`${teamRate}%`}  icon={TrendingUp}     delta={2.8} iconColor="text-emerald-600" />
        <KPICard title="Tasks Assigned"  value={totalAssigned}    icon={CheckSquare}    iconColor="text-slate-600" />
        <KPICard title="Members Blocked" value={totalBlocked}     icon={AlertTriangle}  iconColor="text-red-500" invertDelta />
      </div>

      {/* Member table */}
      <Card padding={false}>
        <div className="border-b border-slate-100 p-4">
          <CardTitle>Team Members</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Employee</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Assigned</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Completed</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Blocked</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Rate</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">KPI</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ member, assigned, completed, blocked, rate, kpi, activeBlocker }) => (
                <tr key={member.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.full_name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{member.full_name}</p>
                        <p className="text-xs text-slate-400">{member.designation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-700">{assigned}</td>
                  <td className="px-4 py-3 text-right text-sm text-emerald-600 font-medium">{completed}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn('text-sm font-medium', blocked > 0 ? 'text-red-600' : 'text-slate-400')}>
                      {blocked}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn('text-sm font-semibold', rate >= 70 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600')}>
                        {rate}%
                      </span>
                      <div className="h-1 w-16 rounded-full bg-slate-100">
                        <div
                          className={cn('h-full rounded-full', rate >= 70 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn('text-sm font-bold', kpi >= 75 ? 'text-emerald-600' : kpi >= 55 ? 'text-amber-600' : 'text-red-600')}>
                      {kpi}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {activeBlocker ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        On track
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
