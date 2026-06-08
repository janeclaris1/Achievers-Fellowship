import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { title, type, date, notes } = await req.json();

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const prompt = `Draft a welfare program completion report for Archeivers Fellowship.
Program: ${title} | Type: ${type} | Date: ${date}
Activity notes: "${notes}"

Write a formal report suitable for church records. Under 300 words.
Include: Program Overview, Activities Conducted, Members Impacted, Observations, Recommendations.
Return ONLY the report text.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
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
