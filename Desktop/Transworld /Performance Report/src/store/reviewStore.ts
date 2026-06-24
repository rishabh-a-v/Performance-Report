import { create } from 'zustand'
import type { PerformanceReview } from '@/types/database'

interface ReviewStore {
  reviews: PerformanceReview[]
  addReview: (review: Omit<PerformanceReview, 'id' | 'created_at'>) => void
  updateReview: (id: string, updates: Partial<PerformanceReview>) => void
  submitReview: (id: string) => void
  approveReview: (id: string, comments?: string) => void
  rejectReview: (id: string, note: string) => void
}

const INITIAL_REVIEWS: PerformanceReview[] = [
  // Executive Amit Gupta (u9) - Draft self review
  {
    id: 'rev_1',
    employee_id: 'u9',
    employee_name: 'Amit Gupta',
    employee_role: 'Finance Executive',
    review_period: 'Q2 2026',
    review_type: 'self',
    objectives_assigned: 'Complete 3 client ledgers and reconcile accounts.',
    objectives_completed: 'Completed 2 client ledgers, 1 pending validation.',
    progress_percentage: 75,
    achievements: 'Directly helped in reconciling the Zenith Ltd account under budget.',
    challenges: 'Delays in getting billing data from client side.',
    support_required: 'Earlier vendor invoice approvals from the operations team.',
    next_period_goals: 'Own the monthly reconciliation track for Q3.',
    status: 'draft',
    submitted_at: null,
    created_at: '2026-06-20T09:00:00Z',
  },
  // Executive Pooja Reddy (u10) - Submitted self review
  {
    id: 'rev_2',
    employee_id: 'u10',
    employee_name: 'Pooja Reddy',
    employee_role: 'Finance Executive',
    review_period: 'Q2 2026',
    review_type: 'self',
    objectives_assigned: 'Migrate auth service to Supabase and implement REST APIs.',
    objectives_completed: 'Auth migration completed, APIs 80% implemented.',
    progress_percentage: 90,
    achievements: 'Auth flow is now fully migrated to Supabase Auth. Run tests at 95% coverage.',
    challenges: 'Setting up Row-Level Security (RLS) policies took longer than expected.',
    support_required: 'More pair programming time with Priya on RLS setup.',
    next_period_goals: 'Optimize database indexes and complete documentation.',
    status: 'submitted',
    submitted_at: '2026-06-22T10:00:00Z',
    created_at: '2026-06-20T09:00:00Z',
  },
  // Manager Ravi Kumar (u5) - Submitted self review
  {
    id: 'rev_3',
    employee_id: 'u5',
    employee_name: 'Ravi Kumar',
    employee_role: 'Finance Manager',
    review_period: 'Q2 2026',
    review_type: 'self',
    objectives_assigned: 'Reconcile Q2 ledgers, supervise finance executives, and streamline audits.',
    objectives_completed: 'All ledger reconciliation done. Audits in-progress on track.',
    progress_percentage: 85,
    achievements: 'Managed statutory Q2 ledger close. Reconciled ACME and Horizon contracts.',
    challenges: 'Limited bandwidth in the executive team causing documentation delays.',
    support_required: 'Requesting budget for 1 additional junior resource in Q3.',
    next_period_goals: 'Transition annual audits to automated pipeline tools.',
    status: 'submitted',
    submitted_at: '2026-06-23T11:00:00Z',
    created_at: '2026-06-21T09:00:00Z',
  },
  // Manager Ravi Kumar (u5) - Subordinate review of Pooja Reddy
  {
    id: 'rev_4',
    employee_id: 'u5',
    employee_name: 'Ravi Kumar',
    employee_role: 'Finance Manager',
    review_period: 'Q2 2026',
    review_type: 'subordinate',
    reviewed_employee_id: 'u10',
    reviewed_employee_name: 'Pooja Reddy',
    rating: 4,
    achievements: 'Pooja successfully owned the Supabase auth migration and showed excellent tech depth.',
    areas_for_improvement: 'Should pay more attention to detailing API docs and communicating blockages early.',
    manager_comments: 'Pooja is a strong performer, she handled the Supabase migration with minimal guidance.',
    recommended_action: 'Advance training in advanced SQL/RLS; on track for senior executive next year.',
    status: 'submitted',
    submitted_at: '2026-06-23T11:30:00Z',
    created_at: '2026-06-22T09:00:00Z',
  },
  // Director Anil Kumar (u2) - Submitted self review
  {
    id: 'rev_5',
    employee_id: 'u2',
    employee_name: 'Anil Kumar',
    employee_role: 'Director',
    review_period: 'Q2 2026',
    review_type: 'self',
    objectives_assigned: 'Oversee corporate finance audit compliance, department budgets, and client DSO reduction.',
    objectives_completed: 'Corporate budget approved. DSO reduced from 42 to 38 days.',
    progress_percentage: 95,
    achievements: 'Successfully reduced company average DSO by 4 days, releasing cash flow.',
    challenges: 'High macroeconomic volatility affecting credit collections in Sales.',
    support_required: 'Closer coordination with Sales department on new contract review SLAs.',
    next_period_goals: 'Target DSO reduction below 35 days in Q3.',
    status: 'submitted',
    submitted_at: '2026-06-24T08:00:00Z',
    created_at: '2026-06-22T09:00:00Z',
  },
  // Director Anil Kumar (u2) - Subordinate review of Manager Ravi Kumar
  {
    id: 'rev_6',
    employee_id: 'u2',
    employee_name: 'Anil Kumar',
    employee_role: 'Director',
    review_period: 'Q2 2026',
    review_type: 'subordinate',
    reviewed_employee_id: 'u5',
    reviewed_employee_name: 'Ravi Kumar',
    rating: 5,
    achievements: 'Ravi closed Q2 finance reconciliations flawlessly and reduced audit overheads.',
    areas_for_improvement: 'Should step up delegation of core ledger reviews to finance executives.',
    manager_comments: 'Ravi is highly reliable and is doing a great job leading the finance operations team.',
    recommended_action: 'Enroll in Leadership development track for potential Head of Finance transition.',
    status: 'submitted',
    submitted_at: '2026-06-24T08:15:00Z',
    created_at: '2026-06-23T09:00:00Z',
  },
]

export const useReviewStore = create<ReviewStore>((set) => ({
  reviews: [...INITIAL_REVIEWS],

  addReview: (review) => {
    const id = `rev_${Date.now()}`
    set((s) => ({
      reviews: [
        {
          ...review,
          id,
          created_at: new Date().toISOString(),
        },
        ...s.reviews,
      ],
    }))
  },

  updateReview: (id, updates) => {
    set((s) => ({
      reviews: s.reviews.map((r) =>
        r.id === id
          ? { ...r, ...updates }
          : r
      ),
    }))
  },

  submitReview: (id) => {
    set((s) => ({
      reviews: s.reviews.map((r) =>
        r.id === id
          ? { ...r, status: 'submitted', submitted_at: new Date().toISOString() }
          : r
      ),
    }))
  },

  approveReview: (id, comments) => {
    set((s) => ({
      reviews: s.reviews.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'approved',
              manager_comments: comments ? comments : r.manager_comments,
            }
          : r
      ),
    }))
  },

  rejectReview: (id, note) => {
    set((s) => ({
      reviews: s.reviews.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'rejected',
              rejection_note: note,
            }
          : r
      ),
    }))
  },
}))
