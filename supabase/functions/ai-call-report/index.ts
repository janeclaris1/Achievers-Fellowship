import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { prefix, name, date, duration, notes } = await req.json();

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const prompt = `Generate a structured pastoral call report for Archeivers Fellowship.
Called: ${prefix} ${name} | Date: ${date} | Duration: ${duration}
Caller notes: "${notes}"

Generate:
- Call Summary
- Key Points Discussed
- Member's Current State
- Action Items
- Follow-up Recommendation

Under 200 words. Formal church record tone. Return ONLY the report text.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
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
