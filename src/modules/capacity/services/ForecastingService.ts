import { CapacityEngine } from './CapacityEngine';

export interface ForecastDataPoint {
  date: string;
  capacity: number;
  demand: number;
}

export class ForecastingService {
  private capacityEngine = new CapacityEngine();

  public generateForecast(
    departmentId: string | null,
    branch: string,
    profiles: any[],
    tasks: any[],
    directions: any[],
    daysCount = 7
  ): ForecastDataPoint[] {
    const forecast: ForecastDataPoint[] = [];
    const now = new Date();
    
    // Filter profiles by branch and department
    const deptProfiles = profiles.filter(p => 
      p.branch === branch && 
      (!departmentId || p.department_id === departmentId)
    );

    // Calculate total daily capacity of the team
    const totalDailyCapacity = deptProfiles.reduce((sum, emp) => {
      const empCapacity = this.capacityEngine.calculateEmployeeCapacity(emp, 1.0, 1.0, 0); // 1h breaks, 1h meetings
      return sum + empCapacity;
    }, 0);

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      
      // Calculate demand on this specific date
      let dailyDemand = 0;

      // 1. Job Directions demand (JDs are ongoing, count as 2 hours/day)
      const activeJDs = directions.filter(jd => 
        deptProfiles.some(p => p.id === jd.employee_id) && 
        ['active', 'approved'].includes(jd.status)
      );
      dailyDemand += activeJDs.length * 2.0;

      // 2. Tasks demand (Special Tasks are active until they are completed or their due date passes)
      const activeTasks = tasks.filter(task => {
        const hasAssigneeInDept = task.assignees?.some((a: any) => 
          deptProfiles.some(p => p.id === a.employee_id)
        );
        if (!hasAssigneeInDept) return false;
        
        // Task is active if it's not completed AND:
        // - it has no due date OR
        // - the forecast date is before or equal to the due date
        const isNotCompleted = task.status !== 'Completed';
        const isBeforeDue = !task.due_date || dateStr <= task.due_date;
        const wasCreatedBefore = !task.created_at || dateStr >= task.created_at.slice(0, 10);
        
        return isNotCompleted && isBeforeDue && wasCreatedBefore;
      });

      // Sum task hours based on priority
      activeTasks.forEach(task => {
        let taskHours = 1.5; // Medium default
        if (task.priority === 'urgent') taskHours = 4.0;
        else if (task.priority === 'high') taskHours = 2.5;
        else if (task.priority === 'low') taskHours = 0.5;
        
        dailyDemand += taskHours;
      });

      forecast.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        capacity: Number(totalDailyCapacity.toFixed(1)),
        demand: Number(dailyDemand.toFixed(1))
      });
    }

    return forecast;
  }
}
