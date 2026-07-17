import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ClipboardList, Users, LayoutList, FolderKanban } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/store/profileStore'
import { useTeamJobStore } from '@/store/teamJobStore'
import { usePermissionStore } from '@/store/permissionStore'
import { useReportingStore } from '@/store/reportingStore'
import { useRBACFilter } from '@/hooks/useRBACFilter'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatChip, StatChipRow } from '@/components/shared/StatChip'
import { FilterBar } from '@/components/shared/FilterBar'
import { Card } from '@/components/ui/Card'
import { NativeSelect } from '@/components/ui/Select'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { cn } from '@/lib/utils'
import { useUnifiedTasks, type StatusChip } from './useUnifiedTasks'
import { TaskList } from './TaskList'
import { JobGroupSection } from './JobGroupSection'
import { NewMenu } from './NewMenu'
import { AddTaskModal } from './AddTaskModal'
import { CreateJobModal } from './CreateJobModal'
import { JobDetailPanel } from './JobDetailPanel'
import type { SpecialTask, TeamJob, TeamJobTask, UserRole } from '@/types/database'

const ROLE_ORDER: Record<UserRole, number> = {
  executive: 0, executive_assistant: 3, hr: 3, manager: 1, director: 2, managing_director: 3,
}

type Tab = 'mine' | 'team'
type TeamView = 'tasks' | 'byjob'

export function TasksPage() {
  const { user, role } = useAuth()
  const location = useLocation()
  const profiles = useProfileStore((s) => s.profiles)
  const { allowedProfiles, allowedIds, availableBranches, availableDepartments, showBranchFilter, showDeptFilter } = useRBACFilter()
  const canCreateTasks = usePermissionStore((s) => s.permissions?.can_create_tasks ?? false)

  const [tab, setTab] = useState<Tab>('mine')
  const [teamView, setTeamView] = useState<TeamView>('tasks')
  const [chip, setChip] = useState<StatusChip>('all')
  const [search, setSearch] = useState('')
  const [branch, setBranch] = useState('all')
  const [dept, setDept] = useState('all')
  const [employeeId, setEmployeeId] = useState('all')

  // Modals / panels
  const [showAddTask, setShowAddTask] = useState(false)
  const [showCreateJob, setShowCreateJob] = useState(false)
  const [detail, setDetail] = useState<
    | { kind: 'st'; data: SpecialTask }
    | { kind: 'tjt'; data: TeamJobTask; job: TeamJob }
    | null
  >(null)
  const [openJob, setOpenJob] = useState<TeamJob | null>(null)

  // Deep links from notifications keep working ("/tasks", state: { view: 'team' })
  useEffect(() => {
    const state = location.state as { view?: string } | null
    if (state?.view === 'team') setTab('team')
  }, [location.state])

  const isManagerOrAbove = useMemo(() => {
    if (!role) return false
    return ROLE_ORDER[role] >= ROLE_ORDER.manager
  }, [role])

  const reportingRecords = useReportingStore((s) => s.reportingRecords)
  const isExcluded = ['hr', 'managing_director', 'executive_assistant'].includes(user?.role || '')
  const hasReportees = reportingRecords.some((r) => r.reporting_to_id === user?.id)
  const showTeam = isExcluded || hasReportees

  const { mine, team, teamTotal, jobGroups, counts } = useUnifiedTasks({
    chip:       tab === 'mine' ? chip : 'all',
    search:     tab === 'team' ? search : '',
    branch:     tab === 'team' ? branch : 'all',
    dept:       tab === 'team' ? dept : 'all',
    employeeId: tab === 'team' ? employeeId : 'all',
  })

  // Keep the open job panel in sync with store updates (sub-task edits, realtime)
  const jobs = useTeamJobStore((s) => s.jobs)
  useEffect(() => {
    if (openJob) {
      const updated = jobs.find((j) => j.id === openJob.id)
      if (updated) setOpenJob(updated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs])

  if (!user) return null

  const openCount = counts.open

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tasks"
        description="Everything assigned to you and your team, in one place"
        actions={
          <NewMenu
            canCreateTask={canCreateTasks}
            canCreateJob={isManagerOrAbove}
            onNewTask={() => setShowAddTask(true)}
            onNewJob={() => setShowCreateJob(true)}
          />
        }
      >
        {/* Primary tabs — the only tab layer */}
        {showTeam && (
          <div className="flex gap-1 border-b border-border">
            <button
              onClick={() => setTab('mine')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
                tab === 'mine' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <ClipboardList size={15} />
              My Tasks
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold',
                tab === 'mine' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                {openCount}
              </span>
            </button>
            <button
              onClick={() => setTab('team')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
                tab === 'team' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Users size={15} />
              Team
              {teamTotal > 0 && (
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold',
                  tab === 'team' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                  {teamTotal}
                </span>
              )}
            </button>
          </div>
        )}
      </PageHeader>

      {/* My Tasks: click-to-filter stat chips replace KPI cards + status sub-tabs */}
      {tab === 'mine' && (
        <StatChipRow>
          <StatChip label="Overdue"   value={counts.overdue} tone="danger"
            onClick={() => setChip(chip === 'overdue' ? 'all' : 'overdue')} active={chip === 'overdue'} />
          <StatChip label="Due today" value={counts.today} tone="warn"
            onClick={() => setChip(chip === 'today' ? 'all' : 'today')} active={chip === 'today'} />
          <StatChip label="Open"      value={counts.open}
            onClick={() => setChip(chip === 'open' ? 'all' : 'open')} active={chip === 'open'} />
          <StatChip label="Done"      value={counts.done} tone="success"
            onClick={() => setChip(chip === 'done' ? 'all' : 'done')} active={chip === 'done'} />
        </StatChipRow>
      )}

      {/* Team: one-row toolbar */}
      {tab === 'team' && (
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search tasks, jobs, people…"
          summary={`${teamView === 'tasks' ? team.length : jobGroups.length} of ${teamView === 'tasks' ? teamTotal : jobGroups.length} ${teamView === 'tasks' ? 'tasks' : 'jobs'}`}
          filters={
            (showBranchFilter || showDeptFilter || allowedProfiles.length > 0) ? (
              <>
                {allowedProfiles.length > 0 && (
                  <NativeSelect
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="rounded-lg border border-border bg-card py-2 pl-3 pr-8 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="all">All Employees</option>
                    {allowedProfiles.map((p) => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </NativeSelect>
                )}
                {showBranchFilter && (
                  <NativeSelect
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="rounded-lg border border-border bg-card py-2 pl-3 pr-8 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="all">All Branches</option>
                    {availableBranches.map((b) => <option key={b} value={b}>{b}</option>)}
                  </NativeSelect>
                )}
                {showDeptFilter && (
                  <NativeSelect
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="rounded-lg border border-border bg-card py-2 pl-3 pr-8 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="all">All Departments</option>
                    {availableDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </NativeSelect>
                )}
              </>
            ) : undefined
          }
        />
      )}

      {/* The one content card */}
      <Card padding={false}>
        {tab === 'team' && (
          <div className="flex items-center gap-1 border-b border-border px-4 py-2.5">
            <button
              onClick={() => setTeamView('tasks')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                teamView === 'tasks' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <LayoutList size={13} /> Tasks
            </button>
            <button
              onClick={() => setTeamView('byjob')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                teamView === 'byjob' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <FolderKanban size={13} /> By Job
            </button>
          </div>
        )}

        {tab === 'mine' ? (
          <TaskList
            items={mine}
            context="mine"
            emptyMessage={chip === 'all' ? 'Nothing assigned to you yet. Enjoy the quiet!' : 'No tasks match this filter.'}
            isManagerOrAbove={isManagerOrAbove}
            allowedIds={allowedIds}
            onOpenSt={(t) => setDetail({ kind: 'st', data: t })}
            onOpenTj={(task, job) => setDetail({ kind: 'tjt', data: task, job })}
            onOpenJob={(job) => setOpenJob(job)}
          />
        ) : teamView === 'tasks' ? (
          <TaskList
            items={team}
            context="team"
            emptyMessage={search || branch !== 'all' || dept !== 'all' || employeeId !== 'all' ? 'No tasks match your filters.' : 'No team tasks in your scope yet.'}
            isManagerOrAbove={isManagerOrAbove}
            allowedIds={allowedIds}
            onOpenSt={(t) => setDetail({ kind: 'st', data: t })}
            onOpenTj={(task, job) => setDetail({ kind: 'tjt', data: task, job })}
            onOpenJob={(job) => setOpenJob(job)}
          />
        ) : (
          <JobGroupSection
            groups={jobGroups}
            userId={user.id}
            isManagerOrAbove={isManagerOrAbove}
            allowedIds={allowedIds}
            onOpenJob={(job) => setOpenJob(job)}
            onOpenSubTask={(task, job) => setDetail({ kind: 'tjt', data: task, job })}
          />
        )}
      </Card>

      {/* ── Modals & panels ── */}
      <AddTaskModal open={showAddTask} onClose={() => setShowAddTask(false)} />

      {showCreateJob && (
        <CreateJobModal
          onClose={() => setShowCreateJob(false)}
          allowedProfiles={allowedProfiles}
        />
      )}

      <TaskDetailModal
        item={detail}
        onClose={() => setDetail(null)}
        onOpenJob={(job) => setOpenJob(job)}
      />

      {openJob && (
        <JobDetailPanel
          job={openJob}
          onClose={() => setOpenJob(null)}
          userId={user.id}
          isManagerOrAbove={isManagerOrAbove}
          profiles={profiles}
          allowedProfiles={allowedProfiles}
          allowedIds={allowedIds}
        />
      )}
    </div>
  )
}
