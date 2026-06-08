import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { notes, type, status, prefix, name } = await req.json();

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const prompt = `You are a church follow-up coordinator assistant for Archeivers Fellowship.
Based on these follow-up notes: "${notes}"
Contact type: ${type} | Status: ${status} | Member: ${prefix} ${name}

Generate a concise professional follow-up report with:
1. Summary of contact
2. Member's apparent spiritual/emotional state  
3. Recommended next steps

Keep it under 150 words. Professional pastoral tone. Return ONLY the report text.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const report = message.content[0].type === 'text' ? message.content[0].text : '';

    return new Response(
      JSON.stringify({ report }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to generate report', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
