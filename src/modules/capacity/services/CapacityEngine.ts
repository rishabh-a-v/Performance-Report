export interface CapacityResult {
  availableCapacityHours: number;
  allocatedHours: number;
  utilizationPercent: number;
  overloadStatus: 'underutilized' | 'healthy' | 'near_capacity' | 'overloaded';
  shortageHours: number;
}

export class CapacityEngine {
  public calculateEmployeeCapacity(employee: any, breaks: number, meetings: number, leaveHours: number): number {
    // Fallback to 8.0 working hours and 1.0 efficiency if not set
    const workingHours = employee.daily_working_hours !== undefined && employee.daily_working_hours !== null
      ? Number(employee.daily_working_hours)
      : 8.0;
    const efficiency = employee.efficiency_score !== undefined && employee.efficiency_score !== null
      ? Number(employee.efficiency_score)
      : 1.0;

    const rawHours = workingHours - breaks - meetings - leaveHours;
    return Math.max(0, rawHours * efficiency);
  }

  public calculateUtilization(capacityHours: number, allocatedHours: number): CapacityResult {
    // If capacity is 0, but allocated > 0, utilization is 100% (or infinite). Standard is 100%.
    const utilizationPercent = capacityHours > 0 ? (allocatedHours / capacityHours) * 100 : (allocatedHours > 0 ? 100 : 0);
    
    let overloadStatus: CapacityResult['overloadStatus'] = 'healthy';
    if (utilizationPercent < 60) overloadStatus = 'underutilized';
    else if (utilizationPercent > 85 && utilizationPercent <= 100) overloadStatus = 'near_capacity';
    else if (utilizationPercent > 100) overloadStatus = 'overloaded';

    return {
      availableCapacityHours: Number(capacityHours.toFixed(2)),
      allocatedHours: Number(allocatedHours.toFixed(2)),
      utilizationPercent: Number(utilizationPercent.toFixed(1)),
      overloadStatus,
      shortageHours: utilizationPercent > 100 ? Number((allocatedHours - capacityHours).toFixed(2)) : 0
    };
  }

  public detectBottlenecks(teamSnapshots: CapacityResult[]) {
    return teamSnapshots.filter(snap => snap.overloadStatus === 'overloaded');
  }
}
