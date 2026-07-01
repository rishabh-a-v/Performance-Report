import { useState, useEffect, useMemo } from 'react'
import { BarChart2, Users, ChevronUp, ChevronDown, ChevronsUpDown, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/store/profileStore'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useCapacityStore } from '@/store/capacityStore'
import { useRBACFilter } from '@/hooks/useRBACFilter'
import { cn } from '@/lib/utils'
import { CapacityDashboard } from '@/modules/capacity/components/CapacityDashboard'

const ROLE_LABELS: Record<string, string> = {
  executive: 'Executive',
  manager: 'Manager',
  director: 'Director',
  managing_director: 'Managing Director',
  executive_assistant: 'Executive Assistant',
  hr: 'HR',
}

const WORKLOAD_BAND = (score: number) => {
  if (score <= 2) return { label: 'Light',    color: 'bg-emerald-100 text-emerald-700' }
  if (score <= 5) return { label: 'Moderate', color: 'bg-amber-100  text-amber-700'   }
  return              { label: 'Heavy',    color: 'bg-red-100    text-red-700'     }
}

function toMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function monthLabel(key: string) {
  const d = new Date(key + 'T00:00:00')
  return d.toLocaleString('default', { month: 'long', year: 'numeric' })
}

function buildMonthOptions() {
  const now = new Date()
  const options: string[] = []
  // 3 past months + current + 12 future months
  for (let i = -3; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    options.push(toMonthKey(d))
  }
  return options
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-4">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Sort helpers ───────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc'
type HeadSortKey = 'dept' | 'role' | 'planned' | 'actual' | 'gap' | 'fill'
type WorkSortKey = 'name' | 'role' | 'jds' | 'tasks' | 'score'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={12} className="text-slate-300 ml-1 inline shrink-0" />
  return dir === 'asc'
    ? <ChevronUp size={12} className="text-blue-500 ml-1 inline shrink-0" />
    : <ChevronDown size={12} className="text-blue-500 ml-1 inline shrink-0" />
}

// ─── Inline editable planned cell ─────────────────────────────────────────────

function PlannedCell({
  value, canEdit, onSave,
}: { value: number; canEdit: boolean; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(String(value))

  useEffect(() => { setInput(String(value)) }, [value])

  if (!canEdit) return <span className="tabular-nums">{value > 0 ? value : '—'}</span>

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min="0"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={() => { onSave(parseInt(input) || 0); setEditing(false) }}
        onKeyDown={(e) => { if (e.key === 'Enter') { onSave(parseInt(input) || 0); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
        className="w-16 rounded border border-blue-400 bg-blue-50 px-1.5 py-0.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="tabular-nums rounded px-1.5 py-0.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
      title="Click to edit planned headcount"
    >
      {value > 0 ? value : <span className="text-slate-300 italic text-[11px]">Set target</span>}
    </button>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type TabKey = 'dashboard' | 'headcount' | 'workload'

export function CapacityPlanning() {
  const { user, role } = useAuth()
  const profiles = useProfileStore((s) => s.profiles)
  const departments = useProfileStore((s) => s.departments)
  const directions = useJobDirectionStore((s) => s.directions)
  const tasks = useSpecialTaskStore((s) => s.tasks)
  const { plans, upsertPlan } = useCapacityStore()
  const { availableBranches } = useRBACFilter()

  const isAdmin = ['managing_director', 'executive_assistant', 'hr'].includes(role ?? '')
  const isDirector = role === 'director'
  const canEdit = isAdmin || isDirector

  const monthOptions = useMemo(() => buildMonthOptions(), [])
  const currentMonthKey = toMonthKey(new Date())

  // derive initial branch immediately (no flicker from empty string)
  const initialBranch = user?.branch || availableBranches[0] || ''
  const [selectedBranch, setSelectedBranch] = useState<string>(initialBranch)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)
  const [tab, setTab] = useState<TabKey>('dashboard')
  const [headSortKey, setHeadSortKey] = useState<HeadSortKey>('dept')
  const [headSortDir, setHeadSortDir] = useState<SortDir>('asc')
  const [workSortKey, setWorkSortKey] = useState<WorkSortKey>('score')
  const [workSortDir, setWorkSortDir] = useState<SortDir>('desc')

  function toggleHeadSort(key: HeadSortKey) {
    if (headSortKey === key) setHeadSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setHeadSortKey(key); setHeadSortDir('asc') }
  }

  function toggleWorkSort(key: WorkSortKey) {
    if (workSortKey === key) setWorkSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setWorkSortKey(key); setWorkSortDir('asc') }
  }

  // keep branch in sync when permissions finish loading
  useEffect(() => {
    if (selectedBranch) return
    const branch = user?.branch || availableBranches[0] || ''
    if (branch) setSelectedBranch(branch)
  }, [user?.branch, availableBranches, selectedBranch])

  // ── Derived data ───────────────────────────────────────────────────────────

  const branchProfiles = useMemo(
    () => profiles.filter((p) => p.branch === selectedBranch),
    [profiles, selectedBranch]
  )

  // rows: unique (department_id, role) combos in the branch
  const headcountRows = useMemo(() => {
    const map = new Map<string, { departmentId: string; deptName: string; role: string; actual: number }>()
    for (const p of branchProfiles) {
      if (!p.department_id || !p.role) continue
      const key = `${p.department_id}::${p.role}`
      if (!map.has(key)) {
        const dept = departments.find((d) => d.id === p.department_id)
        map.set(key, { departmentId: p.department_id, deptName: dept?.name ?? '—', role: p.role, actual: 0 })
      }
      map.get(key)!.actual += 1
    }
    return [...map.values()].sort((a, b) => a.deptName.localeCompare(b.deptName) || a.role.localeCompare(b.role))
  }, [branchProfiles, departments])

  const planLookup = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of plans) {
      if (p.branch === selectedBranch && p.plan_month.slice(0, 7) === selectedMonth.slice(0, 7)) {
        m.set(`${p.department_id}::${p.role}`, p.planned_headcount)
      }
    }
    return m
  }, [plans, selectedBranch, selectedMonth])

  const totalPlanned = useMemo(
    () => headcountRows.reduce((sum, r) => sum + (planLookup.get(`${r.departmentId}::${r.role}`) ?? 0), 0),
    [headcountRows, planLookup]
  )
  const totalActual = branchProfiles.length
  const totalGap = Math.max(0, totalPlanned - totalActual)

  // workload per employee in branch
  const workloadRows = useMemo(() => {
    return branchProfiles.map((p) => {
      const activeJDs = directions.filter(
        (d) => d.employee_id === p.id && ['active', 'approved'].includes(d.status)
      ).length
      const activeTasks = tasks.filter(
        (t) => t.assignees?.some((a) => a.employee_id === p.id) &&
               ['Yet to start', 'In progress', 'In review'].includes(t.status as string)
      ).length
      const score = activeJDs + activeTasks
      return { profile: p, activeJDs, activeTasks, score }
    }).sort((a, b) => b.score - a.score)
  }, [branchProfiles, directions, tasks])

  const avgScore = workloadRows.length > 0
    ? workloadRows.reduce((s, r) => s + r.score, 0) / workloadRows.length
    : 0
  const avgBand = WORKLOAD_BAND(avgScore)

  const sortedHeadcountRows = useMemo(() => {
    const enriched = headcountRows.map((row) => {
      const planned = planLookup.get(`${row.departmentId}::${row.role}`) ?? 0
      const gap = planned - row.actual
      const fillPct = planned > 0 ? Math.round((row.actual / planned) * 100) : -1
      return { ...row, planned, gap, fillPct }
    })
    return enriched.sort((a, b) => {
      const sign = headSortDir === 'asc' ? 1 : -1
      switch (headSortKey) {
        case 'dept':    return sign * a.deptName.localeCompare(b.deptName)
        case 'role':    return sign * (ROLE_LABELS[a.role] ?? a.role).localeCompare(ROLE_LABELS[b.role] ?? b.role)
        case 'planned': return sign * (a.planned - b.planned)
        case 'actual':  return sign * (a.actual - b.actual)
        case 'gap':     return sign * (a.gap - b.gap)
        case 'fill':    return sign * (a.fillPct - b.fillPct)
        default:        return 0
      }
    })
  }, [headcountRows, planLookup, headSortKey, headSortDir])

  const sortedWorkloadRows = useMemo(() => {
    return [...workloadRows].sort((a, b) => {
      const sign = workSortDir === 'asc' ? 1 : -1
      switch (workSortKey) {
        case 'name':  return sign * a.profile.full_name.localeCompare(b.profile.full_name)
        case 'role':  return sign * (ROLE_LABELS[a.profile.role ?? ''] ?? '').localeCompare(ROLE_LABELS[b.profile.role ?? ''] ?? '')
        case 'jds':   return sign * (a.activeJDs - b.activeJDs)
        case 'tasks': return sign * (a.activeTasks - b.activeTasks)
        case 'score': return sign * (a.score - b.score)
        default:      return 0
      }
    })
  }, [workloadRows, workSortKey, workSortDir])

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Capacity Planning</h1>
          <p className="text-sm text-slate-500 mt-0.5">Headcount targets and workload distribution by branch</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {availableBranches.length > 1 && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
              {availableBranches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}
          {availableBranches.length === 1 && selectedBranch && (
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{selectedBranch}</span>
          )}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}{m === currentMonthKey ? ' (Current)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard label="Planned Headcount" value={totalPlanned > 0 ? totalPlanned : '—'} color="text-blue-600" sub={totalPlanned === 0 ? 'No targets set' : undefined} />
        <KPICard label="Actual Headcount"  value={totalActual} color="text-slate-800" />
        <KPICard label="Open Gaps"         value={totalGap}    color={totalGap > 0 ? 'text-red-600' : 'text-emerald-600'} sub={totalPlanned > 0 && totalGap === 0 ? 'Fully staffed' : undefined} />
        <KPICard label="Avg Workload"      value={avgBand.label} color={avgBand.label === 'Light' ? 'text-emerald-600' : avgBand.label === 'Moderate' ? 'text-amber-600' : 'text-red-600'} sub={`${avgScore.toFixed(1)} tasks/person avg`} />
      </div>

      {/* ── Tabs ── */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm">
        <div className="flex border-b border-slate-100 px-4 pt-3 pb-0 gap-1">
          {([
            { key: 'dashboard' as TabKey, label: 'Overview & Analytics', icon: <LayoutDashboard size={14} /> },
            { key: 'headcount' as TabKey, label: 'Headcount Targets', icon: <Users size={14} /> },
            { key: 'workload'  as TabKey, label: 'Workload List',  icon: <BarChart2 size={14} /> },
          ]).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
                tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ── Dashboard Tab ── */}
        {tab === 'dashboard' && (
          <div className="p-5">
            <CapacityDashboard branch={selectedBranch} />
          </div>
        )}

        {/* ── Headcount Tab ── */}
        {tab === 'headcount' && (
          headcountRows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              No employees found in branch <span className="font-semibold text-slate-600">{selectedBranch}</span>.
            </div>
          ) : (
            <>
              {canEdit && (
                <p className="px-5 pt-3 text-[11px] text-slate-400 italic">Click a Planned value to set your headcount target for {monthLabel(selectedMonth)}.</p>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      {([
                        { key: 'dept' as HeadSortKey, label: 'Department', align: 'text-left' },
                        { key: 'role' as HeadSortKey, label: 'Role', align: 'text-left' },
                        { key: 'planned' as HeadSortKey, label: 'Planned', align: 'text-right justify-end', cls: 'w-28' },
                        { key: 'actual' as HeadSortKey, label: 'Actual', align: 'text-right justify-end', cls: 'w-28' },
                        { key: 'gap' as HeadSortKey, label: 'Gap', align: 'text-right justify-end', cls: 'w-28' },
                        { key: 'fill' as HeadSortKey, label: 'Fill %', align: 'text-right justify-end', cls: 'w-28' },
                      ]).map(({ key, label, align, cls }) => (
                        <th key={key} className={`py-3 px-5 ${align.split(' ')[0]} text-xs font-semibold uppercase tracking-wider text-slate-400 ${cls ?? ''}`}>
                          <button onClick={() => toggleHeadSort(key)} className={`flex items-center hover:text-blue-600 transition-colors ${align.includes('justify-end') ? 'justify-end w-full' : ''}`}>
                            {label}<SortIcon active={headSortKey === key} dir={headSortDir} />
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHeadcountRows.map((row) => {
                      const rowKey = `${row.departmentId}::${row.role}`
                      const planned = row.planned
                      const gap = row.gap
                      const fillPct = row.fillPct >= 0 ? row.fillPct : null

                      const canEditRow = isAdmin || (isDirector && user?.branch === selectedBranch)

                      return (
                        <tr key={rowKey} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors">
                          <td className="py-3.5 px-5 text-sm text-slate-700 font-medium">{row.deptName}</td>
                          <td className="py-3.5 px-5 text-sm text-slate-600">{ROLE_LABELS[row.role] ?? row.role}</td>
                          <td className="py-3.5 px-5 text-sm text-right">
                            <PlannedCell
                              value={planned}
                              canEdit={canEditRow}
                              onSave={(v) => upsertPlan(selectedBranch, row.departmentId, row.role, v, selectedMonth)}
                            />
                          </td>
                          <td className="py-3.5 px-5 text-sm text-right tabular-nums font-semibold text-slate-800">{row.actual}</td>
                          <td className="py-3.5 px-5 text-sm text-right tabular-nums">
                            {planned > 0 ? (
                              <span className={cn('font-semibold', gap > 0 ? 'text-red-600' : gap < 0 ? 'text-emerald-600' : 'text-slate-400')}>
                                {gap > 0 ? `+${gap}` : gap}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            {fillPct !== null ? (
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-slate-100">
                                  <div
                                    className={cn('h-full rounded-full', fillPct >= 100 ? 'bg-emerald-500' : fillPct >= 70 ? 'bg-blue-500' : 'bg-amber-400')}
                                    style={{ width: `${Math.min(100, fillPct)}%` }}
                                  />
                                </div>
                                <span className="text-xs tabular-nums font-semibold text-slate-600 w-9 text-right shrink-0">{fillPct}%</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-100 bg-slate-50/60">
                      <td colSpan={2} className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-500">Total</td>
                      <td className="py-3 px-5 text-sm text-right tabular-nums font-bold text-slate-700">{totalPlanned > 0 ? totalPlanned : '—'}</td>
                      <td className="py-3 px-5 text-sm text-right tabular-nums font-bold text-slate-800">{totalActual}</td>
                      <td className="py-3 px-5 text-sm text-right tabular-nums">
                        {totalPlanned > 0 ? (
                          <span className={cn('font-bold', totalGap > 0 ? 'text-red-600' : 'text-emerald-600')}>
                            {totalPlanned - totalActual > 0 ? `+${totalPlanned - totalActual}` : totalPlanned - totalActual}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-3 px-5 text-right">
                        {totalPlanned > 0 ? (
                          <span className={cn('text-sm font-bold tabular-nums', totalActual >= totalPlanned ? 'text-emerald-600' : 'text-amber-600')}>
                            {Math.round((totalActual / totalPlanned) * 100)}%
                          </span>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )
        )}

        {/* ── Workload Tab ── */}
        {tab === 'workload' && (
          workloadRows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              No employees found in branch <span className="font-semibold text-slate-600">{selectedBranch}</span>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {([
                      { key: 'name' as WorkSortKey, label: 'Employee', align: 'text-left justify-start', cls: '' },
                      { key: 'role' as WorkSortKey, label: 'Role', align: 'text-left justify-start', cls: '' },
                      { key: 'jds' as WorkSortKey, label: 'Active JDs', align: 'text-center justify-center', cls: 'w-32' },
                      { key: 'tasks' as WorkSortKey, label: 'Active Tasks', align: 'text-center justify-center', cls: 'w-32' },
                      { key: 'score' as WorkSortKey, label: 'Workload', align: 'text-left justify-start', cls: 'w-36' },
                    ]).map(({ key, label, align, cls }) => (
                      <th key={key} className={`py-3 px-5 ${align.split(' ')[0]} text-xs font-semibold uppercase tracking-wider text-slate-400 ${cls}`}>
                        <button onClick={() => toggleWorkSort(key)} className={`flex items-center hover:text-blue-600 transition-colors ${align.split(' ')[1]} w-full`}>
                          {label}<SortIcon active={workSortKey === key} dir={workSortDir} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedWorkloadRows.map(({ profile, activeJDs, activeTasks, score }) => {
                    const band = WORKLOAD_BAND(score)
                    const dept = departments.find((d) => d.id === profile.department_id)
                    return (
                      <tr key={profile.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors">
                        <td className="py-3.5 px-5">
                          <p className="text-sm font-medium text-slate-800 leading-snug">{profile.full_name}</p>
                          {dept && <p className="text-xs text-slate-400">{dept.name}</p>}
                        </td>
                        <td className="py-3.5 px-5 text-sm text-slate-600">{ROLE_LABELS[profile.role ?? ''] ?? profile.role}</td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={cn('inline-block min-w-[1.5rem] rounded-full px-2 py-0.5 text-xs font-bold tabular-nums', activeJDs > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400')}>
                            {activeJDs}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={cn('inline-block min-w-[1.5rem] rounded-full px-2 py-0.5 text-xs font-bold tabular-nums', activeTasks > 0 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-400')}>
                            {activeTasks}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', band.color)}>
                              {band.label}
                            </span>
                            <span className="text-xs text-slate-400 tabular-nums">{score} total</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}
