import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { TeamJob, TeamJobTask, TeamJobStatus, TeamTaskStatus } from '@/types/database'

interface NewJobPayload {
  title: string
  description: string | null
  head_id: string | null
  due_date: string | null
}

interface NewSubTaskPayload {
  title: string
  task_type: string | null
  assignee_id: string
  due_date: string | null
}

interface TeamJobStore {
  jobs: TeamJob[]
  isLoading: boolean
  fetchJobs: () => Promise<void>
  createJob: (job: NewJobPayload, tasks: NewSubTaskPayload[]) => Promise<string | null>
  addSubTask: (jobId: string, task: NewSubTaskPayload) => Promise<void>
  updateSubTask: (taskId: string, updates: { status?: TeamTaskStatus; notes?: string }) => Promise<void>
  deleteSubTask: (taskId: string, jobId: string) => Promise<void>
  updateJobStatus: (jobId: string, status: TeamJobStatus) => Promise<void>
  deleteJob: (jobId: string) => Promise<void>
  subscribeToRealtime: () => () => void
}

export const useTeamJobStore = create<TeamJobStore>((set, get) => ({
  jobs: [],
  isLoading: false,

  fetchJobs: async () => {
    set({ isLoading: true })

    const [{ data: jobs, error: je }, { data: tasks, error: te }] = await Promise.all([
      supabase.from('team_jobs').select('*').order('created_at', { ascending: false }),
      supabase.from('team_job_tasks').select('*').order('created_at', { ascending: true }),
    ])

    if (je) { console.error('Error fetching team jobs:', je); set({ isLoading: false }); return }
    if (te) { console.error('Error fetching team job tasks:', te); set({ isLoading: false }); return }

    const tasksByJob: Record<string, TeamJobTask[]> = {}
    for (const t of (tasks ?? [])) {
      if (!tasksByJob[t.job_id]) tasksByJob[t.job_id] = []
      tasksByJob[t.job_id].push(t as TeamJobTask)
    }

    const enriched: TeamJob[] = (jobs ?? []).map((j) => ({
      ...(j as TeamJob),
      tasks: tasksByJob[j.id] ?? [],
    }))

    set({ jobs: enriched, isLoading: false })
  },

  createJob: async (jobPayload, taskPayloads) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: job, error: je } = await supabase
      .from('team_jobs')
      .insert({ ...jobPayload, created_by: user.id })
      .select()
      .single()

    if (je || !job) { console.error('Error creating team job:', je); return null }

    const tasksToInsert = taskPayloads.map((t) => ({ ...t, job_id: job.id }))
    const { data: tasks, error: te } = await supabase
      .from('team_job_tasks')
      .insert(tasksToInsert)
      .select()

    if (te) { console.error('Error inserting sub-tasks:', te) }

    const newJob: TeamJob = { ...(job as TeamJob), tasks: (tasks ?? []) as TeamJobTask[] }
    set((s) => ({ jobs: [newJob, ...s.jobs] }))
    return job.id as string
  },

  addSubTask: async (jobId, task) => {
    const { data, error } = await supabase
      .from('team_job_tasks')
      .insert({ ...task, job_id: jobId })
      .select()
      .single()

    if (error || !data) { console.error('Error adding sub-task:', error); return }

    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.id === jobId
          ? { ...j, tasks: [...(j.tasks ?? []), data as TeamJobTask] }
          : j
      ),
    }))
  },

  updateSubTask: async (taskId, updates) => {
    const payload: Record<string, unknown> = { ...updates }
    if (updates.status === 'Completed') payload.completed_at = new Date().toISOString()
    else if (updates.status) payload.completed_at = null

    const { error } = await supabase.from('team_job_tasks').update(payload).eq('id', taskId)
    if (error) { console.error('Error updating sub-task:', error); return }

    set((s) => ({
      jobs: s.jobs.map((j) => ({
        ...j,
        tasks: (j.tasks ?? []).map((t) =>
          t.id === taskId ? { ...t, ...payload } as TeamJobTask : t
        ),
      })),
    }))
  },

  deleteSubTask: async (taskId, jobId) => {
    const { error } = await supabase.from('team_job_tasks').delete().eq('id', taskId)
    if (error) { console.error('Error deleting sub-task:', error); return }

    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.id === jobId
          ? { ...j, tasks: (j.tasks ?? []).filter((t) => t.id !== taskId) }
          : j
      ),
    }))
  },

  updateJobStatus: async (jobId, status) => {
    const { error } = await supabase.from('team_jobs').update({ status }).eq('id', jobId)
    if (error) { console.error('Error updating job status:', error); return }

    set((s) => ({
      jobs: s.jobs.map((j) => j.id === jobId ? { ...j, status } : j),
    }))
  },

  deleteJob: async (jobId) => {
    const { error } = await supabase.from('team_jobs').delete().eq('id', jobId)
    if (error) { console.error('Error deleting team job:', error); return }

    set((s) => ({ jobs: s.jobs.filter((j) => j.id !== jobId) }))
  },

  subscribeToRealtime: () => {
    const channel = supabase
      .channel('team-jobs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_jobs' }, () => get().fetchJobs())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_job_tasks' }, () => get().fetchJobs())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  },
}))
