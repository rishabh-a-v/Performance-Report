export interface RecommendationResult {
  action: 'REASSIGN' | 'ALERT';
  targetEmployee?: string;
  confidenceScore: number;
  reason: string;
}

export class RecommendationEngine {
  public generateTaskReassignment(task: { id: string; requiredSkills: string[] }, employees: any[]): RecommendationResult {
    let bestCandidate = null;
    let highestScore = -1;

    for (const emp of employees) {
      let score = 0;
      
      // Skill matching
      const empSkills = emp.skills || [];
      const matchingSkills = task.requiredSkills.filter(s => empSkills.includes(s));
      score += matchingSkills.length * 40;

      // Workload and efficiency checks
      const utilization = emp.utilizationPercent || 0;
      const efficiency = emp.efficiency_score !== undefined && emp.efficiency_score !== null
        ? Number(emp.efficiency_score)
        : 1.0;

      if (utilization < 60) score += 20; // Low utilization bonus
      if (efficiency > 0.9) score += 20;  // High performance bonus
      
      // Filter out employees who are already near capacity or overloaded (>85%)
      if (score > highestScore && utilization < 85) {
        highestScore = score;
        bestCandidate = emp;
      }
    }

    if (!bestCandidate) {
      return { 
        action: 'ALERT', 
        confidenceScore: 0,
        message: `Skill shortage: Cannot fulfill task ${task.id}`,
        reason: 'No suitable candidate with available capacity (<85% utilization) was found.'
      } as any; // Allow message key as a fallback / custom structure
    }

    return {
      action: 'REASSIGN',
      targetEmployee: bestCandidate.id,
      confidenceScore: highestScore,
      reason: `Employee has ${highestScore} match score and available capacity. Matching skills: ${(task.requiredSkills.filter(s => (bestCandidate.skills || []).includes(s))).join(', ') || 'none'}.`
    };
  }
}
