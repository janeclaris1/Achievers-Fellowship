import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function tomorrowUtcDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { reference } = await req.json();

    if (!reference) {
      return new Response(JSON.stringify({ error: 'Payment reference is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!PAYSTACK_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Paystack is not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: subscription, error: subError } = await supabase
      .from('partnership_subscriptions')
      .select('*')
      .eq('setup_payment_reference', reference)
      .maybeSingle();

    if (subError || !subscription) {
      return new Response(JSON.stringify({ error: 'Subscription not found for this reference' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (subscription.status === 'ACTIVE') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Subscription is already active.',
        subscription,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const verifyResp = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    const verifyData = await verifyResp.json();
    const tx = verifyData?.data;
    const successful = tx?.status === 'success';
    const authCode = tx?.authorization?.authorization_code as string | undefined;
    const customerCode = tx?.customer?.customer_code as string | undefined;
    const paystackRef = tx?.reference as string | undefined;

    if (!successful || !authCode) {
      await supabase
        .from('partnership_subscriptions')
        .update({ status: 'FAILED' })
        .eq('id', subscription.id);

      return new Response(JSON.stringify({
        success: false,
        message: 'Payment was not successful or authorization was not saved.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const now = new Date().toISOString();
    const chargeRef = `psub-charge-${crypto.randomUUID()}`;

    const { data: partnership, error: partnershipError } = await supabase
      .from('welfare_partnerships')
      .insert({
        profile_id: subscription.profile_id,
        amount: subscription.daily_amount,
        currency: subscription.currency,
        status: 'COMPLETED',
        payment_reference: chargeRef,
        paystack_reference: paystackRef ?? null,
        partnership_arm: subscription.partnership_arm,
        partner_note: 'Partnership subscription — first daily charge',
        paid_at: now,
        subscription_id: subscription.id,
      })
      .select('id')
      .single();

    if (partnershipError) {
      return new Response(JSON.stringify({ error: partnershipError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('partnership_subscription_charges').insert({
      subscription_id: subscription.id,
      amount: subscription.daily_amount,
      currency: subscription.currency,
      status: 'COMPLETED',
      payment_reference: chargeRef,
      paystack_reference: paystackRef ?? null,
      welfare_partnership_id: partnership.id,
      charged_at: now,
    });

    const { data: activated, error: activateError } = await supabase
      .from('partnership_subscriptions')
      .update({
        status: 'ACTIVE',
        paystack_authorization_code: authCode,
        paystack_customer_code: customerCode ?? null,
        started_at: now,
        last_charged_at: now,
        next_charge_at: tomorrowUtcDate(),
        consecutive_failures: 0,
      })
      .eq('id', subscription.id)
      .select('*')
      .single();

    if (activateError) {
      return new Response(JSON.stringify({ error: activateError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Partnership subscription activated. Your daily partnership will be charged automatically.',
      subscription: activated,
      daily_amount: Number(subscription.daily_amount),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
