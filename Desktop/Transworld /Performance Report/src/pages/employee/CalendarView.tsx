import { useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths,
  isSameMonth, isToday, isSameDay, format, parseISO,
} from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { cn } from '@/lib/utils'
import type { JobDirection, SpecialTask } from '@/types/database'
import { ChevronLeft, ChevronRight, Compass, ListTodo } from 'lucide-react'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const JD_PILL: Record<string, string> = {
  active:    'bg-blue-50 text-blue-700',
  submitted: 'bg-amber-50 text-amber-700',
  approved:  'bg-emerald-50 text-emerald-700',
  rejected:  'bg-red-50 text-red-700',
  completed: 'bg-slate-100 text-slate-500 line-through',
  draft:     'bg-slate-100 text-slate-500',
}

const ST_PILL: Record<string, string> = {
  pending:     'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-50 text-blue-700',
  on_hold:     'bg-amber-50 text-amber-700',
  completed:   'bg-emerald-50 text-emerald-700 line-through',
}

type DayItem =
  | { kind: 'jd'; data: JobDirection }
  | { kind: 'st'; data: SpecialTask }

export function CalendarView() {
  const { user } = useAuth()
  const allJDs = useJobDirectionStore((s) => s.directions)
  const allSTs = useSpecialTaskStore((s) => s.tasks)
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<{ kind: 'jd'; data: JobDirection } | { kind: 'st'; data: SpecialTask } | null>(null)

  if (!user) return null

  const myJDs = allJDs.filter((jd) => jd.employee_id === user.id && jd.due_date)
  const mySTs = allSTs.filter((st) => st.assigned_to === user.id && st.due_date)

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end:   endOfWeek(endOfMonth(month)),
  })

  function itemsForDay(day: Date): DayItem[] {
    const jdItems: DayItem[] = myJDs
      .filter((jd) => jd.due_date && isSameDay(parseISO(jd.due_date), day))
      .map((jd) => ({ kind: 'jd' as const, data: jd }))
    const stItems: DayItem[] = mySTs
      .filter((st) => st.due_date && isSameDay(parseISO(st.due_date), day))
      .map((st) => ({ kind: 'st' as const, data: st }))
    return [...stItems, ...jdItems]
  }

  const dayItems = selectedDay ? itemsForDay(selectedDay) : []

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
          >
            <ChevronLeft size={15} />
          </button>
          <h2 className="text-base font-bold text-slate-800 w-36 text-center">
            {format(month, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
          >
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => setMonth(startOfMonth(new Date()))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <Compass size={11} className="text-blue-500" />
            <span>Job Direction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ListTodo size={11} className="text-slate-500" />
            <span>Special Task</span>
          </div>
        </div>
      </div>

      <div className="flex gap-5">
        <div className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAY_LABELS.map((d) => (
              <div key={d} className="py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {days.map((day) => {
              const items = itemsForDay(day)
              const inMonth = isSameMonth(day, month)
              const todayDay = isToday(day)
              const isSelected = selectedDay && isSameDay(day, selectedDay)

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    'min-h-[90px] p-2 cursor-pointer transition-colors',
                    !inMonth && 'bg-slate-50/60',
                    isSelected && 'bg-blue-50',
                    inMonth && !isSelected && 'hover:bg-slate-50/80',
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                      todayDay && 'bg-[#0f172a] text-white',
                      !todayDay && inMonth && 'text-slate-700',
                      !todayDay && !inMonth && 'text-slate-300',
                    )}>
                      {format(day, 'd')}
                    </span>
                    {items.length > 0 && (
                      <span className="text-[9px] font-bold text-slate-400 tabular-nums">{items.length}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {items.slice(0, 3).map((item) => (
                      <div
                        key={item.data.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDetail(item as any)
                        }}
                        className={cn(
                          'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium truncate cursor-pointer hover:opacity-85',
                          item.kind === 'jd'
                            ? JD_PILL[item.data.status] ?? 'bg-blue-50 text-blue-700'
                            : ST_PILL[(item.data as SpecialTask).status] ?? 'bg-slate-100 text-slate-600',
                        )}
                        title={item.data.title}
                      >
                        {item.kind === 'jd'
                          ? <Compass size={9} className="shrink-0 opacity-60" />
                          : <ListTodo size={9} className="shrink-0 opacity-60" />}
                        <span className="truncate">{item.data.title}</span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="pl-1.5 text-[9px] font-semibold text-slate-400">+{items.length - 3} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {selectedDay && (
          <div className="w-64 shrink-0">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-bold text-slate-800">{format(selectedDay, 'EEEE, MMMM d')}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {dayItems.length === 0 ? 'Nothing due' : `${dayItems.length} item${dayItems.length > 1 ? 's' : ''} due`}
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {dayItems.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[11px] text-slate-400">Nothing due on this day.</div>
                ) : (
                  dayItems.map((item) => {
                    const isJD = item.kind === 'jd'
                    const jd = isJD ? (item.data as JobDirection) : null
                    const st = !isJD ? (item.data as SpecialTask) : null
                    const statusLabel = isJD
                      ? jd!.status === 'submitted' ? 'Under Review'
                        : jd!.status === 'rejected' ? 'Changes Needed'
                        : jd!.status.charAt(0).toUpperCase() + jd!.status.slice(1)
                      : st!.status === 'in_progress' ? 'In Progress'
                        : st!.status === 'on_hold' ? 'On Hold'
                        : st!.status.charAt(0).toUpperCase() + st!.status.slice(1)

                    return (
                      <div 
                        key={item.data.id} 
                        onClick={() => setSelectedDetail(item as any)}
                        className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={cn(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded',
                            isJD ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500',
                          )}>
                            {isJD ? <Compass size={10} /> : <ListTodo size={10} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-slate-800 leading-snug">{item.data.title}</p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className={cn(
                                'inline-block rounded-full px-1.5 py-px text-[9px] font-bold',
                                isJD ? JD_PILL[jd!.status] : ST_PILL[st!.status],
                              )}>
                                {statusLabel}
                              </span>
                              {isJD && (
                                <span className="text-[9px] text-slate-400 font-medium">
                                  {jd!.progress_percentage.toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
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
