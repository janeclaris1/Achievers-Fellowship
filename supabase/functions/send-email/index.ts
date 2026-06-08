const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const CHURCH_EMAIL = Deno.env.get('CHURCH_EMAIL') || 'archeivers@gmail.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { to, subject, html, text } = await req.json();

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Archeivers Fellowship <${CHURCH_EMAIL}>`,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const data = await resp.json();

    return new Response(
      JSON.stringify({ success: resp.ok, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
