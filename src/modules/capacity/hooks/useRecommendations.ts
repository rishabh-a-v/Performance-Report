import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useSpecialTaskStore } from '@/store/specialTaskStore';
import { RecommendationEngine, RecommendationResult } from '../services/RecommendationEngine';

export interface ScoredCandidate {
  id: string;
  name: string;
  role: string;
  utilizationPercent: number;
  efficiencyScore: number;
  matchScore: number;
  isOverutilizationRisk: boolean;
  matchingSkills: string[];
}

export function useRecommendations(taskId: string | null, capacityData: any[]) {
  const [loading, setLoading] = useState(false);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  
  const tasks = useSpecialTaskStore((s) => s.tasks);
  const recommendationEngine = useMemo(() => new RecommendationEngine(), []);

  // Fetch required skills for the task
  const fetchRequiredSkills = useCallback(async () => {
    if (!taskId) {
      setRequiredSkills([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('task_skills_required')
      .select('skill_name')
      .eq('task_id', taskId);

    if (error) {
      console.error('Error fetching task required skills:', error);
      setLoading(false);
      return;
    }

    setRequiredSkills((data || []).map((row: any) => row.skill_name));
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    fetchRequiredSkills();
  }, [fetchRequiredSkills]);

  // Generate recommendations for all candidates in capacityData
  const recommendations = useMemo(() => {
    if (!taskId || requiredSkills.length === 0) return { candidates: [], recommendation: null };

    const taskData = {
      id: taskId,
      requiredSkills
    };

    // Prepare employees format for RecommendationEngine
    const candidatesInput = capacityData.map(emp => ({
      id: emp.id,
      name: emp.full_name,
      role: emp.role,
      skills: emp.skills,
      utilizationPercent: emp.utilizationPercent,
      efficiency_score: emp.efficiency_score
    }));

    // Get recommendation result from engine
    const recommendationResult = recommendationEngine.generateTaskReassignment(taskData, candidatesInput);

    // Score all candidates
    const scoredCandidates: ScoredCandidate[] = capacityData.map((emp) => {
      let score = 0;
      const matchingSkills = requiredSkills.filter(s => emp.skills.includes(s));
      score += matchingSkills.length * 40;

      if (emp.utilizationPercent < 60) score += 20;
      if (emp.efficiency_score > 0.9) score += 20;

      return {
        id: emp.id,
        name: emp.full_name,
        role: emp.role,
        utilizationPercent: emp.utilizationPercent,
        efficiencyScore: emp.efficiency_score,
        matchScore: score,
        isOverutilizationRisk: emp.utilizationPercent >= 85,
        matchingSkills
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    return {
      candidates: scoredCandidates,
      recommendation: recommendationResult
    };
  }, [taskId, requiredSkills, capacityData, recommendationEngine]);

  // Add required skill to task
  const addTaskSkill = async (skillName: string) => {
    if (!taskId) return;
    const { error } = await supabase
      .from('task_skills_required')
      .insert({
        task_id: taskId,
        skill_name: skillName.trim()
      });

    if (error) {
      console.error('Error adding task skill:', error);
      throw error;
    }

    await fetchRequiredSkills();
  };

  // Remove required skill from task
  const removeTaskSkill = async (skillName: string) => {
    if (!taskId) return;
    const { error } = await supabase
      .from('task_skills_required')
      .delete()
      .eq('task_id', taskId)
      .eq('skill_name', skillName);

    if (error) {
      console.error('Error removing task skill:', error);
      throw error;
    }

    await fetchRequiredSkills();
  };

  // Reassign task to a new employee
  const reassignTask = async (employeeId: string) => {
    if (!taskId) return;
    setLoading(true);

    // 1. Delete existing task assignees for this task
    const { error: deleteErr } = await supabase
      .from('task_assignees')
      .delete()
      .eq('task_id', taskId);

    if (deleteErr) {
      console.error('Error removing old task assignees:', deleteErr);
      setLoading(false);
      throw deleteErr;
    }

    // 2. Insert new assignee
    const { error: insertErr } = await supabase
      .from('task_assignees')
      .insert({
        task_id: taskId,
        employee_id: employeeId,
        assigned_at: new Date().toISOString()
      });

    if (insertErr) {
      console.error('Error assigning task to new candidate:', insertErr);
      setLoading(false);
      throw insertErr;
    }

    // 3. Trigger reload of tasks
    await useSpecialTaskStore.getState().fetchTasks();
    setLoading(false);
  };

  return {
    loading,
    requiredSkills,
    candidates: recommendations.candidates,
    recommendation: recommendations.recommendation,
    addTaskSkill,
    removeTaskSkill,
    reassignTask
  };
}
