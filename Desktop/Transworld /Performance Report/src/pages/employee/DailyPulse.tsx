import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useTaskStore } from '@/store/taskStore'
import { DAILY_CHECKINS } from '@/lib/mockData'
import { formatDate, formatDateTime } from '@/lib/utils'
import {
  CheckCircle2, Activity, SmilePlus, Smile, Meh, Frown, SmilePlus as SmileDown,
  ClipboardCheck, Target, Link2
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
  const { getTasksForUser } = useTaskStore()

  const [completed, setCompleted]           = useState('')
  const [focus, setFocus]                   = useState('')
  const [mood]                              = useState<number | null>(null)
  const [selectedTasks, setSelectedTasks]   = useState<string[]>([])
  const [submitted, setSubmitted]           = useState(false)
  const [submitting, setSubmitting]         = useState(false)

  if (!user) return null

  const today        = new Date().toISOString().slice(0, 10)
  const todayCheckin = DAILY_CHECKINS.find((c) => c.user_id === user.id && c.checkin_date === today)
  const myTasks      = getTasksForUser(user.id).filter((t) => t.status !== 'done')

  function toggleTask(id: string) {
    setSelectedTasks((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!completed.trim() || !focus.trim()) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    setSubmitting(false)
    setSubmitted(true)
  }

  // ── Already submitted ──────────────────────────────────────────────────────
  if (todayCheckin || submitted) {
    const checkin = todayCheckin ?? {
      completed_yesterday: completed,
      focus_today: focus,
      mood_score: mood,
      created_at: new Date().toISOString(),
    }

    return (
      <div className="space-y-6 animate-fade-in w-full">
        {/* Submission success */}
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

        {/* Content details side-by-side */}
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
      </div>
    )
  }

  const isValid = completed.trim() && focus.trim()

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in w-full">
      <form onSubmit={handleSubmit} className="space-y-5 w-full">
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
