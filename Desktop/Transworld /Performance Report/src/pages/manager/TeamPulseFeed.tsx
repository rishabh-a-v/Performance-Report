import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DAILY_CHECKINS, profileById } from '@/lib/mockData'
import { useCheckinStore } from '@/store/checkinStore'
import { useTaskStore } from '@/store/taskStore'
import { formatRelative, cn } from '@/lib/utils'
import { Zap, AlertCircle, Link2 } from 'lucide-react'

export function TeamPulseFeed() {
  const { user } = useAuth()
  const { checkins: liveCheckins, getTaskIdsForCheckin } = useCheckinStore()
  const allTasks = useTaskStore((s) => s.tasks)
  if (!user) return null

  // Merge mock + live check-ins for this manager's reportees
  const seedCheckins = DAILY_CHECKINS.filter((c) => {
    const emp = profileById(c.user_id)
    return emp?.manager_id === user.id
  })
  const liveForTeam = liveCheckins.filter((c) => {
    const emp = profileById(c.user_id)
    return emp?.manager_id === user.id
  })
  // Live ones override seed for same user+date
  const seedFiltered = seedCheckins.filter(
    (s) => !liveForTeam.some((l) => l.user_id === s.user_id && l.checkin_date === s.checkin_date)
  )
  const checkins = [...liveForTeam, ...seedFiltered]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Individual check-ins */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Zap size={14} className="text-brand-500" />
          Team Check-ins ({checkins.length})
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

                      {/* Linked tasks */}
                      {(() => {
                        const taskIds = getTaskIdsForCheckin(checkin.id)
                        const linkedTasks = allTasks.filter((t) => taskIds.includes(t.id))
                        if (linkedTasks.length === 0) return null
                        return (
                          <div className="space-y-1.5">
                            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              <Link2 size={10} />
                              Related Tasks
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {linkedTasks.map((t) => (
                                <div
                                  key={t.id}
                                  className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5"
                                >
                                  <span className="text-xs font-medium text-slate-700 max-w-[180px] truncate">{t.title}</span>
                                  <StatusBadge status={t.status} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
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
