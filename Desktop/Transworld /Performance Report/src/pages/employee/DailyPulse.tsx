import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useTaskStore } from '@/store/taskStore'
import { useCheckinStore } from '@/store/checkinStore'
import { useReviewStore } from '@/store/reviewStore'
import { DAILY_CHECKINS, PROFILES } from '@/lib/mockData'
import { formatDate, formatDateTime, cn } from '@/lib/utils'
import {
  CheckCircle2, Activity, SmilePlus, Smile, Meh, Frown, SmilePlus as SmileDown,
  ClipboardCheck, Target, Link2, Award, AlertTriangle, Users, Star, XCircle, HelpCircle
} from 'lucide-react'
import type { ReviewStatus, ReviewType } from '@/types/database'

const MOOD_OPTIONS = [
  { score: 5, icon: SmilePlus, label: 'Great' },
  { score: 4, icon: Smile,     label: 'Good' },
  { score: 3, icon: Meh,       label: 'OK' },
  { score: 2, icon: Frown,     label: 'Low' },
  { score: 1, icon: SmileDown, label: 'Rough' },
]

export function DailyPulse() {
  const { user } = useAuth()
  const { getTasksForUser, updateTask } = useTaskStore()
  const { addCheckin, getCheckinForUser } = useCheckinStore()
  const { reviews, addReview, updateReview, submitReview, approveReview, rejectReview } = useReviewStore()

  if (!user) return null

  const today = new Date().toISOString().slice(0, 10)
  const isMD = user.role === 'managing_director'

  // Direct reports list
  const directReports = PROFILES.filter((p) => p.manager_id === user.id && p.is_active)
  const isHigherEmployee = directReports.length > 0 && !isMD

  // ─── TABS & STATE MANAGEMENT ───────────────────────────────────────────────
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'daily' | 'subordinate' | 'approvals'
  >(isHigherEmployee ? 'subordinate' : 'daily')

  // A. Daily Self Review check-in States
  const mySelfReview = reviews.find(
    (r) => r.employee_id === user.id && r.review_type === 'self' && r.review_period === today
  )

  const [completed, setCompleted]             = useState(mySelfReview?.objectives_completed ?? '')
  const [focus, setFocus]                   = useState(mySelfReview?.next_period_goals ?? '')
  const [mood, setMood]                     = useState<number | null>(null)
  const [selectedTasks, setSelectedTasks]   = useState<string[]>([])
  const [tasksToComplete, setTasksToComplete] = useState<string[]>([])
  const [submittingCheckin, setSubmittingCheckin] = useState(false)

  // B. Daily Subordinate Reviews Form States (Higher Employees)
  const [selectedReporteeId, setSelectedReporteeId] = useState<string | null>(null)
  const mySubordinateReviews = reviews.filter(
    (r) => r.employee_id === user.id && r.review_type === 'subordinate' && r.review_period === today
  )

  const activeReportee = directReports.find((r) => r.id === selectedReporteeId)
  const existingSubReview = activeReportee
    ? mySubordinateReviews.find((r) => r.reviewed_employee_id === activeReportee.id)
    : null

  const [subRating, setSubRating] = useState<number>(5)
  const [subAchievements, setSubAchievements] = useState('')
  const [subComments, setSubComments] = useState('')
  const [subBlockers, setSubBlockers] = useState('')

  // C. MD Oversight Dashboard States (MD/Managing Partner only)
  const [selectedMDReviewId, setSelectedMDReviewId] = useState<string | null>(null)
  const allCompanySubordinateReviews = reviews.filter((r) => r.review_type === 'subordinate')
  const selectedMDReview = reviews.find((r) => r.id === selectedMDReviewId)

  const mdReviewedTasks = selectedMDReview
    ? getTasksForUser(selectedMDReview.reviewed_employee_id || '').filter(
        (t) => t.status === 'done' && t.completed_at && t.completed_at.slice(0, 10) === selectedMDReview.review_period
      )
    : []

  // D. Approvals Queue States (Higher Employees)
  const [selectedApproveReviewId, setSelectedApproveReviewId] = useState<string | null>(null)
  const [rejectionNote, setRejectionNote] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')

  // ─── DATA RESOLUTIONS & QUERIES ───────────────────────────────────────────
  const liveCheckin  = getCheckinForUser(user.id, today)
  const todayCheckin = liveCheckin ?? DAILY_CHECKINS.find((c) => c.user_id === user.id && c.checkin_date === today)
  
  // Tasks queries
  const allUserTasks = getTasksForUser(user.id)
  const myTasks      = allUserTasks.filter((t) => t.status !== 'done')
  const completedToday = allUserTasks.filter(
    (t) => t.status === 'done' && t.completed_at && t.completed_at.slice(0, 10) === today
  )

  // Subordinate completed tasks today query
  const reporteeCompletedToday = activeReportee
    ? getTasksForUser(activeReportee.id).filter(
        (t) => t.status === 'done' && t.completed_at && t.completed_at.slice(0, 10) === today
      )
    : []

  // Check if daily self-review is submitted
  const isSelfReviewSubmitted = isMD || (mySelfReview && (mySelfReview.status === 'submitted' || mySelfReview.status === 'approved'))
  const selfNeedsSubmit = !isMD && (!mySelfReview || mySelfReview.status === 'draft' || mySelfReview.status === 'rejected')

  // Count reportees who still need their daily reviews today
  const pendingSubordinateCount = directReports.filter((reporteeId) => {
    const subReview = mySubordinateReviews.find((r) => r.reviewed_employee_id === reporteeId.id)
    return !subReview || subReview.status === 'draft' || subReview.status === 'rejected'
  }).length

  // Approvals Queue list (reviews submitted by reportees today)
  const reporteeIds = directReports.map((r) => r.id)
  const pendingApprovals = reviews.filter(
    (r) => reporteeIds.includes(r.employee_id) && r.status === 'submitted' && r.review_period === today
  )
  const selectedApprovalReview = reviews.find((r) => r.id === selectedApproveReviewId)

  // Submitter tasks completed on the day of the review (for approvals queue details)
  const approvalReporteeTasksCompletedToday = selectedApprovalReview
    ? getTasksForUser(selectedApprovalReview.employee_id).filter(
        (t) => t.status === 'done' && t.completed_at && t.completed_at.slice(0, 10) === selectedApprovalReview.review_period
      )
    : []

  // Reviewed subordinate tasks completed on the day of the review (for approvals queue details)
  const approvalReviewedEmployeeTasksCompletedToday = selectedApprovalReview?.reviewed_employee_id
    ? getTasksForUser(selectedApprovalReview.reviewed_employee_id).filter(
        (t) => t.status === 'done' && t.completed_at && t.completed_at.slice(0, 10) === selectedApprovalReview.review_period
      )
    : []

  // ─── ACTIONS & HANDLERS ───────────────────────────────────────────────────
  
  // 1. Submit Daily Self Review check-in (Executive / Manager Self Review)
  function toggleTask(id: string) {
    setSelectedTasks((prev) => {
      const exists = prev.includes(id)
      if (exists) {
        setTasksToComplete((c) => c.filter((t) => t !== id))
        return prev.filter((t) => t !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  function toggleTaskToComplete(id: string) {
    setTasksToComplete((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  function prefillCompletedTasks() {
    if (completedToday.length === 0) return
    const text = completedToday.map((t) => `- ${t.title}`).join('\n')
    setCompleted((prev) => prev ? `${prev}\n${text}` : text)
  }

  async function handleSubmitCheckin(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !completed.trim() || !focus.trim()) return
    setSubmittingCheckin(true)
    await new Promise((r) => setTimeout(r, 600))
    
    // A. Add to checkinStore for Daily Pulse feed
    addCheckin(
      {
        user_id: user.id,
        checkin_date: today,
        completed_yesterday: completed.trim(),
        focus_today: focus.trim(),
        is_blocked: false,
        blocker_description: null,
        mood_score: mood,
      },
      selectedTasks,
    )

    // B. Add/Update in reviewStore for approval hierarchies & self-review constraints
    const reviewData = {
      employee_id: user.id,
      employee_name: user.full_name,
      employee_role: user.designation ?? 'Employee',
      review_period: today,
      review_type: 'self' as const,
      objectives_assigned: 'Complete daily tasks and goals.',
      objectives_completed: completed.trim(),
      progress_percentage: 100,
      achievements: completed.trim(),
      challenges: 'No blocker reported',
      support_required: null,
      next_period_goals: focus.trim(),
      status: 'submitted' as ReviewStatus,
      submitted_at: new Date().toISOString(),
    }

    if (mySelfReview) {
      updateReview(mySelfReview.id, reviewData)
    } else {
      addReview(reviewData)
    }

    // C. Commit task status updates
    tasksToComplete.forEach((taskId) => {
      updateTask(taskId, {
        status: 'done',
        completed_at: new Date().toISOString(),
      })
    })

    setSubmittingCheckin(false)
  }

  // 2. Load & Save Daily Subordinate Reviews (Higher level employees)
  function loadReporteeReview(reporteeId: string) {
    setSelectedReporteeId(reporteeId)
    const rev = mySubordinateReviews.find((r) => r.reviewed_employee_id === reporteeId)
    setSubRating(rev?.rating ?? 5)
    setSubAchievements(rev?.achievements ?? '')
    setSubComments(rev?.manager_comments ?? '')
    setSubBlockers(rev?.areas_for_improvement ?? '')
  }

  function handleSaveDailySubordinateReview(isSubmit: boolean) {
    if (!user || !selectedReporteeId || !activeReportee) return

    const data = {
      employee_id: user.id,
      employee_name: user.full_name,
      employee_role: user.designation ?? 'Manager',
      review_period: today,
      review_type: 'subordinate' as const,
      reviewed_employee_id: activeReportee.id,
      reviewed_employee_name: activeReportee.full_name,
      rating: subRating,
      achievements: subAchievements,
      manager_comments: subComments,
      areas_for_improvement: subBlockers,
      status: (isSubmit ? 'submitted' : 'draft') as ReviewStatus,
      submitted_at: isSubmit ? new Date().toISOString() : null,
    }

    if (existingSubReview) {
      updateReview(existingSubReview.id, data)
    } else {
      addReview(data)
    }
    alert(isSubmit ? `Daily review for ${activeReportee.full_name} submitted successfully!` : 'Daily review draft saved!')
    setSelectedReporteeId(null)
  }

  // 3. Approve/Reject controls
  function handleApprove(id: string) {
    approveReview(id, approvalNotes)
    setSelectedApproveReviewId(null)
    setApprovalNotes('')
    alert('Review approved!')
  }

  function handleReject(id: string) {
    if (!rejectionNote.trim()) return
    rejectReview(id, rejectionNote)
    setSelectedApproveReviewId(null)
    setRejectionNote('')
    setShowRejectForm(false)
    alert('Review sent back with feedback.')
  }

  // ─── MD OVERSIGHT VIEW ───────────────────────────────────────────────────
  if (isMD) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Subordinate Reviews Oversight</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            As the Managing Partner, monitor and review all subordinate performance reviews submitted across the company.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Subordinate reviews list */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-semibold">Subordinate Reviews</h3>
            {allCompanySubordinateReviews.length === 0 ? (
              <p className="text-xs text-slate-450 italic">No subordinate reviews written yet.</p>
            ) : (
              <div className="space-y-2">
                {allCompanySubordinateReviews.map((rev) => (
                  <button
                    key={rev.id}
                    onClick={() => setSelectedMDReviewId(rev.id)}
                    className={cn(
                      'w-full p-3.5 rounded-xl border text-left transition-all hover:bg-slate-50',
                      selectedMDReviewId === rev.id ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200 bg-white'
                    )}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <p className="text-xs font-bold text-slate-800">{rev.reviewed_employee_name}</p>
                      <span className="rounded bg-indigo-50 text-indigo-700 px-1.5 py-0.25 text-[8px] font-bold uppercase whitespace-nowrap">
                        {rev.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Reviewed by: {rev.employee_name}</p>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Date: {rev.review_period}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subordinate review details */}
          <div className="lg:col-span-2">
            {selectedMDReview ? (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-5 text-slate-700">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Subordinate Appraisal Detail</h3>
                    <p className="text-xs text-slate-400">For employee: <strong className="text-slate-750">{selectedMDReview.reviewed_employee_name}</strong></p>
                  </div>
                  <span className="rounded bg-indigo-50 text-indigo-750 px-2 py-0.5 text-[9px] font-bold uppercase border border-indigo-100">
                    {selectedMDReview.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Reviewed by</span>
                    <span className="font-semibold text-slate-850">{selectedMDReview.employee_name} ({selectedMDReview.employee_role})</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Evaluation Date</span>
                    <span className="font-semibold text-slate-850">{selectedMDReview.review_period}</span>
                  </div>
                </div>

                <div className="flex gap-2 items-center border-t border-slate-50 pt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Rating:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={cn(
                          star <= (selectedMDReview.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Subordinate completed tasks today display */}
                {mdReviewedTasks.length > 0 && (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-800 space-y-1.5 shadow-sm">
                    <p className="font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>Tasks completed today:</span>
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700 font-medium">
                      {mdReviewedTasks.map((t) => (
                        <li key={t.id}>{t.title}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-semibold">Achievements today</span>
                  <p className="text-xs text-slate-750 bg-slate-50 p-2.5 rounded-lg border border-slate-100/50">{selectedMDReview.achievements}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-semibold">Manager Feedback Comments</span>
                  <p className="text-xs text-slate-750 bg-slate-50 p-2.5 rounded-lg border border-slate-100/50">{selectedMDReview.manager_comments}</p>
                </div>

                {selectedMDReview.areas_for_improvement && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block font-semibold">Blockers & Support needed</span>
                    <p className="text-xs text-slate-750 bg-slate-50 p-2.5 rounded-lg border border-slate-100/50">{selectedMDReview.areas_for_improvement}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center bg-white/40">
                <p className="text-sm text-slate-450">Select a subordinate appraisal from the left list to review details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── REGULAR EMPLOYEES & MANAGERS WORKSPACE VIEW ────────────────────────
  return (
    <div className="space-y-6">
      {/* Dynamic Tabs list */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveWorkspaceTab('daily')}
          className={cn(
            'pb-3 border-b-2 transition-all flex items-center gap-1.5',
            activeWorkspaceTab === 'daily' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          <Activity size={14} />
          Daily Self Review
          {selfNeedsSubmit && (
            <span className="rounded-full bg-indigo-100 text-indigo-700 px-1.5 py-px text-[9px] font-bold animate-pulse">
              1
            </span>
          )}
        </button>

        {isHigherEmployee && (
          <>
            <button
              onClick={() => setActiveWorkspaceTab('subordinate')}
              className={cn(
                'pb-3 border-b-2 transition-all flex items-center gap-1.5',
                activeWorkspaceTab === 'subordinate' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <Users size={14} />
              Subordinate Daily Reviews
              {pendingSubordinateCount > 0 && (
                <span className="rounded-full bg-slate-100 text-slate-600 px-1.5 py-px text-[9px] font-bold">
                  {pendingSubordinateCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('approvals')}
              className={cn(
                'pb-3 border-b-2 transition-all flex items-center gap-1.5',
                activeWorkspaceTab === 'approvals' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <ClipboardCheck size={14} />
              Approvals Queue
              {pendingApprovals.length > 0 && (
                <span className="rounded-full bg-amber-100 text-amber-700 px-1.5 py-px text-[9px] font-bold">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {/* ─── DAILY SELF REVIEW TAB ─────────────────────────────────────────── */}
      {activeWorkspaceTab === 'daily' && (
        <div className="animate-fade-in w-full space-y-5">
          {/* Status banner */}
          {mySelfReview && (
            <div className={cn(
              'rounded-xl border p-4 text-xs flex items-start gap-3 shadow-sm',
              mySelfReview.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
              mySelfReview.status === 'submitted' ? 'bg-amber-50 border-amber-100 text-amber-800' :
              mySelfReview.status === 'rejected' ? 'bg-red-50 border-red-100 text-red-800' :
                                                  'bg-slate-50 border-slate-200 text-slate-700'
            )}>
              {mySelfReview.status === 'approved' && <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />}
              {mySelfReview.status === 'submitted' && <HelpCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />}
              {mySelfReview.status === 'rejected' && <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" />}
              
              <div className="space-y-1">
                <p className="font-bold">
                  Daily Review Status: <span className="capitalize">{mySelfReview.status}</span>
                </p>
                {mySelfReview.status === 'submitted' && (
                  <p className="opacity-90">Your daily appraisal has been submitted. You cannot edit it unless your manager sends it back.</p>
                )}
                {mySelfReview.status === 'approved' && (
                  <>
                    <p className="opacity-90">Your daily review is approved by your manager.</p>
                    {mySelfReview.manager_comments && (
                      <p className="mt-1.5 border-t border-emerald-100 pt-1.5 italic font-medium">Manager Feedback: "{mySelfReview.manager_comments}"</p>
                    )}
                  </>
                )}
                {mySelfReview.status === 'rejected' && (
                  <>
                    <p className="opacity-90">Your reviewer requested edits to your daily review. Please update and re-submit.</p>
                    {mySelfReview.rejection_note && (
                      <p className="mt-1.5 border-t border-red-100 pt-1.5 font-bold">Reason: "{mySelfReview.rejection_note}"</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {(!mySelfReview || mySelfReview.status === 'draft' || mySelfReview.status === 'rejected') ? (
            <form onSubmit={handleSubmitCheckin} className="space-y-5 w-full">
              <Card>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Activity size={20} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span>Daily Self Review</span>
                      <span className="text-slate-300 font-normal">·</span>
                      <span className="text-slate-500 text-sm font-medium">{formatDate(today)}</span>
                    </p>
                  </div>
                </div>
              </Card>

              {/* Dynamic Completed Tasks today helper */}
              {completedToday.length > 0 && (
                <Card>
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
                      <CheckCircle2 size={14} className="text-indigo-600" />
                      Tasks Completed Today ({completedToday.length})
                    </label>
                    <button
                      type="button"
                      onClick={prefillCompletedTasks}
                      className="text-xs text-indigo-700 hover:underline font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200"
                    >
                      Prefill completed tasks
                    </button>
                  </div>
                  <div className="space-y-1.5 pl-1">
                    {completedToday.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 text-xs text-slate-700 bg-indigo-50/20 p-2 rounded-lg">
                        <CheckCircle2 size={12} className="text-indigo-600 shrink-0" />
                        <span>{task.title}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <ClipboardCheck size={14} className="text-slate-500" />
                  What did you complete today?
                </label>
                <Textarea
                  value={completed}
                  onChange={(e) => setCompleted(e.target.value)}
                  placeholder="Summarize the work done today, achievements, meetings..."
                  rows={4}
                  required
                />
              </Card>

              {myTasks.length > 0 && (
                <Card>
                  <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Link2 size={14} className="text-slate-500" />
                    Select Active Tasks Worked on Today
                  </label>
                  <div className="space-y-2">
                    {myTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between gap-3 p-2 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors">
                        <label className="flex items-center gap-3 cursor-pointer group flex-1">
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task.id)}
                            onChange={() => toggleTask(task.id)}
                            className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                          />
                          <span className="text-sm group-hover:text-foreground">{task.title}</span>
                          <StatusBadge status={task.status} />
                        </label>
                        {selectedTasks.includes(task.id) && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-emerald-600 select-none">
                            <input
                              type="checkbox"
                              checked={tasksToComplete.includes(task.id)}
                              onChange={() => toggleTaskToComplete(task.id)}
                              className="h-3 w-3 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Mark completed?</span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Target size={14} className="text-slate-500" />
                  What is planned for tomorrow?
                </label>
                <Textarea
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="Key targets, focus areas, plans for tomorrow..."
                  rows={4}
                  required
                />
              </Card>

              <Card>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <SmilePlus size={14} className="text-slate-500" />
                  How are you feeling today?
                </label>
                <div className="flex gap-3">
                  {MOOD_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = mood === opt.score
                    return (
                      <button
                        key={opt.score}
                        type="button"
                        onClick={() => setMood(opt.score)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-xl border p-3 flex-1 transition-all',
                          isSelected
                            ? 'border-blue-500 bg-blue-50/50 text-blue-600 font-semibold'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        )}
                      >
                        <Icon size={20} className={cn(isSelected ? 'text-blue-600' : 'text-slate-400')} />
                        <span className="text-[10px]">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </Card>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={submittingCheckin}
                disabled={!completed.trim() || !focus.trim()}
              >
                Submit Daily Self Review
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 size={20} />
                  </span>
                  <div>
                    <p className="font-semibold">Daily Self Review submitted for today</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-500">{formatDateTime(mySelfReview.submitted_at ?? new Date().toISOString())}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>What was done today</CardTitle></CardHeader>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{mySelfReview.objectives_completed}</p>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Planned for tomorrow</CardTitle></CardHeader>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{mySelfReview.next_period_goals}</p>
                </Card>
              </div>

              {completedToday.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Tasks Completed Today
                    </CardTitle>
                  </CardHeader>
                  <div className="space-y-1.5 pl-1">
                    {completedToday.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                        <span>{task.title}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── SUBORDINATE DAILY REVIEWS TAB ─────────────────────────────────── */}
      {activeWorkspaceTab === 'subordinate' && isHigherEmployee && (
        <div className="space-y-6 animate-fade-in">
          {!isSelfReviewSubmitted ? (
            <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-6 text-center space-y-3 max-w-xl mx-auto my-8">
              <AlertTriangle size={32} className="text-amber-500 mx-auto animate-bounce" />
              <h3 className="font-bold text-amber-900 text-sm">Self Review Required First</h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                All managers, directors, and MD must complete and submit their own Daily Self Review first before they can evaluate their subordinates' daily performance reviews today.
              </p>
              <button
                onClick={() => setActiveWorkspaceTab('daily')}
                className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Complete Self Review Now
              </button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Reportees List */}
              <div className="lg:col-span-1 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Direct Reports</h3>
                <div className="space-y-2">
                  {directReports.map((reportee) => {
                    const subRev = mySubordinateReviews.find((r) => r.reviewed_employee_id === reportee.id)
                    const reviewStatus = subRev ? subRev.status : 'not_started'

                    return (
                      <button
                        key={reportee.id}
                        onClick={() => loadReporteeReview(reportee.id)}
                        className={cn(
                          'w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all hover:bg-slate-50',
                          selectedReporteeId === reportee.id 
                            ? 'border-indigo-600 bg-indigo-50/20' 
                            : 'border-slate-200 bg-white'
                        )}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{reportee.full_name}</p>
                          <p className="text-[10px] text-slate-400">{reportee.designation}</p>
                        </div>
                        
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap',
                          reviewStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          reviewStatus === 'submitted' ? 'bg-amber-100 text-amber-700' :
                          reviewStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                          reviewStatus === 'draft' ? 'bg-blue-100 text-blue-700' :
                                                     'bg-slate-100 text-slate-500'
                        )}>
                          {reviewStatus.replace('_', ' ')}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Subordinate Form Editor */}
              <div className="lg:col-span-2">
                {activeReportee ? (
                  (!existingSubReview || existingSubReview.status === 'draft' || existingSubReview.status === 'rejected') ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveDailySubordinateReview(true) }} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Evaluate reportee's work today</h3>
                        <p className="text-xs text-slate-400">For employee: <strong className="text-slate-700">{activeReportee.full_name}</strong></p>
                      </div>

                      {existingSubReview?.status === 'rejected' && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                          <p className="font-bold">Rejections details:</p>
                          <p className="italic mt-1">"{existingSubReview.rejection_note}"</p>
                        </div>
                      )}

                      {/* Subordinate completed tasks today display */}
                      {reporteeCompletedToday.length > 0 ? (
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-800 space-y-1.5 shadow-sm">
                          <p className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            <span>Tasks completed today:</span>
                          </p>
                          <ul className="list-disc pl-4 space-y-1 text-slate-750 font-medium">
                            {reporteeCompletedToday.map((t) => (
                              <li key={t.id}>{t.title}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-500 italic">
                          No tasks marked as completed by {activeReportee.full_name} today.
                        </div>
                      )}

                      {/* Performance Rating */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Performance Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setSubRating(star)}
                              className="focus:outline-none"
                            >
                              <Star
                                size={18}
                                className={cn(
                                  'transition-all',
                                  star <= subRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                                )}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <Textarea
                        id="sub-achievements"
                        label="Today's Achievements"
                        placeholder="Key accomplishments and milestones completed today..."
                        value={subAchievements}
                        onChange={(e) => setSubAchievements(e.target.value)}
                        rows={3}
                        required
                      />

                      <Textarea
                        id="sub-comments"
                        label="Feedback & Comments"
                        placeholder="Manager notes, feedback, behavior evaluations today..."
                        value={subComments}
                        onChange={(e) => setSubComments(e.target.value)}
                        rows={3}
                        required
                      />

                      <Textarea
                        id="sub-blockers"
                        label="Blockers & Support Needed Today"
                        placeholder="Bottlenecks, support required, training plans..."
                        value={subBlockers}
                        onChange={(e) => setSubBlockers(e.target.value)}
                        rows={2}
                      />

                      <div className="flex gap-3 pt-3 border-t border-slate-100">
                        <Button type="submit" size="sm">Submit Daily Subordinate Review</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleSaveDailySubordinateReview(false)}>Save Draft</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4 text-slate-700">
                      <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">Submitted Daily Subordinate Review ({formatDate(today)})</h3>
                          <p className="text-xs text-slate-400">For employee: <strong className="text-slate-700">{activeReportee.full_name}</strong></p>
                        </div>
                        <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[9px] font-bold uppercase border border-emerald-100">
                          {existingSubReview.status}
                        </span>
                      </div>

                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Rating:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              className={cn(
                                star <= (existingSubReview.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      {reporteeCompletedToday.length > 0 && (
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 space-y-1 shadow-sm">
                          <p className="font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>Tasks completed today:</span>
                          </p>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-700 font-medium">
                            {reporteeCompletedToday.map((t) => (
                              <li key={t.id}>{t.title}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Achievements Today</span>
                        <p className="text-xs text-slate-750 leading-relaxed bg-slate-50 p-2.5 rounded-lg">{existingSubReview.achievements}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Feedback Comments</span>
                        <p className="text-xs text-slate-755 leading-relaxed bg-slate-50 p-2.5 rounded-lg">{existingSubReview.manager_comments}</p>
                      </div>

                      {existingSubReview.areas_for_improvement && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Blockers & Support</span>
                          <p className="text-xs text-slate-750 leading-relaxed">{existingSubReview.areas_for_improvement}</p>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center bg-white/40">
                    <p className="text-sm text-slate-450">Select a reportee from the left panel to review their work today.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── APPROVALS QUEUE TAB ───────────────────────────────────────────── */}
      {activeWorkspaceTab === 'approvals' && isHigherEmployee && (
        <div className="grid gap-6 lg:grid-cols-3 animate-fade-in">
          {/* List of Submitted Reviews */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Awaiting Approval</h3>
            
            {pendingApprovals.length === 0 ? (
              <p className="text-xs text-slate-400">All caught up! No reviews pending approval.</p>
            ) : (
              <div className="space-y-2">
                {pendingApprovals.map((rev) => (
                  <button
                    key={rev.id}
                    onClick={() => { setSelectedApproveReviewId(rev.id); setShowRejectForm(false) }}
                    className={cn(
                      'w-full p-3.5 rounded-xl border text-left transition-all hover:bg-slate-50',
                      selectedApproveReviewId === rev.id ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200 bg-white'
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-bold text-slate-800">{rev.employee_name}</p>
                      <span className="rounded bg-indigo-50 text-indigo-700 px-1.5 py-0.25 text-[8px] font-bold uppercase whitespace-nowrap">
                        {rev.review_type}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">{rev.employee_role}</p>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Cycle: {rev.review_period}</p>
                    {rev.reviewed_employee_name && (
                      <p className="text-[9px] text-indigo-600 font-medium mt-0.5">Reviewing: {rev.reviewed_employee_name}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & Controls */}
          <div className="lg:col-span-2">
            {selectedApprovalReview ? (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-5 text-slate-700">
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Review Details</h3>
                      <p className="text-xs text-slate-400">Submitted by: <strong className="text-slate-650">{selectedApprovalReview.employee_name}</strong> ({selectedApprovalReview.employee_role})</p>
                    </div>
                    <span className="rounded bg-amber-50 text-amber-700 px-2 py-0.5 text-[9px] font-bold uppercase border border-amber-100">
                      Pending review
                    </span>
                  </div>
                </div>

                {selectedApprovalReview.review_type === 'self' ? (
                  /* Daily Self Review details */
                  <div className="space-y-4">
                    {approvalReporteeTasksCompletedToday.length > 0 && (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 space-y-1 shadow-sm">
                        <p className="font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Tasks completed on this day:</span>
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-700 font-medium">
                          {approvalReporteeTasksCompletedToday.map((t) => (
                            <li key={t.id}>{t.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">What was done today</span>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg">{selectedApprovalReview.objectives_completed}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Planned for tomorrow</span>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg">{selectedApprovalReview.next_period_goals}</p>
                    </div>
                  </div>
                ) : (
                  /* Subordinate Daily Review details */
                  <div className="space-y-4">
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-3.5 space-y-2">
                      <p className="text-xs font-bold text-slate-700">Daily Subordinate Appraisal for: {selectedApprovalReview.reviewed_employee_name}</p>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Rating:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              className={cn(
                                star <= (selectedApprovalReview.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {approvalReviewedEmployeeTasksCompletedToday.length > 0 && (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 space-y-1 shadow-sm">
                        <p className="font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Tasks completed on this day:</span>
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-700 font-medium">
                          {approvalReviewedEmployeeTasksCompletedToday.map((t) => (
                            <li key={t.id}>{t.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Achievements Today</span>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg">{selectedApprovalReview.achievements}</p>
                    </div>

                    {selectedApprovalReview.manager_comments && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Feedback / Comments</span>
                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">{selectedApprovalReview.manager_comments}</p>
                      </div>
                    )}

                    {selectedApprovalReview.areas_for_improvement && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Blockers / Support</span>
                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg">{selectedApprovalReview.areas_for_improvement}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Approve / Reject Controls */}
                <div className="border-t border-slate-150 pt-4 space-y-4">
                  {showRejectForm ? (
                    <div className="space-y-2 bg-red-50/40 border border-red-150 rounded-xl p-4">
                      <p className="text-xs font-semibold text-red-800">Reason for Requesting Edits (Required)</p>
                      <textarea
                        value={rejectionNote}
                        onChange={(e) => setRejectionNote(e.target.value)}
                        placeholder="Please clarify objectives, expand achievements summary..."
                        rows={2}
                        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-red-300 bg-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(selectedApprovalReview.id)}
                          disabled={!rejectionNote.trim()}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                        >
                          Confirm Send Back
                        </button>
                        <button
                          onClick={() => { setShowRejectForm(false); setRejectionNote('') }}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 bg-white hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedApprovalReview.review_type === 'self' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Feedback Comments (Optional)</label>
                          <textarea
                            value={approvalNotes}
                            onChange={(e) => setApprovalNotes(e.target.value)}
                            placeholder="Add your review feedback here. This will be visible to the employee."
                            rows={2}
                            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-400 bg-slate-50/40"
                          />
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(selectedApprovalReview.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                        >
                          <CheckCircle2 size={13} />
                          Approve Review
                        </button>
                        <button
                          onClick={() => setShowRejectForm(true)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <AlertTriangle size={13} />
                          Send Back for Edits
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center bg-white/40">
                <p className="text-sm text-slate-400">Select a review from the approvals queue to verify, add feedback comments, and approve or request edits.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
