import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_ROLES = ['MASTER_ADMIN', 'WELFARE', 'CALL_CENTER'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: callerError } = await supabase.auth.getUser(token);

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { purpose, channel = 'SMS', audience = 'all active members', tone = 'warm and encouraging' } = await req.json();

    if (!purpose?.trim()) {
      return new Response(JSON.stringify({ error: 'Purpose is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const maxWords = channel === 'WHATSAPP' ? 120 : 80;
    const charHint = channel === 'SMS' ? 'Keep under 320 characters for SMS.' : 'WhatsApp allows slightly longer messages.';

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const prompt = `Write a bulk church message for Archeivers Fellowship (Christ Embassy Achievers PCF).

Purpose: ${purpose}
Audience: ${audience}
Tone: ${tone}
Channel: ${channel}

Rules:
- Write from the Welfare / church leadership perspective
- Christian, faith-filled, clear and actionable
- Use {name} as a placeholder where the member's name should appear (e.g. "Dear {name},")
- Under ${maxWords} words. ${charHint}
- No markdown, emojis, or subject lines
- Return ONLY the message body text`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';

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
