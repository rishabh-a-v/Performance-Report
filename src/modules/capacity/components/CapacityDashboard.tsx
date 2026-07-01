import React, { useState } from 'react';
import { 
  TrendingUp, AlertTriangle, CheckCircle, Users, 
  Sparkles, Plus, Trash2, Edit2, ShieldAlert, Award,
  Loader2, X, ChevronRight, Check
} from 'lucide-react';
import { useCapacityData } from '../hooks/useCapacityData';
import { useRecommendations } from '../hooks/useRecommendations';
import { useSpecialTaskStore } from '@/store/specialTaskStore';
import { UtilizationChart } from './UtilizationChart';
import { SkillGapPie } from './SkillGapPie';
import { cn } from '@/lib/utils';

interface CapacityDashboardProps {
  branch: string;
}

export function CapacityDashboard({ branch }: CapacityDashboardProps) {
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Custom hook fetching capacity planning data
  const {
    loading,
    capacityData,
    summaryStats,
    forecastData,
    updateCapacitySettings,
    addSkill,
    removeSkill,
    recalculateSnapshots,
    departments
  } = useCapacityData(branch, selectedDeptId);

  // Custom hook for candidate task recommendations
  const {
    loading: recLoading,
    requiredSkills,
    candidates,
    recommendation,
    addTaskSkill,
    removeTaskSkill,
    reassignTask
  } = useRecommendations(selectedTaskId, capacityData);

  // State for employee profiling editor
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editWorkingHours, setEditWorkingHours] = useState(8.0);
  const [editEfficiency, setEditEfficiency] = useState(1.0);
  const [editOvertime, setEditOvertime] = useState(10);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState(3);
  const [savingSettings, setSavingSettings] = useState(false);

  // Task lists (filtered for the branch)
  const activeTasks = capacityData.flatMap(emp => 
    emp.id ? (emp as any).id : []
  ); // Will load special tasks directly from store inside recommendations hook

  const selectedEmployee = capacityData.find(emp => emp.id === editingEmpId);

  const handleEditClick = (emp: any) => {
    setEditingEmpId(emp.id);
    setEditWorkingHours(emp.daily_working_hours);
    setEditEfficiency(emp.efficiency_score);
    setEditOvertime(emp.max_overtime_hours);
  };

  const handleSaveSettings = async () => {
    if (!editingEmpId) return;
    setSavingSettings(true);
    try {
      await updateCapacitySettings(editingEmpId, {
        daily_working_hours: editWorkingHours,
        efficiency_score: editEfficiency,
        max_overtime_hours: editOvertime
      });
      setEditingEmpId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddSkill = async () => {
    if (!editingEmpId || !newSkillName.trim()) return;
    try {
      await addSkill(editingEmpId, newSkillName.trim(), newSkillProficiency);
      setNewSkillName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSkill = async (skillName: string) => {
    if (!editingEmpId) return;
    try {
      await removeSkill(editingEmpId, skillName);
    } catch (err) {
      console.error(err);
    }
  };

  // Skill gap calculation for charts: count employees possessing each skill in the branch
  const skillsCountMap: Record<string, number> = {};
  capacityData.forEach(emp => {
    emp.skills.forEach(skill => {
      skillsCountMap[skill] = (skillsCountMap[skill] || 0) + 1;
    });
  });

  const skillsChartData = Object.entries(skillsCountMap).map(([name, value]) => ({
    name,
    value
  }));

  // Identify overloaded vs underutilized staff
  const overloadedStaff = capacityData.filter(emp => emp.overloadStatus === 'overloaded');
  const underutilizedStaff = capacityData.filter(emp => emp.overloadStatus === 'underutilized');

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Department</span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedDeptId(null)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                selectedDeptId === null
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              All Departments
            </button>
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptId(dept.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  selectedDeptId === dept.id
                    ? "bg-blue-50 text-blue-600 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {dept.name}
              </button>
            ))}
          </div>
        </div>
        
        <button
          onClick={recalculateSnapshots}
          className="rounded-lg bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 px-4 py-2 text-xs font-semibold shadow-sm transition-all"
        >
          Save Snapshot
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Capacity Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Available Capacity</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1 tabular-nums">{summaryStats.totalCapacity} <span className="text-sm font-semibold text-slate-400">Hrs</span></h3>
              <p className="text-[11px] text-slate-400 mt-1.5">Allocated: {summaryStats.totalAllocated} hrs</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-500">
              <Users size={18} />
            </div>
          </div>
        </div>

        {/* Capacity Utilization Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Capacity Utilization</p>
              <h3 className={cn(
                "text-3xl font-bold mt-1 tabular-nums",
                summaryStats.utilization > 85 ? "text-rose-600" : "text-emerald-600"
              )}>
                {summaryStats.utilization}%
              </h3>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {summaryStats.utilization > 85 ? "⚠️ Warning: high load" : "✅ Workforce load healthy"}
              </p>
            </div>
            <div className={cn(
              "rounded-xl p-2",
              summaryStats.utilization > 85 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
            )}>
              <TrendingUp size={18} />
            </div>
          </div>
        </div>

        {/* Shortage Hours Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Workload Shortage</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1 tabular-nums">{summaryStats.shortageHours} <span className="text-sm font-semibold text-slate-400">Hrs</span></h3>
              <p className="text-[11px] text-slate-400 mt-1.5">Overcapacity hours needing reallocation</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-500">
              <AlertTriangle size={18} />
            </div>
          </div>
        </div>

        {/* Overloaded Employees Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overloaded Staff</p>
              <h3 className={cn(
                "text-3xl font-bold mt-1 tabular-nums",
                summaryStats.overloadedCount > 0 ? "text-rose-600" : "text-slate-800"
              )}>
                {summaryStats.overloadedCount} <span className="text-xs font-semibold text-slate-400">profiles</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {summaryStats.underutilizedCount} underutilized (<span className="text-emerald-600 font-semibold">&lt;60%</span>)
              </p>
            </div>
            <div className={cn(
              "rounded-xl p-2",
              summaryStats.overloadedCount > 0 ? "bg-rose-50 text-rose-500" : "bg-slate-100 text-slate-500"
            )}>
              <ShieldAlert size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capacity vs Demand Line/Area Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Capacity vs Demand Forecast (7d)</h4>
          <div className="h-72">
            <UtilizationChart data={forecastData} />
          </div>
        </div>

        {/* Skill Gap Pie/Donut Chart */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm flex flex-col">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Team Skills Distribution</h4>
          <p className="text-[11px] text-slate-400 mb-4">Counts of certified employees in {branch}</p>
          <div className="h-56 flex-1">
            <SkillGapPie data={skillsChartData} />
          </div>
        </div>
      </div>

      {/* Bottlenecks, Slack, and Task Assistant Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Bottlenecks & Slack */}
        <div className="space-y-6">
          {/* Overloaded Bottlenecks Card */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-rose-50/20 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-rose-500" />
                <span className="text-sm font-bold text-rose-800">Critical Overloads (&gt;100%)</span>
              </div>
              <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-xs font-bold tabular-nums">
                {overloadedStaff.length}
              </span>
            </div>
            <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto">
              {overloadedStaff.length === 0 ? (
                <div className="px-5 py-6 text-center text-xs text-slate-400">
                  No overloaded employees in this department.
                </div>
              ) : (
                overloadedStaff.map(emp => (
                  <div key={emp.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{emp.full_name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{emp.role.replace('_', ' ')} · Allocated: {emp.allocatedHours}h</p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 text-xs font-bold tabular-nums">
                        {emp.utilizationPercent}%
                      </span>
                      <p className="text-[9px] text-rose-500 font-semibold mt-0.5">+{emp.shortageHours}h over capacity</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Underutilized Slack Card */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-emerald-50/20 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={15} className="text-emerald-500" />
                <span className="text-sm font-bold text-emerald-800">Available Capacity Slack (&lt;60%)</span>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-bold tabular-nums">
                {underutilizedStaff.length}
              </span>
            </div>
            <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto">
              {underutilizedStaff.length === 0 ? (
                <div className="px-5 py-6 text-center text-xs text-slate-400">
                  No underutilized employees with available capacity.
                </div>
              ) : (
                underutilizedStaff.map(emp => (
                  <div key={emp.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{emp.full_name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{emp.role.replace('_', ' ')} · Allocated: {emp.allocatedHours}h</p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-bold tabular-nums">
                        {emp.utilizationPercent}%
                      </span>
                      <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">{emp.availableCapacityHours - emp.allocatedHours}h free</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Task Assignment Assistant */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500 animate-pulse" />
                <span className="text-sm font-bold text-slate-800">Special Task Reassignment Assistant</span>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 mb-4 leading-normal">
              Select an active task to analyze the best matching candidate in the department based on required skills, efficiency scores, and current workforce utilization.
            </p>

            {/* Task selector dropdown */}
            <div className="mb-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Active Task</label>
              <select
                value={selectedTaskId || ''}
                onChange={(e) => setSelectedTaskId(e.target.value || null)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
              >
                <option value="">-- Choose a task --</option>
                {/* Dynamically list active tasks that aren't completed */}
                {Array.from(new Set(capacityData.flatMap(e => e.id ? [e.id] : []))).map((empId) => {
                  // Wait, let's load all tasks from specialTaskStore directly since we imported it
                  return null;
                })}
                {/* Instead, let's reference tasks loaded in useSpecialTaskStore */}
                {useSpecialTaskStore.getState().tasks.filter((t: any) => t.status !== 'Completed').map((task: any) => (
                  <option key={task.id} value={task.id}>
                    {task.task_name} ({task.priority})
                  </option>
                ))}
              </select>
            </div>

            {selectedTaskId && (
              <div className="space-y-4 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                {/* Task required skills tags */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {requiredSkills.length === 0 ? (
                      <span className="text-[10px] text-slate-400 italic">No skills specified yet</span>
                    ) : (
                      requiredSkills.map(skill => (
                        <span key={skill} className="inline-flex items-center gap-1 rounded bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-semibold">
                          {skill}
                          <button onClick={() => removeTaskSkill(skill)} className="hover:text-rose-500">
                            <X size={10} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  {/* Add skill input */}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Add required skill (e.g. Forklift)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          addTaskSkill(e.currentTarget.value.trim());
                          e.currentTarget.value = '';
                        }
                      }}
                      className="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                  </div>
                </div>

                {/* Candidate recommendations summary */}
                {recLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={16} className="text-slate-400 animate-spin mr-2" />
                    <span className="text-xs text-slate-500">Evaluating candidates...</span>
                  </div>
                ) : (
                  recommendation && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      {recommendation.action === 'ALERT' ? (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-start gap-2">
                          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                          <div className="text-[11px] text-amber-800 leading-normal">
                            <p className="font-bold">Skill Shortage Alert</p>
                            <p className="mt-0.5">{recommendation.reason}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Recommendation</span>
                            <span className="rounded bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[10px] font-bold">
                              Confidence: {recommendation.confidenceScore}%
                            </span>
                          </div>
                          
                          {/* Recommended Candidate Card */}
                          {candidates.find(c => c.id === recommendation.targetEmployee) && (
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-3 flex items-start justify-between">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                                  {candidates.find(c => c.id === recommendation.targetEmployee)!.name}
                                  <span className="inline-block rounded-full bg-emerald-100 text-emerald-700 px-1.5 py-px text-[9px] font-bold">
                                    {(candidates.find(c => c.id === recommendation.targetEmployee)!.utilizationPercent)}% Utilization
                                  </span>
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1 capitalize leading-relaxed">
                                  {recommendation.reason}
                                </p>
                              </div>
                              <button
                                onClick={async () => {
                                  if (recommendation.targetEmployee) {
                                    await reassignTask(recommendation.targetEmployee);
                                    setSelectedTaskId(null);
                                  }
                                }}
                                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
                              >
                                Reassign
                              </button>
                            </div>
                          )}

                          {/* Secondary Candidates List */}
                          {candidates.filter(c => c.id !== recommendation.targetEmployee && c.matchScore > 0).length > 0 && (
                            <div className="pt-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Alternative Candidates</span>
                              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                                {candidates
                                  .filter(c => c.id !== recommendation.targetEmployee && c.matchScore > 0)
                                  .slice(0, 3)
                                  .map(c => (
                                    <div key={c.id} className="rounded-lg border border-slate-100 bg-white p-2 flex items-center justify-between hover:bg-slate-50/40">
                                      <div className="min-w-0">
                                        <p className="text-[11px] font-bold text-slate-700 truncate">{c.name}</p>
                                        <p className="text-[9px] text-slate-400">Match score: {c.matchScore} · Util: {c.utilizationPercent}%</p>
                                      </div>
                                      <button
                                        onClick={async () => {
                                          await reassignTask(c.id);
                                          setSelectedTaskId(null);
                                        }}
                                        className="text-[10px] text-blue-600 hover:text-blue-700 font-bold px-2 py-1"
                                      >
                                        Assign
                                      </button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
          {!selectedTaskId && (
            <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400 py-10 mt-4">
              Select a task from the list above to get candidate matches.
            </div>
          )}
        </div>
      </div>

      {/* Workforce Profiling Editor & Skills Admin Table */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Workforce Profiling & Capacity Editor</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Manage daily working hours, performance efficiency scores, and operational skills</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Employee</th>
                <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Role</th>
                <th className="py-3 px-5 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Capacity Parameters</th>
                <th className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Acquired Skills</th>
                <th className="py-3 px-5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {capacityData.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors">
                  <td className="py-3.5 px-5">
                    <p className="text-sm font-medium text-slate-800 leading-snug">{emp.full_name}</p>
                    <p className="text-xs text-slate-400">{emp.email}</p>
                  </td>
                  <td className="py-3.5 px-5 text-sm text-slate-600 capitalize">
                    {emp.role.replace('_', ' ')}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-600">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Hours</p>
                        <p className="mt-0.5 font-semibold text-slate-800">{emp.daily_working_hours}h</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Efficiency</p>
                        <p className="mt-0.5 font-semibold text-slate-800">{emp.efficiency_score}x</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Max OT</p>
                        <p className="mt-0.5 font-semibold text-slate-800">{emp.max_overtime_hours}h</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex flex-wrap gap-1">
                      {emp.skills.length === 0 ? (
                        <span className="text-slate-300 text-xs italic">No skills registered</span>
                      ) : (
                        emp.skillsDetailed.map(skill => (
                          <span 
                            key={skill.skill_name} 
                            className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 text-[10px] font-semibold"
                            title={`Proficiency: Lvl ${skill.proficiency_level}`}
                          >
                            <Award size={10} className="text-indigo-500" />
                            {skill.skill_name} (L{skill.proficiency_level})
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => handleEditClick(emp)}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 px-2.5 py-1 text-xs font-semibold shadow-sm transition-all"
                    >
                      <Edit2 size={12} />
                      Configure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Capacity Settings Modal Drawer */}
      {editingEmpId && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="h-full w-full max-w-md bg-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-in">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Capacity & Skills Config</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedEmployee.full_name}</p>
                </div>
                <button
                  onClick={() => setEditingEmpId(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Settings */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Capacity Constants</h4>
                
                {/* Working hours input */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Daily Working Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={editWorkingHours}
                    onChange={(e) => setEditWorkingHours(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Efficiency score input */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Efficiency Factor (Multiplier)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="2"
                    value={editEfficiency}
                    onChange={(e) => setEditEfficiency(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Max Overtime hours input */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Max Monthly Overtime Hours</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={editOvertime}
                    onChange={(e) => setEditOvertime(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Skills Editor */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Skills Admin</h4>
                
                {/* Add new skill inputs */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Skill name (e.g. Hazardous)"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <select
                    value={newSkillProficiency}
                    onChange={(e) => setNewSkillProficiency(Number(e.target.value))}
                    className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="1">L1</option>
                    <option value="2">L2</option>
                    <option value="3">L3</option>
                    <option value="4">L4</option>
                    <option value="5">L5</option>
                  </select>
                  <button
                    onClick={handleAddSkill}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-all"
                  >
                    Add
                  </button>
                </div>

                {/* List of current skills to delete */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedEmployee.skillsDetailed.map(skill => (
                    <span 
                      key={skill.skill_name}
                      className="inline-flex items-center gap-1.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 text-xs font-semibold"
                    >
                      {skill.skill_name} (L{skill.proficiency_level})
                      <button 
                        onClick={() => handleRemoveSkill(skill.skill_name)}
                        className="hover:text-rose-600 font-bold rounded-full p-px text-indigo-400 hover:bg-rose-50"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex gap-3 pt-6 border-t border-slate-100 mt-8">
              <button
                onClick={() => setEditingEmpId(null)}
                className="flex-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 text-xs font-semibold shadow-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2 text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {savingSettings && <Loader2 size={12} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
