import { create } from 'zustand'
import type { DailyCheckin } from '@/types/database'

interface CheckinStore {
  checkins: DailyCheckin[]
  // task links: checkin_id → task_ids[]
  taskLinks: Record<string, string[]>
  addCheckin: (checkin: Omit<DailyCheckin, 'id' | 'created_at' | 'updated_at'>, taskIds: string[]) => void
  getCheckinForUser: (userId: string, date: string) => DailyCheckin | undefined
  getTaskIdsForCheckin: (checkinId: string) => string[]
}

export const useCheckinStore = create<CheckinStore>((set, get) => ({
  checkins: [],
  taskLinks: {},

  addCheckin: (checkin, taskIds) => {
    const id = `ci_live_${Date.now()}`
    const now = new Date().toISOString()
    const full: DailyCheckin = { ...checkin, id, created_at: now, updated_at: now }
    set((state) => ({
      checkins: [full, ...state.checkins],
      taskLinks: { ...state.taskLinks, [id]: taskIds },
    }))
  },

  getCheckinForUser: (userId, date) =>
    get().checkins.find((c) => c.user_id === userId && c.checkin_date === date),

  getTaskIdsForCheckin: (checkinId) =>
    get().taskLinks[checkinId] ?? [],
}))
