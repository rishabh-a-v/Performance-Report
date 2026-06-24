import { create } from 'zustand'

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected'

export interface DateChangeRequest {
  id: string
  task_id: string
  task_title: string
  requested_by_id: string
  requested_by_name: string
  current_date: string | null
  requested_date: string
  reason: string
  status: ChangeRequestStatus
  reviewed_by_id: string | null
  reviewed_by_name: string | null
  reviewed_at: string | null
  rejection_note: string | null
  created_at: string
}

interface ChangeRequestStore {
  requests: DateChangeRequest[]
  addRequest: (r: Omit<DateChangeRequest, 'id' | 'status' | 'reviewed_by_id' | 'reviewed_by_name' | 'reviewed_at' | 'rejection_note' | 'created_at'>) => void
  approveRequest: (id: string, reviewerId: string, reviewerName: string) => void
  rejectRequest: (id: string, reviewerId: string, reviewerName: string, note: string) => void
}

export const useChangeRequestStore = create<ChangeRequestStore>((set) => ({
  requests: [],

  addRequest: (r) =>
    set((state) => ({
      requests: [
        {
          ...r,
          id: `cr_${Date.now()}`,
          status: 'pending',
          reviewed_by_id: null,
          reviewed_by_name: null,
          reviewed_at: null,
          rejection_note: null,
          created_at: new Date().toISOString(),
        },
        ...state.requests,
      ],
    })),

  approveRequest: (id, reviewerId, reviewerName) =>
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id
          ? { ...r, status: 'approved', reviewed_by_id: reviewerId, reviewed_by_name: reviewerName, reviewed_at: new Date().toISOString() }
          : r,
      ),
    })),

  rejectRequest: (id, reviewerId, reviewerName, note) =>
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id
          ? { ...r, status: 'rejected', reviewed_by_id: reviewerId, reviewed_by_name: reviewerName, reviewed_at: new Date().toISOString(), rejection_note: note || null }
          : r,
      ),
    })),
}))
