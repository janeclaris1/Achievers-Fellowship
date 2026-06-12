import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!;
const CRON_SECRET = Deno.env.get('PARTNERSHIP_CRON_SECRET');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

function tomorrowUtcDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const cronSecret = req.headers.get('x-cron-secret');
    const serviceKey = SERVICE_ROLE_KEY;

    const authorized =
      authHeader === `Bearer ${serviceKey}` ||
      (CRON_SECRET && cronSecret === CRON_SECRET);

    if (!authorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!PAYSTACK_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Paystack is not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const today = todayUtcDate();

    const { data: dueSubscriptions, error: listError } = await supabase
      .from('partnership_subscriptions')
      .select('*')
      .eq('status', 'ACTIVE')
      .lte('next_charge_at', today)
      .not('paystack_authorization_code', 'is', null);

    if (listError) {
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Array<{ subscription_id: string; success: boolean; message: string }> = [];

    for (const sub of dueSubscriptions ?? []) {
      const paymentReference = `psub-charge-${crypto.randomUUID()}`;
      const amountInPesewas = Math.round(Number(sub.daily_amount) * 100);

      const { data: chargeRow } = await supabase
        .from('partnership_subscription_charges')
        .insert({
          subscription_id: sub.id,
          amount: sub.daily_amount,
          currency: sub.currency,
          status: 'PENDING',
          payment_reference: paymentReference,
        })
        .select('id')
        .single();

      const chargeResp = await fetch('https://api.paystack.co/transaction/charge_authorization', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorization_code: sub.paystack_authorization_code,
          email: sub.payer_email,
          amount: amountInPesewas,
          currency: sub.currency || 'GHS',
          reference: paymentReference,
          metadata: {
            subscription_id: sub.id,
            type: 'partnership_subscription_charge',
          },
        }),
      });

      const chargeData = await chargeResp.json();
      const tx = chargeData?.data;
      const successful = chargeData.status === true && tx?.status === 'success';
      const now = new Date().toISOString();

      if (successful) {
        const { data: partnership } = await supabase
          .from('welfare_partnerships')
          .insert({
            profile_id: sub.profile_id,
            amount: sub.daily_amount,
            currency: sub.currency,
            status: 'COMPLETED',
            payment_reference: paymentReference,
            paystack_reference: tx.reference ?? null,
            partnership_arm: sub.partnership_arm,
            partner_note: 'Partnership subscription — daily charge',
            paid_at: now,
            subscription_id: sub.id,
          })
          .select('id')
          .single();

        await supabase
          .from('partnership_subscription_charges')
          .update({
            status: 'COMPLETED',
            paystack_reference: tx.reference ?? null,
            welfare_partnership_id: partnership?.id ?? null,
            charged_at: now,
          })
          .eq('payment_reference', paymentReference);

        await supabase
          .from('partnership_subscriptions')
          .update({
            last_charged_at: now,
            next_charge_at: tomorrowUtcDate(),
            consecutive_failures: 0,
          })
          .eq('id', sub.id);

        results.push({ subscription_id: sub.id, success: true, message: 'Charged successfully' });
      } else {
        const reason = chargeData.message || tx?.gateway_response || 'Charge failed';
        const failures = (sub.consecutive_failures ?? 0) + 1;
        const pause = failures >= 3;

        await supabase
          .from('partnership_subscription_charges')
          .update({
            status: 'FAILED',
            failure_reason: reason,
          })
          .eq('payment_reference', paymentReference);

        await supabase
          .from('partnership_subscriptions')
          .update({
            consecutive_failures: failures,
            status: pause ? 'PAUSED' : 'ACTIVE',
            paused_at: pause ? now : null,
            next_charge_at: pause ? null : tomorrowUtcDate(),
          })
          .eq('id', sub.id);

        results.push({
          subscription_id: sub.id,
          success: false,
          message: pause ? `Paused after ${failures} failures: ${reason}` : reason,
        });
      }

      if (chargeRow) {
        // charge row always created above
      }
    }

    return new Response(JSON.stringify({
      processed: results.length,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
