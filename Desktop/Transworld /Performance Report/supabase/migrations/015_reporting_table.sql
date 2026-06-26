-- 1. Create reporting table
CREATE TABLE IF NOT EXISTS reporting (
  employee_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  department text NOT NULL,
  role text NOT NULL CHECK (role IN ('MD', 'Director', 'EA', 'Manager', 'Executive')),
  branch text NOT NULL,
  reporting_to_id uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- 2. Enable RLS
ALTER TABLE reporting ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Anyone authenticated can read reporting relationships
CREATE POLICY "Anyone can view reporting relationships" ON reporting
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only Director and EA roles can modify reporting relationships
CREATE POLICY "Only Director and EA can insert reporting relationships" ON reporting
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'director' OR profiles.role = 'executive_assistant')
    )
  );

CREATE POLICY "Only Director and EA can update reporting relationships" ON reporting
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'director' OR profiles.role = 'executive_assistant')
    )
  );

CREATE POLICY "Only Director and EA can delete reporting relationships" ON reporting
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'director' OR profiles.role = 'executive_assistant')
    )
  );
