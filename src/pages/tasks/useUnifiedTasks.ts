import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useTeamJobStore } from '@/store/teamJobStore'
import { useProfileStore } from '@/store/profileStore'
import { useRBACFilter } from '@/hooks/useRBACFilter'
import { todayLocalISO } from '@/lib/utils'
import {
  compareUnified, isDone, isOverdue, stItem, tjItem, unifiedAssigneeIds,
  unifiedDue, unifiedTitle, type UnifiedTask,
} from './taskViewModel'
import type { TeamJob } from '@/types/database'

export type StatusChip = 'all' | 'overdue' | 'today' | 'open' | 'done'

export interface UnifiedFilters {
  chip: StatusChip
  search: string
  branch: string   // 'all' | branch name
  dept: string     // 'all' | department id
  employeeId: string // 'all' | employee profile id
}

function matchesChip(u: UnifiedTask, chip: StatusChip, today: string): boolean {
  switch (chip) {
    case 'overdue': return isOverdue(u, today)
    case 'today':   return unifiedDue(u) === today && !isDone(u)
    case 'open':    return !isDone(u)
    case 'done':    return isDone(u)
    default:        return true
  }
}

export function useUnifiedTasks(filters: UnifiedFilters) {
  const { user } = useAuth()
  const stTasks  = useSpecialTaskStore((s) => s.tasks)
  const jobs     = useTeamJobStore((s) => s.jobs)
  const profiles = useProfileStore((s) => s.profiles)
  const { allowedIds } = useRBACFilter()
  const today = todayLocalISO()
  const userId = user?.id ?? ''

  // Jobs visible to this user — same predicate TeamJobs.tsx used: direct
  // involvement (creator/head/assignee) or RBAC oversight of any participant.
  const scopedJobs = useMemo<TeamJob[]>(() => {
    if (!userId) return []
    return jobs.filter((j) =>
      j.created_by === userId ||
      j.head_id    === userId ||
      (j.tasks ?? []).some((t) => t.assignee_id === userId) ||
      allowedIds.has(j.created_by ?? '') ||
      allowedIds.has(j.head_id ?? '') ||
      (j.tasks ?? []).some((t) => t.assignee_id && allowedIds.has(t.assignee_id))
    )
  }, [jobs, userId, allowedIds])

  // ── My Tasks: everything assigned to me, both kinds, one list ──────────────
  const mineAll = useMemo<UnifiedTask[]>(() => {
    if (!userId) return []
    const result: UnifiedTask[] = []
    for (const t of stTasks) {
      if (t.assignees?.some((a) => a.employee_id === userId)) result.push(stItem(t))
    }
    for (const job of jobs) {
      for (const t of (job.tasks ?? [])) {
        if (t.assignee_id === userId) result.push(tjItem(t, job))
      }
    }
    return result.sort((a, b) => compareUnified(a, b, today))
  }, [stTasks, jobs, userId, today])

  const counts = useMemo(() => ({
    overdue: mineAll.filter((u) => isOverdue(u, today)).length,
    today:   mineAll.filter((u) => unifiedDue(u) === today && !isDone(u)).length,
    open:    mineAll.filter((u) => !isDone(u)).length,
    done:    mineAll.filter((u) => isDone(u)).length,
  }), [mineAll, today])

  // ── Team: others' tasks within my RBAC scope ────────────────────────────────
  const teamAll = useMemo<UnifiedTask[]>(() => {
    if (!userId) return []
    const result: UnifiedTask[] = []
    for (const t of stTasks) {
      const isMine = t.assignees?.some((a) => a.employee_id === userId)
      if (!isMine && t.assignees?.some((a) => allowedIds.has(a.employee_id))) {
        result.push(stItem(t))
      }
    }
    for (const job of scopedJobs) {
      for (const t of (job.tasks ?? [])) {
        if (t.assignee_id !== userId) result.push(tjItem(t, job))
      }
    }
    return result.sort((a, b) => compareUnified(a, b, today))
  }, [stTasks, scopedJobs, userId, allowedIds, today])

  // Search + branch/dept + employee + chip filtering, shared by both tabs.
  const applyFilters = useMemo(() => {
    return (list: UnifiedTask[]) => {
      let out = list
      if (filters.chip !== 'all') out = out.filter((u) => matchesChip(u, filters.chip, today))
      if (filters.branch !== 'all') {
        out = out.filter((u) =>
          unifiedAssigneeIds(u).some((id) => profiles.find((p) => p.id === id)?.branch === filters.branch)
        )
      }
      if (filters.dept !== 'all') {
        out = out.filter((u) =>
          unifiedAssigneeIds(u).some((id) => profiles.find((p) => p.id === id)?.department_id === filters.dept)
        )
      }
      if (filters.employeeId !== 'all') {
        out = out.filter((u) =>
          unifiedAssigneeIds(u).some((id) => id === filters.employeeId)
        )
      }
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase()
        out = out.filter((u) =>
          unifiedTitle(u).toLowerCase().includes(q) ||
          (u.kind === 'tj' && u.job.title.toLowerCase().includes(q)) ||
          (u.kind === 'st' && (u.task.remarks ?? '').toLowerCase().includes(q)) ||
          unifiedAssigneeIds(u).some((id) =>
            profiles.find((p) => p.id === id)?.full_name.toLowerCase().includes(q)
          )
        )
      }
      return out
    }
  }, [filters, profiles, today])

  const mine = useMemo(() => applyFilters(mineAll), [applyFilters, mineAll])
  const team = useMemo(() => applyFilters(teamAll), [applyFilters, teamAll])

  // "By Job" grouping for the Team tab — every scoped job with its sub-tasks.
  const jobGroups = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    let list = scopedJobs
    if (q) {
      list = list.filter((j) =>
        j.title.toLowerCase().includes(q) ||
        (j.description ?? '').toLowerCase().includes(q) ||
        (profiles.find((p) => p.id === j.head_id)?.full_name ?? '').toLowerCase().includes(q)
      )
    }
    return list
      .map((job) => {
        let tasks = (job.tasks ?? []).map((t) => tjItem(t, job))
        if (filters.employeeId !== 'all') {
          tasks = tasks.filter((t) => unifiedAssigneeIds(t).includes(filters.employeeId))
        }
        return { job, tasks }
      })
      .filter((group) => group.tasks.length > 0 || filters.employeeId === 'all')
      .sort((a, b) => {
        // Active jobs first, then by due date
        if ((a.job.status === 'active') !== (b.job.status === 'active')) {
          return a.job.status === 'active' ? -1 : 1
        }
        return (a.job.due_date ?? '9999').localeCompare(b.job.due_date ?? '9999')
      })
  }, [scopedJobs, filters.search, profiles])

  return {
    mine, mineTotal: mineAll.length,
    team, teamTotal: teamAll.length,
    jobGroups,
    counts,
    today,
  }
}
