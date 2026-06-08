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
      return new Response(JSON.stringify({ error: 'Paystack is not configured. Set PAYSTACK_SECRET_KEY in Supabase secrets.' }), {
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

    const { amount, partner_note, partnership_arm } = await req.json();
    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount < 1) {
      return new Response(JSON.stringify({ error: 'Enter a valid amount (minimum 1 GHS).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentReference = `welfare-${crypto.randomUUID()}`;

    const { error: insertError } = await supabase.from('welfare_partnerships').insert({
      profile_id: user.id,
      amount: parsedAmount,
      currency: 'GHS',
      status: 'PENDING',
      payment_reference: paymentReference,
      partner_note: partner_note?.trim() || null,
      partnership_arm: partnership_arm?.trim() || null,
    });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const email = user.email || 'partner@achieverspcf.org';
    const amountInPesewas = Math.round(parsedAmount * 100);

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
        callback_url: `${APP_URL}/partnership/complete?reference=${paymentReference}`,
        metadata: {
          profile_id: user.id,
          type: 'welfare_partnership',
          partnership_arm: partnership_arm?.trim() || null,
        },
      }),
    });

    const paystackData = await paystackResp.json();

    if (!paystackResp.ok || !paystackData.data?.authorization_url) {
      await supabase
        .from('welfare_partnerships')
        .update({ status: 'FAILED' })
        .eq('payment_reference', paymentReference);

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
