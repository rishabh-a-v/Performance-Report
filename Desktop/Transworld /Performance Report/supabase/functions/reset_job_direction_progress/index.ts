import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for edge function
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetRequest {
  period: 'daily' | 'weekly' | 'monthly';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Parse query param or JSON body for period
    const url = new URL(req.url);
    const periodFromQuery = url.searchParams.get('period') as ResetRequest['period'] | null;
    let period: ResetRequest['period'];
    if (periodFromQuery) {
      period = periodFromQuery;
    } else {
      const body = (await req.json()) as ResetRequest;
      period = body.period;
    }

    if (!period || !['daily', 'weekly', 'monthly'].includes(period)) {
      return new Response(JSON.stringify({ error: 'Invalid period' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Build update clause based on period
    const columnMap: Record<ResetRequest['period'], string> = {
      daily: 'daily_completed',
      weekly: 'weekly_completed',
      monthly: 'monthly_completed',
    };
    const column = columnMap[period];

    // Reset counters to 0 for all active job directions (status not archived/completed)
    const { error: updateError } = await supabase
      .from('job_directions')
      .update({ [column]: 0 })
      .neq('status', 'archived') // assuming archived/completed statuses exist
      .neq('status', 'completed');

    if (updateError) {
      throw updateError;
    }

    // Insert a log entry (optional)
    await supabase
      .from('job_direction_progress_reset_logs')
      .insert({ period, reset_by: 'edge_function' });

    return new Response(JSON.stringify({ success: true, period }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
