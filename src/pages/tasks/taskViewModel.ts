import type {
  SpecialTask, SpecialTaskStatus, TaskPriority,
  TeamJob, TeamJobTask, TeamTaskStatus,
} from '@/types/database'

// One row in the unified task list: either a Special Task or a Team Job
// sub-task carried with its parent job. The prefixed `id` keeps React keys
// and selection state collision-free across the two id spaces.
export type UnifiedTask =
  | { kind: 'st'; id: string; task: SpecialTask }
  | { kind: 'tj'; id: string; task: TeamJobTask; job: TeamJob }

export const stItem = (task: SpecialTask): UnifiedTask => ({ kind: 'st', id: `st_${task.id}`, task })
export const tjItem = (task: TeamJobTask, job: TeamJob): UnifiedTask => ({ kind: 'tj', id: `tj_${task.id}`, task, job })

// ── Field accessors ───────────────────────────────────────────────────────────

export function unifiedTitle(u: UnifiedTask): string {
  return u.kind === 'st' ? u.task.task_name : u.task.title
}

export function unifiedDue(u: UnifiedTask): string | null {
  return u.task.due_date
}

export function unifiedStatus(u: UnifiedTask): SpecialTaskStatus | TeamTaskStatus {
  return u.task.status
}

export function unifiedAssigneeIds(u: UnifiedTask): string[] {
  return u.kind === 'st'
    ? (u.task.assignees ?? []).map((a) => a.employee_id)
    : [u.task.assignee_id]
}

export function isDone(u: UnifiedTask): boolean {
  return u.task.status === 'Completed'
}

export function isOverdue(u: UnifiedTask, today: string): boolean {
  const due = unifiedDue(u)
  return !!due && due < today && !isDone(u) && unifiedStatus(u) !== 'In review'
}

// ── Status cycling ────────────────────────────────────────────────────────────

// Team-job sub-tasks: 3-state click-to-cycle (never 'In review' — that state
// doesn't exist on TeamJobTask).
export function nextSubTaskStatus(current: TeamTaskStatus): TeamTaskStatus {
  if (current === 'Completed') return 'Yet to start'
  if (current === 'In progress') return 'Completed'
  return 'In progress'
}

// Special tasks keep their existing toggle semantics: done/in-review resets,
// yet-to-start begins, and finishing goes straight to Completed only if you
// assigned the task yourself — otherwise it enters the 'In review' queue.
export function nextSpecialTaskStatus(task: SpecialTask, userId: string): SpecialTaskStatus {
  if (task.status === 'Completed' || task.status === 'In review') return 'Yet to start'
  if (task.status === 'Yet to start') return 'In progress'
  return task.assigned_by === userId ? 'Completed' : 'In review'
}

// ── Team-job authorization ────────────────────────────────────────────────────

// A manager's rank alone isn't enough — they must actually have RBAC oversight
// over this job's creator/head/an assignee, not merely be able to see it because
// they're a rank-and-file assignee on someone else's out-of-scope job.
export function canManageTeamJob(
  job: TeamJob, userId: string, isManagerOrAbove: boolean, allowedIds: Set<string>,
): boolean {
  const isCreator = job.created_by === userId
  const isHead = job.head_id === userId
  const jobInScope =
    allowedIds.has(job.created_by ?? '') ||
    allowedIds.has(job.head_id ?? '') ||
    (job.tasks ?? []).some((t) => t.assignee_id && allowedIds.has(t.assignee_id))
  return isCreator || isHead || (isManagerOrAbove && jobInScope)
}

// Only the sub-task's own assignee or someone who can manage the parent job
// may cycle its status — and only while the job is still active.
export function canUpdateSubTask(
  task: TeamJobTask, job: TeamJob, userId: string, isManagerOrAbove: boolean, allowedIds: Set<string>,
): boolean {
  const isAssignee = task.assignee_id === userId
  return (isAssignee || canManageTeamJob(job, userId, isManagerOrAbove, allowedIds)) && job.status === 'active'
}

// ── Sorting / priority ────────────────────────────────────────────────────────

export const PRIORITY_ORDER: Record<TaskPriority, number> = { urgent: 3, high: 2, medium: 1, low: 0 }

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  urgent: 'bg-red-50 text-red-600',
  high:   'bg-amber-50 text-amber-700',
  medium: 'bg-blue-50 text-blue-700',
  low:    'bg-muted text-muted-foreground',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low',
}

// Overdue first, then by due date (undated last), completed at the bottom.
export function compareUnified(a: UnifiedTask, b: UnifiedTask, today: string): number {
  const doneA = isDone(a) ? 1 : 0
  const doneB = isDone(b) ? 1 : 0
  if (doneA !== doneB) return doneA - doneB
  const overA = isOverdue(a, today) ? 0 : 1
  const overB = isOverdue(b, today) ? 0 : 1
  if (overA !== overB) return overA - overB
  const da = unifiedDue(a) ?? '9999'
  const db = unifiedDue(b) ?? '9999'
  if (da !== db) return da < db ? -1 : 1
  return unifiedTitle(a).localeCompare(unifiedTitle(b))
}
