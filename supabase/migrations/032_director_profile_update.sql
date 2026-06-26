-- ============================================================
-- Migration 032: Allow directors to update profiles
-- Directors can access ManageEmployees and update reporting
-- records, but the profiles UPDATE policy excluded them.
-- This migration adds director parity.
-- ============================================================

DROP POLICY IF EXISTS "profiles: admin update any" ON profiles;
CREATE POLICY "profiles: admin update any"
  ON profiles FOR UPDATE
  USING  (auth_role()::text IN ('managing_director', 'executive_assistant', 'hr', 'director'))
  WITH CHECK (auth_role()::text IN ('managing_director', 'executive_assistant', 'hr', 'director'));
