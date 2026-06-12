import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!;

function tomorrowUtcDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function verifyPaystackSignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature || !PAYSTACK_SECRET_KEY) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(PAYSTACK_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );

  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const hash = Array.from(new Uint8Array(signed))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return hash === signature;
}

async function completeWelfarePartnership(
  supabase: ReturnType<typeof createClient>,
  reference: string,
  paystackReference: string | null
) {
  const { data } = await supabase
    .from('welfare_partnerships')
    .update({
      status: 'COMPLETED',
      paystack_reference: paystackReference,
      paid_at: new Date().toISOString(),
    })
    .eq('payment_reference', reference)
    .in('status', ['PENDING'])
    .select('id')
    .maybeSingle();

  return Boolean(data);
}

async function activateSubscriptionSetup(
  supabase: ReturnType<typeof createClient>,
  reference: string,
  tx: Record<string, unknown>
) {
  const { data: subscription } = await supabase
    .from('partnership_subscriptions')
    .select('*')
    .eq('setup_payment_reference', reference)
    .maybeSingle();

  if (!subscription || subscription.status === 'ACTIVE') {
    return subscription?.status === 'ACTIVE';
  }

  if (tx.status !== 'success') {
    await supabase.from('partnership_subscriptions').update({ status: 'FAILED' }).eq('id', subscription.id);
    return false;
  }

  const auth = tx.authorization as { authorization_code?: string } | undefined;
  const customer = tx.customer as { customer_code?: string } | undefined;
  const authCode = auth?.authorization_code;

  if (!authCode) {
    await supabase.from('partnership_subscriptions').update({ status: 'FAILED' }).eq('id', subscription.id);
    return false;
  }

  const now = new Date().toISOString();
  const chargeRef = `psub-charge-${crypto.randomUUID()}`;
  const paystackRef = (tx.reference as string | undefined) ?? null;

  const { data: partnership } = await supabase
    .from('welfare_partnerships')
    .insert({
      profile_id: subscription.profile_id,
      amount: subscription.daily_amount,
      currency: subscription.currency,
      status: 'COMPLETED',
      payment_reference: chargeRef,
      paystack_reference: paystackRef,
      partnership_arm: subscription.partnership_arm,
      partner_note: 'Partnership subscription — first daily charge',
      paid_at: now,
      subscription_id: subscription.id,
    })
    .select('id')
    .single();

  if (!partnership) return false;

  await supabase.from('partnership_subscription_charges').insert({
    subscription_id: subscription.id,
    amount: subscription.daily_amount,
    currency: subscription.currency,
    status: 'COMPLETED',
    payment_reference: chargeRef,
    paystack_reference: paystackRef,
    welfare_partnership_id: partnership.id,
    charged_at: now,
  });

  await supabase
    .from('partnership_subscriptions')
    .update({
      status: 'ACTIVE',
      paystack_authorization_code: authCode,
      paystack_customer_code: customer?.customer_code ?? null,
      started_at: now,
      last_charged_at: now,
      next_charge_at: tomorrowUtcDate(),
      consecutive_failures: 0,
    })
    .eq('id', subscription.id);

  return true;
}

async function completeSubscriptionCharge(
  supabase: ReturnType<typeof createClient>,
  reference: string,
  tx: Record<string, unknown>
) {
  const { data: charge } = await supabase
    .from('partnership_subscription_charges')
    .select('*, partnership_subscriptions(*)')
    .eq('payment_reference', reference)
    .maybeSingle();

  if (!charge || charge.status === 'COMPLETED') {
    return charge?.status === 'COMPLETED';
  }

  if (tx.status !== 'success') {
    await supabase
      .from('partnership_subscription_charges')
      .update({ status: 'FAILED', failure_reason: 'Webhook reported unsuccessful charge' })
      .eq('id', charge.id);
    return false;
  }

  const sub = charge.partnership_subscriptions as Record<string, unknown> | null;
  if (!sub) return false;

  const now = new Date().toISOString();
  const paystackRef = (tx.reference as string | undefined) ?? null;

  const { data: partnership } = await supabase
    .from('welfare_partnerships')
    .insert({
      profile_id: sub.profile_id,
      amount: charge.amount,
      currency: charge.currency,
      status: 'COMPLETED',
      payment_reference: reference,
      paystack_reference: paystackRef,
      partnership_arm: sub.partnership_arm,
      partner_note: 'Partnership subscription — daily charge',
      paid_at: now,
      subscription_id: charge.subscription_id,
    })
    .select('id')
    .single();

  await supabase
    .from('partnership_subscription_charges')
    .update({
      status: 'COMPLETED',
      paystack_reference: paystackRef,
      welfare_partnership_id: partnership?.id ?? null,
      charged_at: now,
    })
    .eq('id', charge.id);

  await supabase
    .from('partnership_subscriptions')
    .update({
      last_charged_at: now,
      next_charge_at: tomorrowUtcDate(),
      consecutive_failures: 0,
    })
    .eq('id', charge.subscription_id);

  return true;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const valid = await verifyPaystackSignature(rawBody, signature);

    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event as string;
    const data = event.data as Record<string, unknown> | undefined;
    const reference = data?.reference as string | undefined;

    if (eventType !== 'charge.success' || !reference || !data) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    let handled = false;

    if (reference.startsWith('welfare-')) {
      handled = await completeWelfarePartnership(supabase, reference, reference);
    } else if (reference.startsWith('psub-setup-')) {
      handled = await activateSubscriptionSetup(supabase, reference, data);
    } else if (reference.startsWith('psub-charge-')) {
      handled = await completeSubscriptionCharge(supabase, reference, data);
    }

    return new Response(JSON.stringify({ received: true, handled }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
