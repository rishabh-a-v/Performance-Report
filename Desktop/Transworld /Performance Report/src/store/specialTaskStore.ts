import { create } from 'zustand'
import { SPECIAL_TASKS } from '@/lib/mockData'
import type { SpecialTask, SpecialTaskStatus } from '@/types/database'

interface SpecialTaskStore {
  tasks: SpecialTask[]
  addTask: (task: Omit<SpecialTask, 'id' | 'created_at' | 'updated_at'>) => void
  updateTask: (id: string, updates: Partial<SpecialTask>) => void
  setStatus: (id: string, status: SpecialTaskStatus) => void
  getTasksForEmployee: (employeeId: string) => SpecialTask[]
  getTasksAssignedBy: (managerId: string) => SpecialTask[]
}

export const useSpecialTaskStore = create<SpecialTaskStore>((set, get) => ({
  tasks: [...SPECIAL_TASKS],

  addTask: (task) => {
    const now = new Date().toISOString()
    set((s) => ({
      tasks: [{ ...task, id: `st_live_${Date.now()}`, created_at: now, updated_at: now }, ...s.tasks],
    }))
  },

  updateTask: (id, updates) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      ),
    }))
  },

  setStatus: (id, status) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, status, updated_at: new Date().toISOString() } : t
      ),
    }))
  },

  getTasksForEmployee: (employeeId) =>
    get().tasks.filter((t) => t.assigned_to === employeeId),

  getTasksAssignedBy: (managerId) =>
    get().tasks.filter((t) => t.assigned_by === managerId),
}))
