/**
 * CAPACITY SNAPSHOT SCHEDULER
 * 
 * This file documents how to set up an asynchronous hourly capacity calculation job
 * using node-cron or BullMQ, keeping calculations inside a worker thread to ensure the 
 * main application loop is never blocked.
 * 
 * In a serverless/client-side Supabase deployment, snapshots can also be maintained
 * automatically using PostgreSQL triggers when tasks, assignees, or profiles are updated.
 */

/*
// Example using node-cron and Worker Threads:

import cron from 'node-cron';
import { Worker } from 'worker_threads';
import path from 'path';

// Run every hour
cron.schedule('0 * * * *', () => {
  console.log('[Scheduler] Launching capacity recalculation worker...');
  
  const worker = new Worker(path.resolve(__dirname, './capacityWorker.js'), {
    workerData: {
      timestamp: new Date().toISOString()
    }
  });

  worker.on('message', (result) => {
    console.log(`[Scheduler] Recalculation complete. Snapshots written: ${result.count}`);
  });

  worker.on('error', (err) => {
    console.error('[Scheduler] Recalculation worker failed:', err);
  });

  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[Scheduler] Recalculation worker stopped with exit code ${code}`);
    }
  });
});
*/

/*
// Example worker code (capacityWorker.js):

const { parentPort, workerData } = require('worker_threads');
const { createClient } = require('@supabase/supabase-js');
const { CapacityEngine } = require('./CapacityEngine');

async function recalculateAll() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const engine = new CapacityEngine();
  
  // Fetch profiles, tasks, job directions
  const { data: profiles } = await supabase.from('profiles').select('*');
  const { data: tasks } = await supabase.from('special_tasks').select('*, task_assignees(*)');
  const { data: directions } = await supabase.from('job_directions').select('*');
  
  const snapshots = [];
  
  for (const emp of profiles) {
    // 1. Sum up tasks allocated to this employee
    const activeTasks = tasks.filter(t => 
      t.status !== 'Completed' && 
      t.task_assignees?.some(ta => ta.employee_id === emp.id)
    );
    let allocated = 0;
    activeTasks.forEach(task => {
      let taskHours = 1.5;
      if (task.priority === 'urgent') taskHours = 4.0;
      else if (task.priority === 'high') taskHours = 2.5;
      else if (task.priority === 'low') taskHours = 0.5;
      allocated += taskHours;
    });
    
    // 2. Add Job Directions allocations (2.0 hours each)
    const activeJDs = directions.filter(d => d.employee_id === emp.id && ['active', 'approved'].includes(d.status));
    allocated += activeJDs.length * 2.0;

    // 3. Compute capacity metrics
    const capacity = engine.calculateEmployeeCapacity(emp, 1.0, 1.0, 0); // 1h break, 1h meeting, 0h leave
    const metrics = engine.calculateUtilization(capacity, allocated);

    snapshots.push({
      entity_id: emp.id,
      entity_type: 'EMPLOYEE',
      available_hours: metrics.availableCapacityHours,
      allocated_hours: metrics.allocatedHours,
      utilization_percent: metrics.utilizationPercent,
      calculated_at: workerData.timestamp
    });
  }

  // Write snapshots in bulk
  if (snapshots.length > 0) {
    const { error } = await supabase.from('capacity_snapshots').insert(snapshots);
    if (error) throw error;
  }

  parentPort.postMessage({ count: snapshots.length });
}

recalculateAll().catch(err => {
  console.error(err);
  process.exit(1);
});
*/
