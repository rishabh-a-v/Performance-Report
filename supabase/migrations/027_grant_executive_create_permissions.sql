-- ============================================================
-- Migration 027: Grant Executive Create Permissions
-- ============================================================

-- Update role_permissions to allow executives to create job directions and tasks
UPDATE public.role_permissions
SET can_create_job_directions = true,
    can_create_tasks = true
WHERE role = 'executive';
