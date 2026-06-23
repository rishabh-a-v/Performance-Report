import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { DAILY_CHECKINS, profileById, BLOCKERS, tasksByUser } from '@/lib/mockData'
import { formatRelative, formatDate, cn } from '@/lib/utils'
import { Zap, Brain, AlertCircle, CheckCircle2, TrendingUp, RefreshCw } from 'lucide-react'

const AI_SUMMARY = {
  completed: [
    'Auth service migration to Supabase progressed with all endpoint tests passing (Amit Kumar)',
    'Component refactoring and performance profiling initiated (Sneha Iyer)',
    'API endpoint tests completed; 3 critical bugs in auth flow fixed (Demo User)',
  ],
  planned: [
    'Supabase roles and RLS setup to be finalised today',
    'Monthly KPI report template creation underway',
    'Performance optimisation continues — pending design mockups',
  ],
  risks: [
    'Sneha Iyer blocked on dashboard optimisation — awaiting design deliverable for 56h',
    'Dashboard performance task (T-2) is at risk of missing June 25 deadline',
  ],
  escalations: [
    'Design team delay is creating a downstream block. Recommend escalating to design lead.',
  ],
}

export function TeamPulseFeed() {
  const { user } = useAuth()
  if (!user) return null

  const [loading, setLoading] = useState(false)
  const [showSummary, setShowSummary] = useState(true)

  const today = new Date().toISOString().slice(0, 10)
  const checkins = DAILY_CHECKINS.filter((c) => {
    const emp = profileById(c.user_id)
    return emp?.manager_id === user.id
  })

  async function refreshSummary() {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1500))
    setLoading(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* AI Summary Card */}
      <Card className="border-brand-200 bg-gradient-to-br from-brand-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
              <Brain size={15} />
            </span>
            <CardTitle className="text-brand-800">AI Team Summary — {formatDate(today)}</CardTitle>
          </div>
          <Button size="sm" variant="ghost" onClick={refreshSummary} loading={loading}>
            <RefreshCw size={12} />
            Refresh
          </Button>
        </CardHeader>

        <div className="space-y-4">
          <Section icon={<CheckCircle2 size={14} className="text-emerald-600" />} title="What the team completed" color="emerald">
            {AI_SUMMARY.completed.map((item, i) => <Item key={i} text={item} />)}
          </Section>

          <Section icon={<TrendingUp size={14} className="text-blue-600" />} title="What's planned today" color="blue">
            {AI_SUMMARY.planned.map((item, i) => <Item key={i} text={item} />)}
          </Section>

          <Section icon={<AlertCircle size={14} className="text-amber-600" />} title="Emerging risks" color="amber">
            {AI_SUMMARY.risks.map((item, i) => <Item key={i} text={item} warn />)}
          </Section>

          {AI_SUMMARY.escalations.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-700">
                <AlertCircle size={12} />
                Escalations Required
              </p>
              {AI_SUMMARY.escalations.map((item, i) => (
                <p key={i} className="text-xs text-red-600">{item}</p>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Individual check-ins */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Zap size={14} className="text-brand-500" />
          Individual Check-ins ({checkins.length})
        </h2>
        {checkins.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-slate-400">No check-ins submitted today yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {checkins.map((checkin) => {
              const emp = profileById(checkin.user_id)
              if (!emp) return null
              return (
                <Card key={checkin.id}>
                  <div className="flex items-start gap-3">
                    <Avatar name={emp.full_name} />
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{emp.full_name}</p>
                          <p className="text-xs text-slate-400">{emp.designation} · {formatRelative(checkin.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {checkin.is_blocked && (
                            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                              Blocked
                            </span>
                          )}
                          {checkin.mood_score && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {['Rough','Low','OK','Good','Great'][checkin.mood_score - 1]}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Completed Yesterday</p>
                          <p className="text-xs text-slate-700 leading-relaxed">{checkin.completed_yesterday}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Focus Today</p>
                          <p className="text-xs text-slate-700 leading-relaxed">{checkin.focus_today}</p>
                        </div>
                      </div>

                      {checkin.is_blocked && checkin.blocker_description && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-red-500">Blocker</p>
                          <p className="text-xs text-red-700">{checkin.blocker_description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Members who haven't checked in */}
      <Card className="border-amber-200 bg-amber-50/40">
        <p className="flex items-center gap-2 text-xs font-semibold text-amber-700">
          <AlertCircle size={13} />
          0 of your direct reports haven't submitted a pulse today
        </p>
        <p className="mt-1 text-xs text-amber-600">All team members have checked in.</p>
      </Card>
    </div>
  )
}

function Section({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        {icon}
        {title}
      </p>
      <ul className="space-y-1">{children}</ul>
    </div>
  )
}

function Item({ text, warn }: { text: string; warn?: boolean }) {
  return (
    <li className={cn('flex items-start gap-2 text-xs', warn ? 'text-amber-800' : 'text-slate-600')}>
      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
      {text}
    </li>
  )
}
