import { useState, useMemo } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths,
  isSameMonth, isToday, isSameDay, format, parseISO,
} from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useTeamJobStore } from '@/store/teamJobStore'
import { cn } from '@/lib/utils'
import type { SpecialTask, TeamJob, TeamJobTask } from '@/types/database'
import { ChevronLeft, ChevronRight, ListTodo, Briefcase } from 'lucide-react'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { StatusBadge, statusVariant } from '@/components/ui/StatusBadge'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Pill background/text classes keyed by the shared status→variant classification (see StatusBadge). */
const VARIANT_PILL_CLASSES: Record<string, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info:    'bg-primary/10 text-primary',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  danger:  'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
}

function statusPillClasses(status: string) {
  return cn(VARIANT_PILL_CLASSES[statusVariant(status)], status === 'Completed' && 'line-through')
}

type DayItem =
  | { kind: 'st'; data: SpecialTask }
  | { kind: 'tj'; data: TeamJobTask; job: TeamJob }

export function CalendarView() {
  const { user } = useAuth()
  const allSTs      = useSpecialTaskStore((s) => s.tasks)
  const allTeamJobs = useTeamJobStore((s) => s.jobs)
  const [month, setMonth]               = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<
    | { kind: 'st'; data: SpecialTask }
    | { kind: 'tjt'; data: TeamJobTask; job: TeamJob }
    | null
  >(null)

  if (!user) return null

  const mySTs = allSTs.filter((st) => st.assignees?.some((a) => a.employee_id === user.id) && st.due_date)

  const myTeamTasks = useMemo(() => {
    const result: Array<{ task: TeamJobTask; job: TeamJob }> = []
    for (const job of allTeamJobs) {
      for (const task of (job.tasks ?? [])) {
        if (task.assignee_id === user.id && task.due_date) {
          result.push({ task, job })
        }
      }
    }
    return result
  }, [allTeamJobs, user.id])

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end:   endOfWeek(endOfMonth(month)),
  })

  function itemsForDay(day: Date): DayItem[] {
    const stItems: DayItem[] = mySTs
      .filter((st) => st.due_date && isSameDay(parseISO(st.due_date), day))
      .map((st) => ({ kind: 'st' as const, data: st }))

    const tjItems: DayItem[] = myTeamTasks
      .filter(({ task }) => task.due_date && isSameDay(parseISO(task.due_date), day))
      .map(({ task, job }) => ({ kind: 'tj' as const, data: task, job }))

    return [...stItems, ...tjItems]
  }

  const dayItems = selectedDay ? itemsForDay(selectedDay) : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-card"
          >
            <ChevronLeft size={15} />
          </button>
          <h2 className="text-base font-bold text-foreground w-36 text-center">
            {format(month, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-card"
          >
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => setMonth(startOfMonth(new Date()))}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors shadow-card"
          >
            Today
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[10px] font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ListTodo size={11} className="text-muted-foreground" />
            <span>Special Task</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase size={11} className="text-amber-500" />
            <span>Team Sub-task</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-5">
        <div className="flex-1 min-w-0 rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {DAY_LABELS.map((d) => (
              <div key={d} className="py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y divide-border">
            {days.map((day) => {
              const items = itemsForDay(day)
              const inMonth  = isSameMonth(day, month)
              const todayDay = isToday(day)
              const isSelected = selectedDay && isSameDay(day, selectedDay)

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    'min-h-[90px] p-2 cursor-pointer transition-colors',
                    !inMonth && 'bg-muted/60',
                    isSelected && 'bg-primary/10',
                    inMonth && !isSelected && 'hover:bg-muted/80',
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                      todayDay && 'bg-foreground text-background',
                      !todayDay && inMonth && 'text-foreground',
                      !todayDay && !inMonth && 'text-muted-foreground',
                    )}>
                      {format(day, 'd')}
                    </span>
                    {items.length > 0 && (
                      <span className="text-[9px] font-bold text-muted-foreground tabular-nums">{items.length}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {items.slice(0, 3).map((item) =>
                      item.kind === 'st' ? (
                        <div
                          key={item.data.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedDetail(item) }}
                          className={cn(
                            'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium truncate cursor-pointer hover:opacity-85',
                            statusPillClasses(item.data.status),
                          )}
                          title={item.data.task_name}
                        >
                          <ListTodo size={9} className="shrink-0 opacity-60" />
                          <span className="truncate">{item.data.task_name}</span>
                        </div>
                      ) : (
                        <div
                          key={item.data.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedDetail({ kind: 'tjt', data: item.data, job: item.job }) }}
                          className={cn(
                            'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium truncate cursor-pointer hover:opacity-85',
                            statusPillClasses(item.data.status),
                          )}
                          title={`${item.job.title} — ${item.data.title}`}
                        >
                          <Briefcase size={9} className="shrink-0 opacity-60" />
                          <span className="truncate">{item.data.title}</span>
                        </div>
                      )
                    )}
                    {items.length > 3 && (
                      <div className="pl-1.5 text-[9px] font-semibold text-muted-foreground">+{items.length - 3} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {selectedDay && (
          <div className="w-full sm:w-64 shrink-0">
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <p className="text-xs font-bold text-foreground">{format(selectedDay, 'EEEE, MMMM d')}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {dayItems.length === 0 ? 'Nothing due' : `${dayItems.length} item${dayItems.length > 1 ? 's' : ''} due`}
                </p>
              </div>
              <div className="divide-y divide-border">
                {dayItems.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[11px] text-muted-foreground">Nothing due on this day.</div>
                ) : (
                  dayItems.map((item) =>
                    item.kind === 'st' ? (
                      <div
                        key={item.data.id}
                        onClick={() => setSelectedDetail(item)}
                        className="px-4 py-3 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                            <ListTodo size={10} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-foreground leading-snug">
                              {item.data.task_name}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <StatusBadge status={item.data.status} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={item.data.id}
                        onClick={() => setSelectedDetail({ kind: 'tjt', data: item.data, job: item.job })}
                        className="px-4 py-3 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-50 text-amber-600">
                            <Briefcase size={10} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-foreground leading-snug">
                              {item.data.title}
                            </p>
                            <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{item.job.title}</p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <StatusBadge status={item.data.status} />
                            </div>
                            {item.data.notes && (
                              <p className="mt-1 text-[9px] text-muted-foreground italic leading-tight line-clamp-2">
                                {item.data.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <TaskDetailModal item={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </div>
  )
}
