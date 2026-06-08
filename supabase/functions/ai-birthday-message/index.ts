import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { prefix, firstName, lastName, age } = await req.json();

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const prompt = `Generate a warm, Christian, personalized birthday message for a church member named ${prefix} ${firstName} ${lastName} who is turning ${age} years old today. The message is from the Welfare Department of Archeivers Fellowship.

Keep it encouraging, faith-filled, and under 100 words. Do not use generic phrases. Make it heartfelt and specific to the person turning ${age}.

Return ONLY the birthday message text, no extra formatting or explanation.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    return new Response(
      JSON.stringify({ message: text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to generate message', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
