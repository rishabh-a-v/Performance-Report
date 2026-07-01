CREATE TABLE capacity_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  planned_headcount INTEGER NOT NULL DEFAULT 0,
  plan_month DATE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (branch, department_id, role, plan_month)
);

ALTER TABLE capacity_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "capacity_plans_read" ON capacity_plans
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "capacity_plans_write_admin" ON capacity_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('managing_director', 'executive_assistant', 'hr')
    )
  );

CREATE POLICY "capacity_plans_write_director" ON capacity_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'director'
      AND branch = capacity_plans.branch
    )
  );
