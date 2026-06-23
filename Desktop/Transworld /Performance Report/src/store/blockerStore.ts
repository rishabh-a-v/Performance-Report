import { create } from 'zustand'
import { BLOCKERS } from '@/lib/mockData'
import type { Blocker } from '@/types/database'

interface BlockerStore {
  blockers: Blocker[]
  addBlocker: (b: Omit<Blocker, 'id' | 'created_at'>) => string
  resolveBlocker: (id: string, resolvedBy: string, notes: string) => void
}

export const useBlockerStore = create<BlockerStore>((set) => ({
  blockers: [...BLOCKERS],

  addBlocker: (b) => {
    const id = `blk_${Date.now()}`
    set((state) => ({
      blockers: [{ ...b, id, created_at: new Date().toISOString() }, ...state.blockers],
    }))
    return id
  },

  resolveBlocker: (id, resolvedBy, notes) =>
    set((state) => ({
      blockers: state.blockers.map((b) =>
        b.id === id
          ? {
              ...b,
              resolved_at: new Date().toISOString(),
              resolved_by: resolvedBy,
              resolution_notes: notes || null,
            }
          : b,
      ),
    })),
}))
