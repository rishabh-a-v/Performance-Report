import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { SpecialTask, SpecialTaskStatus } from '@/types/database'

interface AddTaskPayload {
  task_name: string
  remarks: string | null
  assigned_by: string
  due_date: string | null
  status: SpecialTaskStatus
}

interface SpecialTaskStore {
  tasks: SpecialTask[]
  isLoading: boolean

  fetchTasks: () => Promise<void>
  addTask: (task: AddTaskPayload, assignee_ids: string[]) => Promise<void>
  updateTask: (id: string, updates: Partial<SpecialTask>) => Promise<void>
  setStatus: (id: string, status: SpecialTaskStatus) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  getTasksForEmployee: (employeeId: string) => SpecialTask[]
  getTasksAssignedBy: (managerId: string) => SpecialTask[]
  getPendingVerificationFor: (verifierId: string) => SpecialTask[]
  approveTaskDetailChange: (id: string, verifierId: string) => Promise<void>
  rejectTaskDetailChange: (id: string, verifierId: string, notes?: string) => Promise<void>
  subscribeToRealtime: () => () => void
}

export const useSpecialTaskStore = create<SpecialTaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async () => {
    const [tasksRes, assigneesRes] = await Promise.all([
      supabase.from('special_tasks').select('*'),
      supabase.from('task_assignees').select('task_id, employee_id, assigned_at'),
    ])
    if (tasksRes.error) {
      console.error('Error fetching special tasks:', tasksRes.error)
      return
    }
    const assigneeMap = new Map<string, Array<{ employee_id: string; assigned_at: string }>>()
    for (const a of (assigneesRes.data ?? [])) {
      if (!assigneeMap.has(a.task_id)) assigneeMap.set(a.task_id, [])
      assigneeMap.get(a.task_id)!.push({ employee_id: a.employee_id, assigned_at: a.assigned_at })
    }
    const tasks = (tasksRes.data ?? []).map((t) => ({
      ...t,
      assignees: assigneeMap.get(t.id as string) ?? [],
    })) as SpecialTask[]
    set({ tasks })
  },

  addTask: async (taskData, assignee_ids) => {
    const now = new Date().toISOString()
    const isSelfAssigned = assignee_ids.includes(taskData.assigned_by)
    const { data, error } = await supabase
      .from('special_tasks')
      .insert({
        ...taskData,
        approval_status: isSelfAssigned ? 'pending' : 'approved',
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding special task:', error)
      return
    }

    const newTask = data as SpecialTask

    if (assignee_ids.length > 0) {
      const { error: assigneeErr } = await supabase
        .from('task_assignees')
        .insert(assignee_ids.map((employee_id) => ({
          task_id: newTask.id,
          employee_id,
          assigned_at: now,
        })))
      if (assigneeErr) {
        console.error('Error adding task assignees:', assigneeErr)
        return
      }
    }

    set((s) => ({
      tasks: [{
        ...newTask,
        assignees: assignee_ids.map((employee_id) => ({ employee_id, assigned_at: now })),
      } as SpecialTask, ...s.tasks],
    }))
  },

  updateTask: async (id, updates) => {
    const { error } = await supabase
      .from('special_tasks')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Error updating special task:', error)
      return
    }

    set((s) => ({
      tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t),
    }))
  },

  setStatus: async (id, status) => {
    const { error } = await supabase
      .from('special_tasks')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Error setting special task status:', error)
      return
    }

    set((s) => ({
      tasks: s.tasks.map((t) => t.id === id ? { ...t, status } : t),
    }))
  },

  deleteTask: async (id) => {
    const { error } = await supabase.from('special_tasks').delete().eq('id', id)
    if (error) { console.error('Error deleting task:', error); return }
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },

  getTasksForEmployee: (employeeId) =>
    get().tasks.filter((t) => t.assignees?.some((a) => a.employee_id === employeeId)),

  getTasksAssignedBy: (managerId) =>
    get().tasks.filter((t) => t.assigned_by === managerId),

  getPendingVerificationFor: (_verifierId) => [],

  approveTaskDetailChange: async (id, verifierId) => {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('special_tasks')
      .update({
        approval_status: 'approved',
        approval_by: verifierId,
        approval_at: now,
        rejection_note: null,
      })
      .eq('id', id)

    if (error) {
      console.error('Error approving task:', error)
      return
    }

    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              approval_status: 'approved',
              approval_by: verifierId,
              approval_at: now,
              rejection_note: null,
            }
          : t
      ),
    }))
  },

  subscribeToRealtime: () => {
    const channel = supabase
      .channel('special-tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'special_tasks' }, () => get().fetchTasks())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignees' }, () => get().fetchTasks())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  },

  rejectTaskDetailChange: async (id, verifierId, notes) => {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('special_tasks')
      .update({
        approval_status: 'rejected',
        approval_by: verifierId,
        approval_at: now,
        rejection_note: notes ?? null,
      })
      .eq('id', id)

    if (error) {
      console.error('Error rejecting task:', error)
      return
    }

    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              approval_status: 'rejected',
              approval_by: verifierId,
              approval_at: now,
              rejection_note: notes ?? null,
            }
          : t
      ),
    }))
  },
}))
