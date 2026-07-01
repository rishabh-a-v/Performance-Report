import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfileStore } from '@/store/profileStore';
import { useJobDirectionStore } from '@/store/jobDirectionStore';
import { useSpecialTaskStore } from '@/store/specialTaskStore';
import { CapacityEngine } from '../services/CapacityEngine';
import { ForecastingService } from '../services/ForecastingService';

export interface EnrichedEmployee {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department_id: string | null;
  daily_working_hours: number;
  efficiency_score: number;
  max_overtime_hours: number;
  skills: string[];
  skillsDetailed: Array<{ skill_name: string; proficiency_level: number }>;
  availableCapacityHours: number;
  allocatedHours: number;
  utilizationPercent: number;
  overloadStatus: 'underutilized' | 'healthy' | 'near_capacity' | 'overloaded';
  shortageHours: number;
}

export function useCapacityData(branch: string, departmentId: string | null) {
  const [loading, setLoading] = useState(false);
  const [skillsList, setSkillsList] = useState<Record<string, Array<{ skill_name: string; proficiency_level: number }>>>({});
  
  const profiles = useProfileStore((s) => s.profiles);
  const departments = useProfileStore((s) => s.departments);
  const directions = useJobDirectionStore((s) => s.directions);
  const tasks = useSpecialTaskStore((s) => s.tasks);
  
  const capacityEngine = useMemo(() => new CapacityEngine(), []);
  const forecastingService = useMemo(() => new ForecastingService(), []);

  // Fetch all employee skills
  const fetchSkills = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('employee_skills').select('*');
    if (error) {
      console.error('Error fetching employee skills:', error);
      setLoading(false);
      return;
    }
    
    const map: Record<string, Array<{ skill_name: string; proficiency_level: number }>> = {};
    (data || []).forEach((row: any) => {
      if (!map[row.employee_id]) {
        map[row.employee_id] = [];
      }
      map[row.employee_id].push({
        skill_name: row.skill_name,
        proficiency_level: row.proficiency_level
      });
    });
    setSkillsList(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  // Derive capacity metrics for employees in the selected branch
  const capacityData = useMemo<EnrichedEmployee[]>(() => {
    const branchProfiles = profiles.filter((p) => p.branch === branch && (!departmentId || p.department_id === departmentId));
    
    return branchProfiles.map((emp) => {
      const skills = skillsList[emp.id] || [];
      
      // Calculate allocated hours:
      let allocated = 0;

      // 1. Job Directions: active or approved JDs count as 2.0 hours
      const empJDs = directions.filter(
        (d) => d.employee_id === emp.id && ['active', 'approved'].includes(d.status)
      );
      allocated += empJDs.length * 2.0;

      // 2. Special Tasks: active tasks (not Completed) assigned to employee
      const empTasks = tasks.filter(
        (t) => t.assignees?.some((a) => a.employee_id === emp.id) && t.status !== 'Completed'
      );
      
      empTasks.forEach((task) => {
        let taskHours = 1.5; // medium default
        if (task.priority === 'urgent') taskHours = 4.0;
        else if (task.priority === 'high') taskHours = 2.5;
        else if (task.priority === 'low') taskHours = 0.5;
        allocated += taskHours;
      });

      // Calculate capacity using formula:
      // AvailableCapacity = (WorkHours - Breaks(1.0) - Meetings(1.0) - LeaveHours(0.0)) * EfficiencyScore
      const capacity = capacityEngine.calculateEmployeeCapacity(emp, 1.0, 1.0, 0.0);
      const metrics = capacityEngine.calculateUtilization(capacity, allocated);

      return {
        id: emp.id,
        full_name: emp.full_name,
        email: emp.email,
        role: emp.role,
        department_id: emp.department_id,
        daily_working_hours: emp.daily_working_hours !== undefined && emp.daily_working_hours !== null ? Number(emp.daily_working_hours) : 8.0,
        efficiency_score: emp.efficiency_score !== undefined && emp.efficiency_score !== null ? Number(emp.efficiency_score) : 1.0,
        max_overtime_hours: emp.max_overtime_hours !== undefined && emp.max_overtime_hours !== null ? Number(emp.max_overtime_hours) : 10,
        skills: skills.map((s) => s.skill_name),
        skillsDetailed: skills,
        availableCapacityHours: metrics.availableCapacityHours,
        allocatedHours: metrics.allocatedHours,
        utilizationPercent: metrics.utilizationPercent,
        overloadStatus: metrics.overloadStatus,
        shortageHours: metrics.shortageHours
      };
    });
  }, [profiles, branch, departmentId, directions, tasks, skillsList, capacityEngine]);

  // Aggregate statistics for the dashboard
  const summaryStats = useMemo(() => {
    const totalCapacity = capacityData.reduce((sum, emp) => sum + emp.availableCapacityHours, 0);
    const totalAllocated = capacityData.reduce((sum, emp) => sum + emp.allocatedHours, 0);
    
    // Average utilization across active employees (who have capacity > 0)
    const activeStaff = capacityData.filter(emp => emp.availableCapacityHours > 0);
    const avgUtilization = activeStaff.length > 0
      ? activeStaff.reduce((sum, emp) => sum + emp.utilizationPercent, 0) / activeStaff.length
      : 0;

    const shortageHours = capacityData.reduce((sum, emp) => sum + emp.shortageHours, 0);
    const overloadedCount = capacityData.filter((emp) => emp.overloadStatus === 'overloaded').length;
    const underutilizedCount = capacityData.filter((emp) => emp.overloadStatus === 'underutilized').length;

    return {
      totalCapacity: Number(totalCapacity.toFixed(1)),
      totalAllocated: Number(totalAllocated.toFixed(1)),
      utilization: Number(avgUtilization.toFixed(1)),
      shortageHours: Number(shortageHours.toFixed(1)),
      overloadedCount,
      underutilizedCount
    };
  }, [capacityData]);

  // Generate 7-day forecast
  const forecastData = useMemo(() => {
    return forecastingService.generateForecast(departmentId, branch, profiles, tasks, directions, 7);
  }, [forecastingService, departmentId, branch, profiles, tasks, directions]);

  // Update working hours, efficiency score, and max overtime hours
  const updateCapacitySettings = async (
    employeeId: string, 
    settings: { daily_working_hours: number; efficiency_score: number; max_overtime_hours: number }
  ) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        daily_working_hours: settings.daily_working_hours,
        efficiency_score: settings.efficiency_score,
        max_overtime_hours: settings.max_overtime_hours
      })
      .eq('id', employeeId);

    if (error) {
      console.error('Error updating capacity settings:', error);
      throw error;
    }
    
    // Trigger profiles fetch in store
    await useProfileStore.getState().fetchProfiles();
  };

  // Add skill to employee
  const addSkill = async (employeeId: string, skillName: string, proficiency: number) => {
    const { error } = await supabase
      .from('employee_skills')
      .upsert({
        employee_id: employeeId,
        skill_name: skillName.trim(),
        proficiency_level: proficiency
      }, {
        onConflict: 'employee_id,skill_name'
      });

    if (error) {
      console.error('Error adding skill:', error);
      throw error;
    }

    await fetchSkills();
  };

  // Remove skill from employee
  const removeSkill = async (employeeId: string, skillName: string) => {
    const { error } = await supabase
      .from('employee_skills')
      .delete()
      .eq('employee_id', employeeId)
      .eq('skill_name', skillName);

    if (error) {
      console.error('Error removing skill:', error);
      throw error;
    }

    await fetchSkills();
  };

  // Save capacity snapshot to DB
  const recalculateSnapshots = async () => {
    const snapshots = capacityData.map((emp) => ({
      entity_id: emp.id,
      entity_type: 'EMPLOYEE',
      available_hours: emp.availableCapacityHours,
      allocated_hours: emp.allocatedHours,
      utilization_percent: emp.utilizationPercent,
      calculated_at: new Date().toISOString()
    }));

    if (snapshots.length > 0) {
      const { error } = await supabase.from('capacity_snapshots').insert(snapshots);
      if (error) {
        console.error('Error saving snapshots:', error);
        throw error;
      }
    }
  };

  return {
    loading,
    capacityData,
    summaryStats,
    forecastData,
    updateCapacitySettings,
    addSkill,
    removeSkill,
    recalculateSnapshots,
    departments
  };
}
