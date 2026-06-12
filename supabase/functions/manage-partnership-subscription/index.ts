import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Action = 'pause' | 'resume' | 'cancel' | 'update_goal' | 'clear_goal';
type GoalPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { subscription_id, action, target_profile_id, goal_amount, goal_period } = await req.json() as {
      subscription_id: string;
      action: Action;
      target_profile_id?: string;
      goal_amount?: number;
      goal_period?: GoalPeriod;
    };

    if (!subscription_id || !action) {
      return new Response(JSON.stringify({ error: 'subscription_id and action are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isStaff = profile?.role === 'MASTER_ADMIN' || profile?.role === 'WELFARE';

    const { data: subscription, error: fetchError } = await supabase
      .from('partnership_subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .single();

    if (fetchError || !subscription) {
      return new Response(JSON.stringify({ error: 'Subscription not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isStaff && subscription.profile_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    let update: Record<string, unknown> = {};

    if (action === 'pause') {
      if (!['ACTIVE'].includes(subscription.status)) {
        return new Response(JSON.stringify({ error: 'Only active subscriptions can be paused' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      update = { status: 'PAUSED', paused_at: now, next_charge_at: null };
    } else if (action === 'resume') {
      if (!['PAUSED'].includes(subscription.status)) {
        return new Response(JSON.stringify({ error: 'Only paused subscriptions can be resumed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      update = {
        status: 'ACTIVE',
        paused_at: null,
        consecutive_failures: 0,
        next_charge_at: tomorrow.toISOString().slice(0, 10),
      };
    } else if (action === 'cancel') {
      if (!['ACTIVE', 'PAUSED', 'PENDING_SETUP'].includes(subscription.status)) {
        return new Response(JSON.stringify({ error: 'Subscription cannot be cancelled' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      update = { status: 'CANCELLED', cancelled_at: now, next_charge_at: null };
    } else if (action === 'update_goal') {
      const parsedGoal = Number(goal_amount);
      const validPeriods: GoalPeriod[] = ['MONTHLY', 'QUARTERLY', 'YEARLY'];
      if (!parsedGoal || parsedGoal < 1 || !goal_period || !validPeriods.includes(goal_period)) {
        return new Response(JSON.stringify({ error: 'Enter a valid goal amount and period.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      update = {
        goal_amount: parsedGoal,
        goal_period,
        goal_set_at: now,
      };
    } else if (action === 'clear_goal') {
      update = {
        goal_amount: null,
        goal_period: null,
        goal_set_at: null,
      };
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (target_profile_id && isStaff) {
      // staff action only — no profile override needed, subscription_id is enough
    }

    const { data: updated, error: updateError } = await supabase
      .from('partnership_subscriptions')
      .update(update)
      .eq('id', subscription_id)
      .select('*')
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ subscription: updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
