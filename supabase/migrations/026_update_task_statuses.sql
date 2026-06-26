-- ============================================================
-- Migration 026: Update Special Tasks Statuses
-- ============================================================

-- 1. Backfill any existing deprecated statuses to 'Completed'
UPDATE public.special_tasks
SET status = 'Completed'
WHERE status IN ('Acknowledged', 'Cancelled');

-- 2. Drop the old check constraint and recreate it with the new allowed statuses
ALTER TABLE public.special_tasks
  DROP CONSTRAINT IF EXISTS special_tasks_status_check;

ALTER TABLE public.special_tasks
  ADD CONSTRAINT special_tasks_status_check
  CHECK (status = ANY (ARRAY['Yet to start'::text, 'In progress'::text, 'Completed'::text, 'In review'::text]));
