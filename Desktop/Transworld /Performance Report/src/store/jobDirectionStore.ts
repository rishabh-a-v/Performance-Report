import { create } from 'zustand'
import { JOB_DIRECTIONS, JD_MILESTONES } from '@/lib/mockData'
import type { JobDirection, JDMilestone } from '@/types/database'

function distributeWeights(n: number): number[] {
  if (n === 0) return []
  const base = Math.floor(100 / n)
  const remainder = 100 - base * n
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0))
}

interface JobDirectionStore {
  directions: JobDirection[]
  milestones: JDMilestone[]
  addDirection: (jd: Omit<JobDirection, 'id' | 'created_at' | 'updated_at'>) => void
  addDirectionWithMilestones: (
    jd: Omit<JobDirection, 'id' | 'created_at' | 'updated_at'>,
    milestoneTitles: string[]
  ) => void
  updateProgress: (id: string, currentValue: number) => void
  submitForReview: (id: string) => void
  approveDirection: (id: string, managerId: string, notes: string) => void
  rejectDirection: (id: string, notes: string) => void
  requestChanges: (id: string, notes: string) => void
  toggleMilestone: (milestoneId: string) => void
  updateDirection: (id: string, updates: Partial<JobDirection>) => void
  updateDirectionDate: (id: string, date: string) => void
  getDirectionsForEmployee: (employeeId: string) => JobDirection[]
  getPendingForManager: (managerId: string) => JobDirection[]
  getMilestonesForDirection: (jdId: string) => JDMilestone[]
}

export const useJobDirectionStore = create<JobDirectionStore>((set, get) => ({
  directions: [...JOB_DIRECTIONS],
  milestones: [...JD_MILESTONES],

  addDirection: (jd) => {
    const now = new Date().toISOString()
    set((s) => ({
      directions: [
        { ...jd, id: `jd_live_${Date.now()}`, created_at: now, updated_at: now },
        ...s.directions,
      ],
    }))
  },

  addDirectionWithMilestones: (jd, milestoneTitles) => {
    const now = new Date().toISOString()
    const jdId = `jd_live_${Date.now()}`
    const newDirection: JobDirection = { ...jd, id: jdId, created_at: now, updated_at: now }
    const weights = distributeWeights(milestoneTitles.length)
    const newMilestones: JDMilestone[] = milestoneTitles.map((title, i) => ({
      id: `ms_live_${Date.now()}_${i}`,
      job_direction_id: jdId,
      title,
      weight: weights[i],
      completed: false,
      completed_at: null,
      sort_order: i,
      created_at: now,
    }))
    set((s) => ({
      directions: [newDirection, ...s.directions],
      milestones: [...s.milestones, ...newMilestones],
    }))
  },

  updateProgress: (id, currentValue) => {
    const jd = get().directions.find((d) => d.id === id)
    if (!jd || jd.target_value == null) return
    const pct = Math.min(100, parseFloat(((currentValue / jd.target_value) * 100).toFixed(1)))
    set((s) => ({
      directions: s.directions.map((d) =>
        d.id === id ? { ...d, current_value: currentValue, progress_percentage: pct, updated_at: new Date().toISOString() } : d
      ),
    }))
  },

  submitForReview: (id) => {
    const now = new Date().toISOString()
    set((s) => ({
      directions: s.directions.map((d) =>
        d.id === id ? { ...d, status: 'submitted', submitted_for_review_at: now, updated_at: now } : d
      ),
    }))
  },

  approveDirection: (id, _managerId, notes) => {
    const now = new Date().toISOString()
    set((s) => ({
      directions: s.directions.map((d) => {
        if (d.id !== id) return d
        const appliedFields = d.pendingEdits ? {
          title: d.pendingEdits.title,
          description: d.pendingEdits.description,
          target_value: d.pendingEdits.target_value,
        } : {}
        let newPct = d.progress_percentage
        const newTarget = d.pendingEdits ? d.pendingEdits.target_value : d.target_value
        if (newTarget !== null && d.current_value !== null) {
          newPct = Math.min(100, parseFloat(((d.current_value / newTarget) * 100).toFixed(1)))
        }
        return {
          ...d,
          ...appliedFields,
          progress_percentage: newPct,
          status: 'approved',
          pendingEdits: null,
          review_notes: notes || null,
          approved_at: now,
          updated_at: now
        }
      }),
    }))
  },

  rejectDirection: (id, notes) => {
    const now = new Date().toISOString()
    set((s) => ({
      directions: s.directions.map((d) =>
        d.id === id ? { ...d, status: 'rejected', review_notes: notes || null, rejected_at: now, updated_at: now } : d
      ),
    }))
  },

  requestChanges: (id, notes) => {
    const now = new Date().toISOString()
    set((s) => ({
      directions: s.directions.map((d) =>
        d.id === id ? { ...d, status: 'active', review_notes: notes || null, updated_at: now } : d
      ),
    }))
  },

  toggleMilestone: (milestoneId) => {
    const ms = get().milestones.find((m) => m.id === milestoneId)
    if (!ms) return
    const now = new Date().toISOString()
    const becomingComplete = !ms.completed
    set((s) => {
      const milestones = s.milestones.map((m) =>
        m.id === milestoneId
          ? { ...m, completed: becomingComplete, completed_at: becomingComplete ? now : null }
          : m
      )
      const jdMilestones = milestones.filter((m) => m.job_direction_id === ms.job_direction_id)
      const pct = jdMilestones.reduce((sum, m) => (m.completed ? sum + m.weight : sum), 0)
      const directions = s.directions.map((d) =>
        d.id === ms.job_direction_id ? { ...d, progress_percentage: pct, updated_at: now } : d
      )
      return { milestones, directions }
    })
  },

  updateDirection: (id, updates) => {
    const now = new Date().toISOString()
    set((s) => {
      const currentJd = s.directions.find((d) => d.id === id)
      if (!currentJd) return {}
      
      if (currentJd.status === 'draft') {
        let newPct = currentJd.progress_percentage
        const newTarget = updates.target_value !== undefined ? updates.target_value : currentJd.target_value
        if (newTarget !== null && currentJd.current_value !== null) {
          newPct = Math.min(100, parseFloat(((currentJd.current_value / newTarget) * 100).toFixed(1)))
        }
        return {
          directions: s.directions.map((d) =>
            d.id === id 
              ? { 
                  ...d, 
                  ...updates, 
                  progress_percentage: newPct,
                  updated_at: now 
                } 
              : d
          ),
        }
      }

      const pendingEdits = {
        title: updates.title !== undefined ? updates.title : currentJd.title,
        description: updates.description !== undefined ? updates.description : currentJd.description,
        target_value: updates.target_value !== undefined ? updates.target_value : currentJd.target_value,
      }
      
      return {
        directions: s.directions.map((d) =>
          d.id === id 
            ? { 
                ...d, 
                pendingEdits,
                status: 'submitted', 
                submitted_for_review_at: now, 
                updated_at: now 
              } 
            : d
        ),
      }
    })
  },

  updateDirectionDate: (id, date) => {
    const now = new Date().toISOString()
    set((s) => ({
      directions: s.directions.map((d) =>
        d.id === id ? { ...d, due_date: date, updated_at: now } : d
      ),
    }))
  },

  getDirectionsForEmployee: (employeeId) =>
    get().directions.filter((d) => d.employee_id === employeeId),

  getPendingForManager: (managerId) =>
    get().directions.filter((d) => d.manager_id === managerId && d.status === 'submitted'),

  getMilestonesForDirection: (jdId) =>
    get().milestones.filter((m) => m.job_direction_id === jdId).sort((a, b) => a.sort_order - b.sort_order),
}))
