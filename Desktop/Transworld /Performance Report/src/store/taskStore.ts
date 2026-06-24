import { create } from 'zustand'
import { ALL_TASKS, PROGRESS_HISTORY as SEED_HISTORY, MILESTONES } from '@/lib/mockData'
import type { Task, TaskProgressHistory, Milestone } from '@/types/database'
import { isMeasurable, isValue, isMilestone } from '@/lib/kpiEngine'

interface TaskStore {
  tasks: Task[]
  history: TaskProgressHistory[]
  milestones: Milestone[]
  // quantity / legacy
  updateProgress: (taskId: string, completedQuantity: number) => void
  // value model
  updateValue: (taskId: string, currentValue: number) => void
  // milestone model
  toggleMilestone: (milestoneId: string) => void
  deleteMilestone: (milestoneId: string) => void
  addMilestones: (newMilestones: Milestone[]) => void
  getMilestonesForTask: (taskId: string) => Milestone[]
  // generic
  toggleTaskDone: (taskId: string) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  getTasksForUser: (userId: string) => Task[]
  getMeasurableTasks: () => Task[]
  getHistoryForTask: (taskId: string) => TaskProgressHistory[]
  getTeamMeasurableTasks: (memberIds: string[]) => Task[]
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks:      [...ALL_TASKS],
  history:    [...SEED_HISTORY],
  milestones: [...MILESTONES],

  updateProgress: (taskId, completedQuantity) => {
    const task = get().tasks.find((t) => t.id === taskId)
    if (!task?.target_quantity) return

    const progress_percentage = parseFloat(
      ((completedQuantity / task.target_quantity) * 100).toFixed(2),
    )
    const delta = completedQuantity - (task.completed_quantity ?? 0)
    const today = new Date().toISOString().slice(0, 10)

    const now = new Date().toISOString()
    const isComplete = completedQuantity >= task.target_quantity

    set((state) => {
      const tasks = state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed_quantity: completedQuantity,
              updated_at: now,
              ...(isComplete && t.status !== 'done'
                ? { status: 'done' as const, completed_at: now }
                : {}),
            }
          : t,
      )
      const existingIdx = state.history.findIndex(
        (h) => h.task_id === taskId && h.recorded_date === today,
      )
      let history: TaskProgressHistory[]
      if (existingIdx >= 0) {
        history = state.history.map((h, i) =>
          i === existingIdx
            ? { ...h, completed_quantity: completedQuantity, progress_percentage, daily_delta: h.daily_delta + Math.max(0, delta) }
            : h,
        )
      } else {
        history = [
          ...state.history,
          {
            id: `ph_live_${Date.now()}`,
            task_id: taskId,
            recorded_date: today,
            completed_quantity: completedQuantity,
            progress_percentage,
            daily_delta: Math.max(0, delta),
            created_at: now,
          },
        ]
      }
      return { tasks, history }
    })
  },

  updateValue: (taskId, currentValue) => {
    const task = get().tasks.find((t) => t.id === taskId)
    if (!task?.target_value) return
    const now = new Date().toISOString()
    const isComplete = currentValue >= task.target_value
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              current_value: currentValue,
              updated_at: now,
              ...(isComplete && t.status !== 'done'
                ? { status: 'done' as const, completed_at: now }
                : {}),
            }
          : t,
      ),
    }))
  },

  toggleMilestone: (milestoneId) => {
    const milestone = get().milestones.find((m) => m.id === milestoneId)
    if (!milestone) return
    const now = new Date().toISOString()
    const becomingComplete = !milestone.completed

    set((state) => {
      const milestones = state.milestones.map((m) =>
        m.id === milestoneId
          ? { ...m, completed: becomingComplete, completed_at: becomingComplete ? now : null }
          : m,
      )
      // Auto-complete parent task when all milestones are done
      const taskMilestones = milestones.filter((m) => m.task_id === milestone.task_id)
      const allDone = taskMilestones.length > 0 && taskMilestones.every((m) => m.completed)
      const tasks = state.tasks.map((t) =>
        t.id === milestone.task_id
          ? {
              ...t,
              updated_at: now,
              ...(allDone && t.status !== 'done'
                ? { status: 'done' as const, completed_at: now }
                : !allDone && t.status === 'done'
                ? { status: 'in_progress' as const, completed_at: null }
                : {}),
            }
          : t,
      )
      return { milestones, tasks }
    })
  },

  deleteMilestone: (milestoneId) => {
    const milestone = get().milestones.find((m) => m.id === milestoneId)
    if (!milestone) return
    const now = new Date().toISOString()
    set((state) => {
      const milestones = state.milestones.filter((m) => m.id !== milestoneId)
      const taskMilestones = milestones.filter((m) => m.task_id === milestone.task_id)
      const allDone = taskMilestones.length > 0 && taskMilestones.every((m) => m.completed)
      const tasks = state.tasks.map((t) =>
        t.id === milestone.task_id
          ? {
              ...t,
              updated_at: now,
              ...(allDone && t.status !== 'done'
                ? { status: 'done' as const, completed_at: now }
                : !allDone && t.status === 'done'
                ? { status: 'in_progress' as const, completed_at: null }
                : {}),
            }
          : t,
      )
      return { milestones, tasks }
    })
  },

  addMilestones: (newMilestones) => {
    set((state) => ({ milestones: [...state.milestones, ...newMilestones] }))
  },

  getMilestonesForTask: (taskId) =>
    get().milestones.filter((m) => m.task_id === taskId).sort((a, b) => a.sort_order - b.sort_order),

  toggleTaskDone: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: t.status === 'done' ? 'in_progress' : 'done',
              completed_at: t.status === 'done' ? null : new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : t,
      ),
    }))
  },

  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),

  updateTask: (taskId, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, ...updates, updated_at: new Date().toISOString() }
          : t,
      ),
    }))
  },

  getTasksForUser: (userId) => get().tasks.filter((t) => t.assignee_id === userId),

  getMeasurableTasks: () => get().tasks.filter(isMeasurable),

  getHistoryForTask: (taskId) =>
    get()
      .history.filter((h) => h.task_id === taskId)
      .sort((a, b) => a.recorded_date.localeCompare(b.recorded_date)),

  getTeamMeasurableTasks: (memberIds) =>
    get().tasks.filter((t) => isMeasurable(t) && memberIds.includes(t.assignee_id)),
}))
