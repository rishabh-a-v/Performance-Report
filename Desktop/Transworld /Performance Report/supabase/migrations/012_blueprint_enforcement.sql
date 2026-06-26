-- 1. Drop view dependent on job_directions
DROP VIEW IF EXISTS job_directions_with_progress;

-- Drop triggers that reference dropped updated_at columns
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS trg_job_directions_updated_at ON job_directions;
DROP TRIGGER IF EXISTS trg_special_tasks_updated_at ON special_tasks;

-- 2. Drop all legacy tables not in the blueprint
DROP TABLE IF EXISTS task_progress_history CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS checkin_task_links CASCADE;
DROP TABLE IF EXISTS daily_checkins CASCADE;
DROP TABLE IF EXISTS blockers CASCADE;
DROP TABLE IF EXISTS date_change_requests CASCADE;
DROP TABLE IF EXISTS job_direction_progress_logs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- Drop dependent RLS policies first
DROP POLICY IF EXISTS "profiles: all active read all active" ON profiles;
DROP POLICY IF EXISTS "job_directions: verifier select" ON job_directions;
DROP POLICY IF EXISTS "job_directions: verifier update" ON job_directions;
DROP POLICY IF EXISTS "verifier can update pending jd" ON job_directions;
DROP POLICY IF EXISTS "special_tasks: verifier select" ON special_tasks;
DROP POLICY IF EXISTS "special_tasks: verifier update" ON special_tasks;
DROP POLICY IF EXISTS "verifier can update pending task" ON special_tasks;
DROP POLICY IF EXISTS "special_tasks: select scope" ON special_tasks;

-- 3. Audit profiles columns
ALTER TABLE profiles DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE profiles DROP COLUMN IF EXISTS designation;
ALTER TABLE profiles DROP COLUMN IF EXISTS is_active;
ALTER TABLE profiles DROP COLUMN IF EXISTS created_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS updated_at;

-- Recreate profile select policy without is_active condition
CREATE POLICY "profiles: all active read all active"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create sequence for auto-generating Employee ID
CREATE SEQUENCE IF NOT EXISTS employee_id_seq START WITH 100;
ALTER TABLE profiles ALTER COLUMN employee_code SET DEFAULT ('EMP-' || lpad(nextval('employee_id_seq')::text, 4, '0'));

-- 4. Audit job_directions columns
ALTER TABLE job_directions DROP COLUMN IF EXISTS title;
ALTER TABLE job_directions DROP COLUMN IF EXISTS daily_target;
ALTER TABLE job_directions DROP COLUMN IF EXISTS weekly_target;
ALTER TABLE job_directions DROP COLUMN IF EXISTS monthly_target;
ALTER TABLE job_directions DROP COLUMN IF EXISTS progress_percentage;
ALTER TABLE job_directions DROP COLUMN IF EXISTS review_notes;
ALTER TABLE job_directions DROP COLUMN IF EXISTS submitted_for_review_at;
ALTER TABLE job_directions DROP COLUMN IF EXISTS approved_at;
ALTER TABLE job_directions DROP COLUMN IF EXISTS rejected_at;
ALTER TABLE job_directions DROP COLUMN IF EXISTS pending_edits;
ALTER TABLE job_directions DROP COLUMN IF EXISTS requires_supervisor_verification;
ALTER TABLE job_directions DROP COLUMN IF EXISTS verifier_id;
ALTER TABLE job_directions DROP COLUMN IF EXISTS verified_at;
ALTER TABLE job_directions DROP COLUMN IF EXISTS verification_notes;
ALTER TABLE job_directions DROP COLUMN IF EXISTS created_at;
ALTER TABLE job_directions DROP COLUMN IF EXISTS updated_at;

-- Add blueprint-conforming fields to job_directions
ALTER TABLE job_directions ADD COLUMN IF NOT EXISTS frequency text;
ALTER TABLE job_directions ADD CONSTRAINT chk_jd_frequency CHECK (frequency IN ('Daily', 'Weekly', 'Monthly'));
ALTER TABLE job_directions ADD COLUMN IF NOT EXISTS target_amount numeric DEFAULT 0;
ALTER TABLE job_directions ADD COLUMN IF NOT EXISTS completed numeric DEFAULT 0;

-- 5. Audit special_tasks columns
ALTER TABLE special_tasks DROP COLUMN IF EXISTS updated_at;
ALTER TABLE special_tasks DROP COLUMN IF EXISTS requires_supervisor_verification;
ALTER TABLE special_tasks DROP COLUMN IF EXISTS verifier_id;
ALTER TABLE special_tasks DROP COLUMN IF EXISTS verified_at;
ALTER TABLE special_tasks DROP COLUMN IF EXISTS verification_notes;

-- Recreate special_tasks select policy without verifier_id
CREATE POLICY "special_tasks: select scope"
  ON special_tasks FOR SELECT
  USING (
    assigned_by = auth.uid() OR
    is_task_assignee(id, auth.uid()) OR
    auth_role() IN ('director', 'managing_director')
  );

-- Update column type to text first (removes enum dependency)
ALTER TABLE special_tasks ALTER COLUMN status DROP DEFAULT;
ALTER TABLE special_tasks ALTER COLUMN status TYPE text USING status::text;

-- Update existing statuses that don't match the new enums
UPDATE special_tasks SET status = 'Yet to start' WHERE status NOT IN ('Yet to start', 'In progress', 'Completed', 'Cancelled', 'Acknowledged');

-- Update column default and check constraint
ALTER TABLE special_tasks ALTER COLUMN status SET DEFAULT 'Yet to start';
ALTER TABLE special_tasks DROP CONSTRAINT IF EXISTS special_tasks_status_check;
ALTER TABLE special_tasks ADD CONSTRAINT special_tasks_status_check 
  CHECK (status IN ('Yet to start', 'In progress', 'Completed', 'Cancelled', 'Acknowledged'));

