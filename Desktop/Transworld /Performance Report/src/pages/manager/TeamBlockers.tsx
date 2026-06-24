import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Textarea } from '@/components/ui/Input'
import { useBlockerStore } from '@/store/blockerStore'
import { PROFILES, profileById } from '@/lib/mockData'
import { formatRelative, hoursBlocked, cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle2, Clock, MessageSquare, UserX } from 'lucide-react'

export function TeamBlockers() {
  const { user } = useAuth()
  const { blockers, resolveBlocker } = useBlockerStore()

  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [notes, setNotes]             = useState('')
  const [resolving, setResolving]     = useState(false)

  if (!user) return null

  // All direct reports of this manager (not just those with existing blockers)
  const myReporteeIds = new Set(
    PROFILES.filter((p) => p.manager_id === user.id).map((p) => p.id),
  )

  // Dept heads / execs see all
  const seeAll = user.role === 'director' || user.role === 'managing_director'

  const active   = blockers.filter((b) => !b.resolved_at && (seeAll || myReporteeIds.has(b.employee_id)))
  const resolved = blockers.filter((b) =>  b.resolved_at && (seeAll || myReporteeIds.has(b.employee_id)))

  async function handleResolve(id: string) {
    setResolving(true)
    await new Promise((r) => setTimeout(r, 600))
    resolveBlocker(id, user?.id ?? '', notes)
    setResolvingId(null)
    setNotes('')
    setResolving(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-red-500">Active Blockers</p>
          <p className="mt-1.5 text-3xl font-bold text-red-700">{active.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Resolved</p>
          <p className="mt-1.5 text-3xl font-bold text-emerald-700">{resolved.length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Avg Block Time</p>
          <p className="mt-1.5 text-3xl font-bold text-amber-700">
            {active.length
              ? `${Math.round(active.reduce((s, b) => s + (b.hours_blocked ?? 0), 0) / active.length)}h`
              : '—'}
          </p>
        </div>
      </div>

      {/* Active blockers */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <AlertTriangle size={14} className="text-red-500" />
          Active Blockers
        </h2>
        {active.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-8">
              <CheckCircle2 size={32} className="text-emerald-400" />
              <p className="text-sm text-slate-500">No active blockers — team is unblocked!</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {active.map((blocker) => {
              const emp        = profileById(blocker.employee_id)
              const blockedBy  = blocker.blocked_by_user_id
                ? PROFILES.find((p) => p.id === blocker.blocked_by_user_id)
                : null
              const hrs = blocker.hours_blocked ?? hoursBlocked(blocker.reported_at)
              if (!emp) return null

              return (
                <Card key={blocker.id} className={cn(
                  hrs > 48 ? 'border-red-300 bg-red-50/30' : '',
                )}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Employee info */}
                    <div className="flex gap-3 flex-1 min-w-0">
                      <Avatar name={emp.full_name} />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900">{emp.full_name}</p>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Blocked
                          </span>
                          {hrs > 48 && (
                            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                              {hrs}h — Escalate
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{emp.designation}</p>
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <Clock size={11} />
                          <span>
                            Blocked for <strong>{hrs}h</strong> · reported {formatRelative(blocker.reported_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700 leading-relaxed">{blocker.description}</p>

                        {/* Blocked-by user badge */}
                        {blockedBy && (
                          <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5">
                            <UserX size={11} className="text-orange-600 shrink-0" />
                            <span className="text-xs text-orange-700 font-medium">Blocked by:</span>
                            <Avatar name={blockedBy.full_name} size="xs" />
                            <span className="text-xs font-semibold text-orange-800">{blockedBy.full_name}</span>
                            <span className="text-[10px] text-orange-500">· {blockedBy.designation}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0">
                      {resolvingId === blocker.id ? (
                        <div className="w-64 space-y-2">
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add resolution notes (optional)…"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleResolve(blocker.id)} loading={resolving}>
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setResolvingId(null); setNotes('') }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setResolvingId(blocker.id)}
                        >
                          <CheckCircle2 size={13} />
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Resolved blockers */}
      {resolved.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Recently Resolved
          </h2>
          <Card padding={false}>
            <div className="divide-y divide-slate-50">
              {resolved.map((blocker) => {
                const emp       = profileById(blocker.employee_id)
                const blockedBy = blocker.blocked_by_user_id
                  ? PROFILES.find((p) => p.id === blocker.blocked_by_user_id)
                  : null
                if (!emp) return null
                return (
                  <div key={blocker.id} className="flex items-start gap-3 px-4 py-3 opacity-60">
                    <Avatar name={emp.full_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-700">{emp.full_name}</p>
                        {blockedBy && (
                          <span className="text-[10px] text-slate-400">
                            · blocked by <span className="font-medium">{blockedBy.full_name}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{blocker.description}</p>
                      {blocker.resolution_notes && (
                        <div className="mt-1 flex items-start gap-1 text-xs text-emerald-600">
                          <MessageSquare size={10} className="mt-0.5 shrink-0" />
                          <span>{blocker.resolution_notes}</span>
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {blocker.resolved_at ? formatRelative(blocker.resolved_at) : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
