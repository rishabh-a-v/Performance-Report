import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ScoreGauge } from '@/components/charts/ScoreGauge'
import { PROFILES, DEPARTMENTS } from '@/lib/mockData'
import { computePerformanceScores, categoryLabel, categoryColor, categoryDot, scoreBarColor } from '@/lib/scoreEngine'
import { cn } from '@/lib/utils'
import {
  Zap, Users, TrendingUp, AlertTriangle, Star, Trophy,
  ChevronDown, ChevronRight, BarChart3, Target,
} from 'lucide-react'
import type { PerformanceCategory } from '@/types/database'

const CATEGORY_RANGES = [
  { cat: 'exceptional'          as PerformanceCategory, range: '90–100', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  { cat: 'exceeds_expectations' as PerformanceCategory, range: '75–89',  color: 'text-blue-700',    bg: 'bg-blue-100' },
  { cat: 'meets_expectations'   as PerformanceCategory, range: '60–74',  color: 'text-slate-700',   bg: 'bg-slate-100' },
  { cat: 'needs_improvement'    as PerformanceCategory, range: '40–59',  color: 'text-amber-700',   bg: 'bg-amber-100' },
  { cat: 'critical_attention'   as PerformanceCategory, range: '0–39',   color: 'text-red-700',     bg: 'bg-red-100' },
]

const WEIGHT_LABELS = [
  { key: 'task_completion_score',  label: 'Task Completion',   weight: 30 },
  { key: 'kpi_achievement_score',  label: 'KPI Achievement',   weight: 25 },
  { key: 'productivity_score',     label: 'Productivity',      weight: 20 },
  { key: 'timeliness_score',       label: 'Timeliness',        weight: 15 },
  { key: 'manager_feedback_score', label: 'Manager Feedback',  weight: 10 },
]

type FilterCat = 'all' | 'needs_attention' | PerformanceCategory

export function PerformanceEngine() {
  const scores = computePerformanceScores()
  const [filter, setFilter] = useState<FilterCat>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deptFilter, setDeptFilter] = useState('all')

  // Summary stats
  const exceptional     = scores.filter((s) => s.category === 'exceptional').length
  const exceedsExp      = scores.filter((s) => s.category === 'exceeds_expectations').length
  const needsAttn       = scores.filter((s) => ['needs_improvement', 'critical_attention'].includes(s.category)).length
  const avgScore        = Math.round(scores.reduce((s, sc) => s + sc.total_score, 0) / scores.length)

  const filteredScores = scores
    .filter((s) =>
      filter === 'all' ? true :
      filter === 'needs_attention' ? ['needs_improvement', 'critical_attention'].includes(s.category) :
      s.category === filter
    )
    .filter((s) => {
      if (deptFilter === 'all') return true
      const profile = PROFILES.find((p) => p.id === s.user_id)
      return profile?.department_id === deptFilter
    })
    .sort((a, b) => b.total_score - a.total_score)


  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Performance Engine</h1>
        <p className="mt-0.5 text-xs text-slate-500">Automatic employee performance scoring — task completion, KPI achievement, productivity, timeliness, and feedback</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Avg Company Score"    value={`${avgScore}/100`}  icon={Zap}           iconColor="text-brand-600" />
        <KPICard
          title="Exceptional"
          value={exceptional}
          icon={Star}
          iconColor="text-emerald-600"
          onClick={() => setFilter(filter === 'exceptional' ? 'all' : 'exceptional')}
          active={filter === 'exceptional'}
        />
        <KPICard
          title="Exceeds Expectations"
          value={exceedsExp}
          icon={TrendingUp}
          iconColor="text-blue-600"
          onClick={() => setFilter(filter === 'exceeds_expectations' ? 'all' : 'exceeds_expectations')}
          active={filter === 'exceeds_expectations'}
        />
        <KPICard
          title="Needs Attention"
          value={needsAttn}
          icon={AlertTriangle}
          iconColor="text-red-500"
          invertDelta
          onClick={() => setFilter(filter === 'needs_attention' ? 'all' : 'needs_attention')}
          active={filter === 'needs_attention'}
        />
      </div>

      {/* Score formula legend */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-brand-600" />
            <CardTitle>Scoring Formula</CardTitle>
          </div>
          <span className="text-xs text-slate-400">Weighted 0–100</span>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          {WEIGHT_LABELS.map(({ label, weight }) => (
            <div key={label} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
              <span className="text-xs font-semibold text-slate-700">{label}</span>
              <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">{weight}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setFilter('all')}
            className={cn('rounded px-3 py-1.5 text-[11px] font-semibold transition-colors', filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
          >
            All
          </button>
          {CATEGORY_RANGES.map(({ cat, range, color, bg }) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn('rounded px-3 py-1.5 text-[11px] font-semibold transition-colors', filter === cat ? cn('bg-white shadow-sm', color) : 'text-slate-500 hover:text-slate-700')}
            >
              {range}
            </button>
          ))}
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
        >
          <option value="all">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Employee score cards */}
      <div className="space-y-2">
        {filteredScores.map((score) => {
          const profile = PROFILES.find((p) => p.id === score.user_id)
          if (!profile) return null
          const dept = DEPARTMENTS.find((d) => d.id === profile.department_id)
          const isOpen = expanded === score.user_id
          return (
            <div key={score.user_id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <button
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50/60 transition-colors text-left"
                onClick={() => setExpanded(isOpen ? null : score.user_id)}
              >
                <ScoreGauge score={score.total_score} size="sm" label="Score" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900">{profile.full_name}</p>
                    <span className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                      categoryColor(score.category),
                    )}>
                      {categoryLabel(score.category)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">{profile.designation} · {dept?.name}</p>
                </div>
                <div className="shrink-0">
                  {isOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3 bg-slate-50/30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Score Breakdown</p>
                  {WEIGHT_LABELS.map(({ key, label, weight }) => {
                    const val = score[key as keyof typeof score] as number
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600">{label} <span className="text-slate-400">({weight}%)</span></span>
                          <span className={cn('text-xs font-bold tabular-nums', val >= 75 ? 'text-emerald-600' : val >= 50 ? 'text-amber-600' : 'text-red-600')}>
                            {val}/100
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200">
                          <div
                            className={cn('h-1.5 rounded-full transition-all', scoreBarColor(val))}
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-white border border-slate-200 px-4 py-2">
                    <span className="text-xs font-semibold text-slate-700">Total Score</span>
                    <span className={cn(
                      'text-base font-bold tabular-nums',
                      score.total_score >= 75 ? 'text-emerald-600' : score.total_score >= 60 ? 'text-slate-800' : 'text-red-600',
                    )}>
                      {score.total_score} / 100
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredScores.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-400">No employees match the selected filters.</div>
      )}

      {/* Department risk */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target size={14} className="text-brand-600" />
            <CardTitle>Department Summary</CardTitle>
          </div>
        </CardHeader>
        <div className="space-y-3">
          {DEPARTMENTS.map((dept) => {
            const deptScores = scores.filter((s) => {
              const p = PROFILES.find((pr) => pr.id === s.user_id)
              return p?.department_id === dept.id
            })
            if (!deptScores.length) return null
            const avg = Math.round(deptScores.reduce((s, sc) => s + sc.total_score, 0) / deptScores.length)
            const atRisk = deptScores.filter((s) => ['needs_improvement', 'critical_attention'].includes(s.category)).length
            return (
              <div key={dept.id} className="flex items-center gap-4">
                <div className="w-24 shrink-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{dept.name}</p>
                  <p className="text-[10px] text-slate-400">{deptScores.length} employees</p>
                </div>
                <div className="flex-1">
                  <ProgressBar value={avg} size="sm" />
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 tabular-nums w-10 text-right">{avg}/100</span>
                  {atRisk > 0 && (
                    <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                      {atRisk} at risk
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
