import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/Select'
import { useBlockerStore } from '@/store/blockerStore'
import { useTaskStore } from '@/store/taskStore'
import { DAILY_CHECKINS, PROFILES } from '@/lib/mockData'
import { formatDate, formatDateTime, cn } from '@/lib/utils'
import {
  CheckCircle2, AlertCircle, Activity, Smile, Meh, Frown, SmilePlus, SmilePlus as SmileDown,
  ClipboardCheck, Target, ShieldAlert, Link2, HeartPulse, UserX,
} from 'lucide-react'

const MOOD_OPTIONS = [
  { score: 5, icon: SmilePlus, label: 'Great' },
  { score: 4, icon: Smile,     label: 'Good' },
  { score: 3, icon: Meh,       label: 'OK' },
  { score: 2, icon: Frown,     label: 'Low' },
  { score: 1, icon: SmileDown, label: 'Rough' },
]

export function DailyPulse() {
  const { user } = useAuth()
  const { addBlocker } = useBlockerStore()
  const { getTasksForUser } = useTaskStore()

  const [completed, setCompleted]           = useState('')
  const [focus, setFocus]                   = useState('')
  const [isBlocked, setIsBlocked]           = useState<boolean | null>(null)
  const [blockerDesc, setBlockerDesc]       = useState('')
  const [blockedByUserId, setBlockedByUser] = useState('')
  const [mood, setMood]                     = useState<number | null>(null)
  const [selectedTasks, setSelectedTasks]   = useState<string[]>([])
  const [submitted, setSubmitted]           = useState(false)
  const [submitting, setSubmitting]         = useState(false)

  if (!user) return null

  const today        = new Date().toISOString().slice(0, 10)
  const todayCheckin = DAILY_CHECKINS.find((c) => c.user_id === user.id && c.checkin_date === today)
  const myTasks      = getTasksForUser(user.id).filter((t) => t.status !== 'done')

  const otherUsers = PROFILES
    .filter((p) => p.id !== user.id && p.is_active)
    .sort((a, b) => a.full_name.localeCompare(b.full_name))

  const blockedByProfile = PROFILES.find((p) => p.id === blockedByUserId)

  function toggleTask(id: string) {
    setSelectedTasks((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!completed.trim() || !focus.trim() || isBlocked === null) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))

    if (isBlocked && blockerDesc.trim() && user) {
      addBlocker({
        employee_id: user.id,
        task_id: selectedTasks[0] ?? null,
        description: blockerDesc.trim(),
        blocked_by_user_id: blockedByUserId || null,
        reported_at: new Date().toISOString(),
        resolved_at: null,
        resolved_by: null,
        resolution_notes: null,
        hours_blocked: 0,
      })
    }

    setSubmitting(false)
    setSubmitted(true)
  }

  // ── Already submitted ──────────────────────────────────────────────────────
  if (todayCheckin || submitted) {
    const checkin = todayCheckin ?? {
      completed_yesterday: completed,
      focus_today: focus,
      is_blocked: isBlocked ?? false,
      blocker_description: blockerDesc || null,
      mood_score: mood,
      created_at: new Date().toISOString(),
    }
    const MoodIcon = MOOD_OPTIONS.find((m) => m.score === checkin.mood_score)?.icon

    return (
      <div className="space-y-6 animate-fade-in">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={20} />
            </span>
            <div>
              <p className="font-semibold">Pulse submitted for today</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(checkin.created_at)}</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Completed Yesterday</CardTitle></CardHeader>
            <p className="text-sm text-muted-foreground leading-relaxed">{checkin.completed_yesterday}</p>
          </Card>
          <Card>
            <CardHeader><CardTitle>Focus Today</CardTitle></CardHeader>
            <p className="text-sm text-muted-foreground leading-relaxed">{checkin.focus_today}</p>
          </Card>
        </div>

        <Card>
          <div className="flex items-start gap-3">
            {checkin.is_blocked ? (
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle size={16} />
              </span>
            ) : (
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={16} />
              </span>
            )}
            <div className="flex-1">
              <p className="font-medium">
                {checkin.is_blocked ? 'Blocked' : 'Not Blocked'}
              </p>
              {checkin.blocker_description && (
                <p className="mt-1 text-sm text-muted-foreground">{checkin.blocker_description}</p>
              )}
              {submitted && isBlocked && blockedByProfile && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Blocked by:</span>
                  <Avatar name={blockedByProfile.full_name} size="xs" />
                  <span className="text-xs font-semibold text-red-700">{blockedByProfile.full_name}</span>
                  <span className="text-xs text-muted-foreground">· {blockedByProfile.designation}</span>
                </div>
              )}
            </div>
            {MoodIcon && (
              <MoodIcon size={22} className="ml-auto text-muted-foreground" />
            )}
          </div>
        </Card>
      </div>
    )
  }

  const isValid =
    completed.trim() &&
    focus.trim() &&
    isBlocked !== null &&
    (!isBlocked || blockerDesc.trim())

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
        {/* Header */}
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Activity size={20} />
            </span>
            <div>
              <p className="font-semibold">Daily Pulse — {formatDate(today)}</p>
              <p className="text-xs text-muted-foreground">Keep your team and manager in sync. Takes 2 minutes.</p>
            </div>
          </div>
        </Card>

        {/* Completed yesterday */}
        <Card>
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ClipboardCheck size={14} className="text-muted-foreground" />
            What did you complete yesterday?
          </label>
          <Textarea
            value={completed}
            onChange={(e) => setCompleted(e.target.value)}
            placeholder="e.g. Finished the API integration, reviewed 2 PRs, updated the docs…"
            rows={4}
          />
        </Card>

        {/* Focus today */}
        <Card>
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Target size={14} className="text-muted-foreground" />
            What are you focusing on today?
          </label>
          <Textarea
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. Complete the auth migration, fix 2 bugs from the backlog…"
            rows={4}
          />
        </Card>

        {/* Blocker */}
        <Card>
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert size={14} className="text-muted-foreground" />
            Are you blocked on anything?
          </label>
          <div className="flex gap-3">
            {[
              { v: false, label: 'No, all clear' },
              { v: true,  label: 'Yes, I am blocked' },
            ].map(({ v, label }) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setIsBlocked(v)}
                className={cn(
                  'flex-1 rounded-lg border-2 py-3 text-sm font-medium transition-all',
                  isBlocked === v
                    ? v
                      ? 'border-destructive bg-destructive/5 text-destructive'
                      : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-input text-muted-foreground hover:border-border',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {isBlocked === true && (
            <div className="mt-4 space-y-3">
              {/* Who is blocking you */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Who is blocking you? (optional)
                </p>
                <Select value={blockedByUserId} onValueChange={setBlockedByUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="No specific person — general blocker" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherUsers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}{p.designation ? ` · ${p.designation}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {blockedByProfile && (
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
                    <Avatar name={blockedByProfile.full_name} size="sm" />
                    <div>
                      <p className="text-xs font-semibold text-destructive">{blockedByProfile.full_name}</p>
                      <p className="text-[10px] text-destructive/70">{blockedByProfile.designation}</p>
                    </div>
                    <span className="ml-auto rounded-full border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                      Blocking you
                    </span>
                  </div>
                )}
              </div>

              {/* Blocker description */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Describe the blocker *
                </p>
                <Textarea
                  value={blockerDesc}
                  onChange={(e) => setBlockerDesc(e.target.value)}
                  placeholder={
                    blockedByProfile
                      ? `e.g. Waiting on ${blockedByProfile.full_name.split(' ')[0]} to share the API spec…`
                      : 'Describe what is blocking you and how it impacts your work…'
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Related tasks */}
        {myTasks.length > 0 && (
          <Card>
            <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Link2 size={14} className="text-muted-foreground" />
              Related tasks (optional)
            </label>
            <div className="space-y-2">
              {myTasks.map((task) => (
                <label key={task.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.id)}
                    onChange={() => toggleTask(task.id)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <span className="text-sm group-hover:text-foreground">{task.title}</span>
                  <StatusBadge status={task.status} />
                </label>
              ))}
            </div>
          </Card>
        )}



        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={submitting}
          disabled={!isValid}
        >
          Submit Daily Pulse
        </Button>
      </form>
    </div>
  )
}
