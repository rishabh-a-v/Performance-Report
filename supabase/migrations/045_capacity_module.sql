-- Migration: Add capacity fields to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_working_hours DECIMAL(4,2) DEFAULT 8.0,
ADD COLUMN IF NOT EXISTS efficiency_score DECIMAL(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS max_overtime_hours INT DEFAULT 10;

-- New Tables for Capacity Module
CREATE TABLE IF NOT EXISTS public.employee_skills (
    id SERIAL PRIMARY KEY,
    employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level INT DEFAULT 1,
    UNIQUE(employee_id, skill_name)
);

CREATE TABLE IF NOT EXISTS public.task_skills_required (
    id SERIAL PRIMARY KEY,
    task_id TEXT REFERENCES public.special_tasks(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.capacity_snapshots (
    id SERIAL PRIMARY KEY,
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) CHECK (entity_type IN ('EMPLOYEE', 'TEAM')),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    available_hours DECIMAL(6,2),
    allocated_hours DECIMAL(6,2),
    utilization_percent DECIMAL(5,2)
);

CREATE TABLE IF NOT EXISTS public.capacity_forecasts (
    id SERIAL PRIMARY KEY,
    department VARCHAR(100) NOT NULL,
    forecast_date DATE NOT NULL,
    predicted_demand_hours DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_capacity_snapshots_entity ON public.capacity_snapshots(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_forecasts_dept_date ON public.capacity_forecasts(department, forecast_date);

-- Enable RLS on new tables
ALTER TABLE public.employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_skills_required ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_forecasts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for employee_skills
CREATE POLICY "employee_skills_select" ON public.employee_skills
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "employee_skills_all_self_admin" ON public.employee_skills
    FOR ALL USING (
        employee_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('managing_director', 'executive_assistant', 'hr', 'director')
        )
    );

-- Add RLS policies for task_skills_required
CREATE POLICY "task_skills_select" ON public.task_skills_required
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "task_skills_all" ON public.task_skills_required
    FOR ALL USING (auth.role() = 'authenticated');

-- Add RLS policies for capacity_snapshots
CREATE POLICY "capacity_snapshots_select" ON public.capacity_snapshots
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "capacity_snapshots_all" ON public.capacity_snapshots
    FOR ALL USING (auth.role() = 'authenticated');

-- Add RLS policies for capacity_forecasts
CREATE POLICY "capacity_forecasts_select" ON public.capacity_forecasts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "capacity_forecasts_all" ON public.capacity_forecasts
    FOR ALL USING (auth.role() = 'authenticated');
