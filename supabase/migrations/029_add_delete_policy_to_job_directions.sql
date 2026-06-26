-- Migration 029: Add DELETE policy to job_directions table
DROP POLICY IF EXISTS "job_directions: delete scope" ON job_directions;

CREATE POLICY "job_directions: delete scope"
  ON job_directions FOR DELETE
  USING (
    manager_id = auth.uid()
    OR (employee_id = auth.uid() AND status = 'draft')
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'managing_director', 'executive_assistant', 'hr')
    )
  );
