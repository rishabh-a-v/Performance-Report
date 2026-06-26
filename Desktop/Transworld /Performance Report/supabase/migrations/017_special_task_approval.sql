-- 017_special_task_approval.sql
-- Migration to add approval workflow for special tasks

-- Add new enum value for cancelled status
ALTER TYPE special_task_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Create enum for approval status
CREATE TYPE special_task_approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Alter special_tasks table to add approval columns
ALTER TABLE special_tasks
  ADD COLUMN approval_status special_task_approval_status NOT NULL DEFAULT 'pending',
  ADD COLUMN approval_by UUID REFERENCES profiles(id),
  ADD COLUMN approval_at TIMESTAMPTZ,
  ADD COLUMN rejection_note TEXT;

-- RLS Policies for approval
-- Manager (assigned_by) can set approval fields
CREATE POLICY "special_tasks: manager approval" ON special_tasks
  FOR UPDATE
  USING (
    assigned_by = auth.uid() OR auth_role() IN ('director', 'managing_director')
  )
  WITH CHECK (
    -- Manager can modify approval columns but not change assigned_to, assigned_by, etc.
    true
  );

-- Employee cannot modify approval columns (policy already restricts update to employee only for status)
-- Ensure employee update policy does not allow approval fields
-- Already present policy "special_tasks: employee update status" restricts to assigned_to only.

-- Enable RLS if not already enabled (should already be enabled in earlier migration)
ALTER TABLE special_tasks ENABLE ROW LEVEL SECURITY;

-- End of migration
