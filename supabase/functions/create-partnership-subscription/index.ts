import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://achieverspcf.org';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Paystack is not configured.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    const { daily_amount, partnership_arm, goal_amount, goal_period } = await req.json();
    const parsedDaily = Number(daily_amount);
    const parsedGoal = goal_amount != null ? Number(goal_amount) : null;
    const validPeriods = ['MONTHLY', 'QUARTERLY', 'YEARLY'];

    if (!parsedDaily || parsedDaily < 1) {
      return new Response(JSON.stringify({ error: 'Enter a valid daily amount (minimum 1 GHS).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if ((parsedGoal != null && !goal_period) || (parsedGoal == null && goal_period)) {
      return new Response(JSON.stringify({ error: 'Goal amount and period must be set together.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (parsedGoal != null && (parsedGoal < 1 || !validPeriods.includes(goal_period))) {
      return new Response(JSON.stringify({ error: 'Enter a valid goal amount and period.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existing } = await supabase
      .from('partnership_subscriptions')
      .select('id, status')
      .eq('profile_id', user.id)
      .in('status', ['PENDING_SETUP', 'ACTIVE', 'PAUSED'])
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({
        error: existing.status === 'PENDING_SETUP'
          ? 'You already have a subscription setup in progress.'
          : 'You already have an active partnership subscription.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentReference = `psub-setup-${crypto.randomUUID()}`;
    const email = user.email || 'partner@achieverspcf.org';

    const { data: subscription, error: insertError } = await supabase
      .from('partnership_subscriptions')
      .insert({
        profile_id: user.id,
        daily_amount: parsedDaily,
        currency: 'GHS',
        partnership_arm: partnership_arm?.trim() || null,
        goal_amount: parsedGoal,
        goal_period: parsedGoal != null ? goal_period : null,
        goal_set_at: parsedGoal != null ? new Date().toISOString() : null,
        status: 'PENDING_SETUP',
        payer_email: email,
        setup_payment_reference: paymentReference,
      })
      .select('id')
      .single();

    if (insertError || !subscription) {
      return new Response(JSON.stringify({ error: insertError?.message || 'Failed to create subscription' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amountInPesewas = Math.round(parsedDaily * 100);

    const paystackResp = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountInPesewas,
        currency: 'GHS',
        reference: paymentReference,
        callback_url: `${APP_URL}/partnership/subscription-complete?reference=${paymentReference}`,
        metadata: {
          profile_id: user.id,
          type: 'partnership_subscription_setup',
          subscription_id: subscription.id,
          daily_amount: parsedDaily,
          partnership_arm: partnership_arm?.trim() || null,
        },
      }),
    });

    const paystackData = await paystackResp.json();

    if (!paystackResp.ok || !paystackData.data?.authorization_url) {
      await supabase.from('partnership_subscriptions').delete().eq('id', subscription.id);
      return new Response(JSON.stringify({
        error: paystackData.message || 'Failed to initialize payment',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        payment_reference: paymentReference,
        subscription_id: subscription.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
