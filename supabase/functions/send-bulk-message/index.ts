import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!;
const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_ROLES = ['MASTER_ADMIN', 'WELFARE'];
const SEND_DELAY_MS = 150;

type BulkChannel = 'SMS' | 'WHATSAPP' | 'BOTH';

interface MemberRow {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  phone: string;
}

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('0')) return `+237${trimmed.slice(1)}`;
  return `+${trimmed.replace(/\D/g, '')}`;
}

function memberDisplayName(member: MemberRow): string {
  const prefix = member.gender === 'FEMALE' ? 'Sis' : 'Bro';
  return `${prefix} ${member.first_name} ${member.last_name}`;
}

function personalizeMessage(template: string, member: MemberRow): string {
  const name = memberDisplayName(member);
  return template
    .replaceAll('{name}', name)
    .replaceAll('{first_name}', member.first_name)
    .replaceAll('{last_name}', member.last_name);
}

async function sendTwilioMessage(
  to: string,
  body: string,
  channel: 'SMS' | 'WHATSAPP'
): Promise<{ ok: boolean; error?: string }> {
  const normalized = normalizePhone(to);
  const isWhatsApp = channel === 'WHATSAPP';

  if (isWhatsApp && !TWILIO_WHATSAPP_NUMBER) {
    return { ok: false, error: 'TWILIO_WHATSAPP_NUMBER is not configured' };
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const params = new URLSearchParams({
    To: isWhatsApp ? `whatsapp:${normalized}` : normalized,
    From: isWhatsApp ? `whatsapp:${TWILIO_WHATSAPP_NUMBER}` : TWILIO_PHONE_NUMBER,
    Body: body,
  });

  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const resp = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    return { ok: false, error: data.message || `Twilio error ${resp.status}` };
  }

  return { ok: true };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

    const {
      message,
      channel = 'SMS',
      filters = {},
    }: {
      message: string;
      channel: BulkChannel;
      filters?: { status?: string; cell_group_id?: string | null };
    } = await req.json();

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['SMS', 'WHATSAPP', 'BOTH'].includes(channel)) {
      return new Response(JSON.stringify({ error: 'Invalid channel' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let query = supabase
      .from('members')
      .select('id, first_name, last_name, gender, phone')
      .not('phone', 'is', null)
      .neq('phone', '');

    const status = filters.status || 'ACTIVE';
    if (status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (filters.cell_group_id) {
      query = query.eq('cell_group_id', filters.cell_group_id);
    }

    const { data: members, error: membersError } = await query;

    if (membersError) {
      return new Response(JSON.stringify({ error: membersError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const recipients = (members || []) as MemberRow[];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const member of recipients) {
      if (!member.phone?.trim()) {
        skippedCount += 1;
        continue;
      }

      const body = personalizeMessage(message.trim(), member);
      const channelsToSend: Array<'SMS' | 'WHATSAPP'> =
        channel === 'BOTH' ? ['SMS', 'WHATSAPP'] : [channel];

      let memberOk = true;

      for (const ch of channelsToSend) {
        const result = await sendTwilioMessage(member.phone, body, ch);
        if (!result.ok) {
          memberOk = false;
          if (errors.length < 5) {
            errors.push(`${memberDisplayName(member)} (${ch}): ${result.error}`);
          }
        }
        await sleep(SEND_DELAY_MS);
      }

      if (memberOk) {
        successCount += 1;
      } else {
        failedCount += 1;
      }
    }

    const logPayload = {
      sent_by: caller.id,
      channel,
      message: message.trim(),
      audience_filter: filters,
      recipient_count: recipients.length,
      success_count: successCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
    };

    await supabase.from('bulk_message_logs').insert(logPayload);

    return new Response(
      JSON.stringify({
        success: true,
        recipient_count: recipients.length,
        success_count: successCount,
        failed_count: failedCount,
        skipped_count: skippedCount,
        errors: errors.length ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to send bulk message', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
