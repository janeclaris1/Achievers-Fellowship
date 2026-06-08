import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function markPartnership(
  supabase: ReturnType<typeof createClient>,
  reference: string,
  paystackReference: string | null,
  status: 'COMPLETED' | 'FAILED'
) {
  const { data, error } = await supabase
    .from('welfare_partnerships')
    .update({
      status,
      paystack_reference: paystackReference,
      paid_at: status === 'COMPLETED' ? new Date().toISOString() : null,
    })
    .eq('payment_reference', reference)
    .select('*')
    .single();

  return { data, error };
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

    const verifyResp = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    const verifyData = await verifyResp.json();
    const successful = verifyData?.data?.status === 'success';

    const { data, error } = await markPartnership(
      supabase,
      reference,
      verifyData?.data?.reference ?? null,
      successful ? 'COMPLETED' : 'FAILED'
    );

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: successful,
        partnership: data,
        message: successful ? 'Partnership recorded successfully' : 'Payment was not successful',
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
