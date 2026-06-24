import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { Avatar } from '@/components/ui/Avatar'
import {
  PROFILES, DEPARTMENTS, DEPT_SNAPSHOTS, PERF_SNAPSHOTS, deptById,
} from '@/lib/mockData'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useBlockerStore } from '@/store/blockerStore'
import { completionRate, formatRelative, cn } from '@/lib/utils'
import { Compass, Clock, AlertTriangle, BarChart3 } from 'lucide-react'

export function DepartmentDashboard() {
  const { user } = useAuth()
  const allJDs = useJobDirectionStore((s) => s.directions)
  const allSTs = useSpecialTaskStore((s) => s.tasks)
  const { blockers: liveBlockers } = useBlockerStore()

  if (!user) return null

  const deptId = user.department_id ?? DEPARTMENTS[0]?.id
  if (!deptId) return null

  const dept    = deptById(deptId)
  const members = PROFILES.filter((p) => p.department_id === deptId && p.role === 'executive')
  const snap    = DEPT_SNAPSHOTS.find((s) => s.department_id === deptId)
  const activeBlockers = liveBlockers.filter((b) => !b.resolved_at && members.some((m) => m.id === b.employee_id))

  const memberIds  = members.map((m) => m.id)
  const deptJDs    = allJDs.filter((jd) => memberIds.includes(jd.employee_id))
  const deptSTs    = allSTs.filter((st) => memberIds.includes(st.assigned_to))

  const activeJDs    = deptJDs.filter((jd) => ['active', 'submitted', 'rejected'].includes(jd.status)).length
  const completedJDs = deptJDs.filter((jd) => ['completed', 'approved'].includes(jd.status)).length
  const completedSTs = deptSTs.filter((st) => st.status === 'completed').length
  const totalItems   = deptJDs.length + deptSTs.length
  const totalDone    = completedJDs + completedSTs
  const rate         = completionRate(totalDone, totalItems)

  const memberPerf = members.map((m) => {
    const perfSnap   = PERF_SNAPSHOTS.find((s) => s.user_id === m.id)
    const mJDs       = deptJDs.filter((jd) => jd.employee_id === m.id)
    const mSTs       = deptSTs.filter((st) => st.assigned_to === m.id)
    const mDoneJDs   = mJDs.filter((jd) => ['completed', 'approved'].includes(jd.status)).length
    const mDoneSTs   = mSTs.filter((st) => st.status === 'completed').length
    const mTotal     = mJDs.length + mSTs.length
    const mDone      = mDoneJDs + mDoneSTs
    const avgJDProg  = mJDs.length
      ? Math.round(mJDs.reduce((s, jd) => s + jd.progress_percentage, 0) / mJDs.length)
      : 0
    return {
      member: m,
      jds: mJDs.length,
      sts: mSTs.length,
      total: mTotal,
      done: mDone,
      avgJDProgress: avgJDProg,
      kpi: perfSnap?.kpi_score ?? 70,
      blocked: liveBlockers.some((b) => b.employee_id === m.id && !b.resolved_at),
    }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-900">{dept?.name ?? 'Department'}</h2>
        <span className="rounded-full bg-brand-100 px-3 py-0.5 text-xs font-semibold text-brand-700">
          {members.length} members
        </span>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Active Job Dirs."  value={activeJDs}               icon={Compass}       iconColor="text-blue-600" />
        <KPICard title="Completion Rate"   value={`${rate}%`}              icon={BarChart3}     delta={3.1} iconColor="text-emerald-600" />
        <KPICard title="Active Blockers"   value={activeBlockers.length}   icon={AlertTriangle} iconColor="text-red-500" invertDelta />
        <KPICard title="Avg Cycle Time"    value={snap?.avg_cycle_time_hours ? `${snap.avg_cycle_time_hours}h` : '—'} icon={Clock} iconColor="text-amber-600" />
      </div>

      {/* Bottleneck analysis */}
      {activeBlockers.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle size={14} className="text-amber-600" />
              Bottleneck Analysis
            </CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {activeBlockers.map((b) => {
              const emp = members.find((m) => m.id === b.employee_id)
              if (!emp) return null
              return (
                <div key={b.id} className="flex items-start gap-3 rounded-lg bg-white p-3 shadow-sm">
                  <Avatar name={emp.full_name} size="sm" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{emp.full_name}</p>
                    <p className="text-xs text-slate-600">{b.description}</p>
                    <p className="mt-0.5 text-[10px] text-amber-600">Blocked {b.hours_blocked}h · reported {formatRelative(b.reported_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Member performance table */}
      <Card padding={false}>
        <div className="border-b border-slate-100 p-4">
          <CardTitle>Member Performance</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-4 py-2.5 text-left   text-xs font-semibold uppercase tracking-wide text-slate-400">Member</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">JDs</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">STs</th>
                <th className="px-4 py-2.5 text-right  text-xs font-semibold uppercase tracking-wide text-slate-400">Avg JD %</th>
                <th className="px-4 py-2.5 text-right  text-xs font-semibold uppercase tracking-wide text-slate-400">Rate</th>
                <th className="px-4 py-2.5 text-right  text-xs font-semibold uppercase tracking-wide text-slate-400">KPI</th>
                <th className="px-4 py-2.5 text-left   text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {memberPerf.map(({ member, jds, sts, total, done, avgJDProgress, kpi, blocked }) => {
                const memberRate = completionRate(done, total)
                return (
                  <tr key={member.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={member.full_name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{member.full_name}</p>
                          <p className="text-[10px] text-slate-400">{member.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{jds}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{sts}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('text-sm font-semibold', avgJDProgress >= 70 ? 'text-emerald-600' : 'text-amber-600')}>
                        {avgJDProgress}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('text-sm font-semibold', memberRate >= 70 ? 'text-emerald-600' : 'text-amber-600')}>
                        {memberRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('text-sm font-bold', kpi >= 75 ? 'text-emerald-600' : kpi >= 55 ? 'text-amber-600' : 'text-red-600')}>
                        {kpi}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        blocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700',
                      )}>
                        {blocked ? 'Blocked' : 'On track'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {memberPerf.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-slate-400">No members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
