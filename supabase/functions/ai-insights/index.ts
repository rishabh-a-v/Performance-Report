import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InsightRequest {
  scope:     'employee' | 'team' | 'department' | 'executive'
  target_id: string
  period:    string
}

async function buildPrompt(scope: string, data: Record<string, unknown>): Promise<string> {
  const baseContext = `You are a management intelligence analyst. Produce a concise, actionable insight report. Respond in JSON with keys: summary (string), risks (string[]), recommendations (string[]).`

  const payloads: Record<string, string> = {
    employee: `
${baseContext}

Employee data for the period ${data.period}:
- Tasks assigned: ${data.tasks_assigned}
- Tasks completed: ${data.tasks_completed}
- Completion rate: ${data.completion_rate}%
- Average cycle time: ${data.avg_cycle_time_hours ?? 'N/A'}h
- KPI score: ${data.kpi_score}
- Active blockers: ${data.active_blockers}
- Daily check-ins: ${JSON.stringify(data.recent_checkins)}

Write a motivating, brief weekly summary for this employee. Identify 1-3 risks and actionable recommendations.`,

    team: `
${baseContext}

Manager team data for the period ${data.period}:
- Team size: ${data.team_size}
- Total tasks: ${data.total_tasks}, completed: ${data.completed_tasks}
- Completion rate: ${data.completion_rate}%
- Members blocked: ${data.members_blocked}
- Blocker details: ${JSON.stringify(data.blockers)}
- Recent check-ins: ${JSON.stringify(data.recent_checkins)}

Write a team health report for the manager. Surface risks and escalation triggers.`,

    department: `
${baseContext}

Department analytics for ${data.dept_name} — period ${data.period}:
- Active tasks: ${data.active_tasks}, completed: ${data.completed_tasks}
- Efficiency score: ${data.efficiency_score}, KPI: ${data.kpi_score}
- Utilisation: ${data.utilization_pct}%
- Blocked tasks: ${data.blocked_tasks}
- Average cycle time: ${data.avg_cycle_time_hours ?? 'N/A'}h

Write a department performance narrative for the head. Flag bottlenecks and recommend structural improvements.`,

    executive: `
${baseContext}

Company-wide executive snapshot — period ${data.period}:
- Total employees: ${data.total_employees}
- Company completion rate: ${data.completion_rate}%
- Active blockers: ${data.active_blockers}
- Departments below KPI target: ${JSON.stringify(data.underperforming_depts)}
- Top performer: ${data.top_dept}
- Bottom performer: ${data.bottom_dept}

Write an executive summary with strategic risk flags and board-level recommendations.`,
  }

  return payloads[scope] ?? baseContext
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body = await req.json() as InsightRequest
    const { scope, target_id, period } = body

    // ── Fetch contextual data based on scope ──────────────────
    let contextData: Record<string, unknown> = { period }

    if (scope === 'employee') {
      const { data: snap } = await supabase
        .from('performance_snapshots')
        .select('*')
        .eq('user_id', target_id)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single()

      const { data: blockers } = await supabase
        .from('blockers')
        .select('description, hours_blocked')
        .eq('employee_id', target_id)
        .is('resolved_at', null)

      const { data: checkins } = await supabase
        .from('daily_checkins')
        .select('completed_yesterday, focus_today, is_blocked')
        .eq('user_id', target_id)
        .order('checkin_date', { ascending: false })
        .limit(5)

      contextData = { ...contextData, ...snap, active_blockers: blockers?.length ?? 0, recent_checkins: checkins }
    }

    if (scope === 'team') {
      const { data: reports } = await supabase
        .from('profiles')
        .select('id')
        .eq('manager_id', target_id)

      const reportIds = reports?.map((r) => r.id) ?? []

      const { data: snaps } = await supabase
        .from('performance_snapshots')
        .select('*')
        .in('user_id', reportIds)
        .order('snapshot_date', { ascending: false })
        .limit(reportIds.length)

      const { data: blockers } = await supabase
        .from('blockers')
        .select('employee_id, description, hours_blocked')
        .in('employee_id', reportIds)
        .is('resolved_at', null)

      const { data: checkins } = await supabase
        .from('daily_checkins')
        .select('user_id, completed_yesterday, focus_today, is_blocked')
        .in('user_id', reportIds)
        .eq('checkin_date', new Date().toISOString().slice(0, 10))

      contextData = {
        ...contextData,
        team_size: reportIds.length,
        total_tasks: snaps?.reduce((s, r) => s + r.tasks_assigned, 0) ?? 0,
        completed_tasks: snaps?.reduce((s, r) => s + r.tasks_completed, 0) ?? 0,
        completion_rate: snaps?.length
          ? Math.round(snaps.reduce((s, r) => s + r.completion_rate, 0) / snaps.length)
          : 0,
        members_blocked: blockers?.length ?? 0,
        blockers,
        recent_checkins: checkins,
      }
    }

    if (scope === 'department') {
      const { data: snap } = await supabase
        .from('department_snapshots')
        .select('*')
        .eq('department_id', target_id)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single()

      const { data: dept } = await supabase
        .from('departments')
        .select('name')
        .eq('id', target_id)
        .single()

      contextData = { ...contextData, ...snap, dept_name: dept?.name ?? '' }
    }

    if (scope === 'executive') {
      const { data: snaps } = await supabase
        .from('department_snapshots')
        .select('department_id, kpi_score, efficiency_score')
        .order('snapshot_date', { ascending: false })

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true)

      const { data: blockers } = await supabase
        .from('blockers')
        .select('id')
        .is('resolved_at', null)

      const { data: tasks } = await supabase
        .from('tasks')
        .select('status')

      const done   = tasks?.filter((t) => t.status === 'done').length ?? 0
      const total  = tasks?.length ?? 1
      const sorted = [...(snaps ?? [])].sort((a, b) => b.kpi_score - a.kpi_score)

      contextData = {
        ...contextData,
        total_employees: profiles?.length ?? 0,
        completion_rate: Math.round((done / total) * 100),
        active_blockers: blockers?.length ?? 0,
        underperforming_depts: snaps?.filter((s) => s.kpi_score < 70).map((s) => s.department_id) ?? [],
        top_dept:    sorted[0]?.department_id ?? '—',
        bottom_dept: sorted[sorted.length - 1]?.department_id ?? '—',
      }
    }

    // ── Call Claude API ────────────────────────────────────────
    const prompt = await buildPrompt(scope, contextData)

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })

    if (!claudeRes.ok) {
      throw new Error(`Claude API error: ${claudeRes.status}`)
    }

    const claudeData = await claudeRes.json()
    const text = claudeData.content?.[0]?.text ?? '{}'
    const parsed = JSON.parse(text)

    // ── Persist insight ────────────────────────────────────────
    const { data: insight, error } = await supabase
      .from('ai_insights')
      .insert({
        scope,
        target_id,
        period,
        summary:         parsed.summary         ?? '',
        risks:           parsed.risks            ?? [],
        recommendations: parsed.recommendations  ?? [],
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify(insight), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
