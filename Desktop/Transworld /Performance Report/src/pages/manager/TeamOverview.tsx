import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { Avatar } from '@/components/ui/Avatar'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useBlockerStore } from '@/store/blockerStore'
import { reportees, PERF_SNAPSHOTS } from '@/lib/mockData'
import { completionRate, cn } from '@/lib/utils'
import { Users, Compass, AlertTriangle, TrendingUp, Plus } from 'lucide-react'
import { AddTaskModal } from '@/pages/employee/SpecialTasks'
import type { Profile } from '@/types/database'

export function TeamOverview() {
  const { user } = useAuth()
  const allJDs = useJobDirectionStore((s) => s.directions)
  const allSTs = useSpecialTaskStore((s) => s.tasks)
  const { blockers } = useBlockerStore()
  const [assignTarget, setAssignTarget] = useState<Profile | null>(null)

  if (!user) return null

  const members = reportees(user.id)

  const rows = members.map((m) => {
    const memberJDs = allJDs.filter((jd) => jd.employee_id === m.id)
    const memberSTs = allSTs.filter((st) => st.assigned_to === m.id)

    const completedJDs = memberJDs.filter((jd) => ['completed', 'approved'].includes(jd.status)).length
    const completedSTs = memberSTs.filter((st) => st.status === 'completed').length
    const total = memberJDs.length + memberSTs.length
    const completed = completedJDs + completedSTs
    const activeBlockersCount = blockers.filter((b) => b.employee_id === m.id && !b.resolved_at).length

    const snap = PERF_SNAPSHOTS.find((s) => s.user_id === m.id)

    return {
      member: m,
      jds: memberJDs.length,
      sts: memberSTs.length,
      assigned: total,
      completed,
      blocked: activeBlockersCount,
      rate: completionRate(completed, total),
      kpi: snap?.kpi_score ?? 70,
      activeBlocker: activeBlockersCount > 0,
    }
  })

  const totalAssigned  = rows.reduce((s, r) => s + r.assigned, 0)
  const totalCompleted = rows.reduce((s, r) => s + r.completed, 0)
  const totalBlocked   = rows.reduce((s, r) => s + (r.activeBlocker ? 1 : 0), 0)
  const teamRate       = completionRate(totalCompleted, totalAssigned)
  const avgKpi         = rows.length ? Math.round(rows.reduce((s, r) => s + r.kpi, 0) / rows.length) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Team Members"    value={rows.length}     icon={Users}         iconColor="text-blue-600" />
        <KPICard title="Completion Rate" value={`${teamRate}%`}  icon={TrendingUp}    delta={2.8} iconColor="text-emerald-600" />
        <KPICard title="JDs + STs"       value={totalAssigned}   icon={Compass}       iconColor="text-slate-600" />
        <KPICard title="Members Blocked" value={totalBlocked}    icon={AlertTriangle} iconColor="text-red-500" invertDelta />
      </div>

      {/* Member table */}
      <Card padding={false}>
        <div className="border-b border-slate-100 p-4">
          <CardTitle>Team Members</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-4 py-2.5 text-left   text-xs font-semibold uppercase tracking-wide text-slate-400">Employee</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">JDs</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">STs</th>
                <th className="px-4 py-2.5 text-right  text-xs font-semibold uppercase tracking-wide text-slate-400">Completed</th>
                <th className="px-4 py-2.5 text-right  text-xs font-semibold uppercase tracking-wide text-slate-400">Rate</th>
                <th className="px-4 py-2.5 text-right  text-xs font-semibold uppercase tracking-wide text-slate-400">KPI</th>
                <th className="px-4 py-2.5 text-left   text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-4 py-2.5 text-right  text-xs font-semibold uppercase tracking-wide text-slate-400"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ member, jds, sts, assigned, completed, rate, kpi, activeBlocker }) => (
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
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{jds}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{sts}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600">{completed}/{assigned}</td>
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
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setAssignTarget(member)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                    >
                      <Plus size={10} />
                      Assign Task
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-400">No direct reports found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AddTaskModal
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        defaultAssigneeId={assignTarget?.id}
      />
    </div>
  )
}
