import { supabase } from './supabase';
import type { FollowUp, FollowUpStatus, Member, OutreachChannel } from '../types';

const functionsUrl = import.meta.env.VITE_SUPABASE_URL;

export const OUTREACH_ACTIVITY_SELECT =
  '*, members(id, first_name, last_name, gender, phone, cell_groups!members_cell_group_id_fkey(name)), profiles!follow_ups_logged_by_fkey(full_name)';

export async function fetchActiveMembers(search = '') {
  let query = supabase
    .from('members')
    .select('id, first_name, last_name, gender, phone, status, job_title, photo_url, cell_groups!members_cell_group_id_fkey(name)')
    .eq('status', 'ACTIVE')
    .order('last_name', { ascending: true })
    .limit(200);

  const term = search.trim();
  if (term.length >= 2) {
    query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  const { data, error } = await query;
  return { data: (data ?? []) as unknown as Member[], error };
}

export async function initiateMemberCall(phone: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { error: 'Please sign in again.' };
  }

  const resp = await fetch(`${functionsUrl}/functions/v1/make-call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ to: phone }),
  });

  const result = await resp.json();
  if (!resp.ok) {
    return { error: result.error || result.details || 'Failed to start call' };
  }

  return { sid: result.sid as string | undefined };
}

export async function sendMemberMessage(
  phone: string,
  message: string,
  channel: 'SMS' | 'WHATSAPP'
) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { error: 'Please sign in again.' };
  }

  const resp = await fetch(`${functionsUrl}/functions/v1/send-member-message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ to: phone, message, channel }),
  });

  const result = await resp.json();
  if (!resp.ok) {
    return { error: result.error || 'Failed to send message' };
  }

  return { sid: result.sid as string | undefined };
}

export async function logOutreachActivity(params: {
  memberId: string;
  loggedBy: string;
  channel: OutreachChannel;
  status: FollowUpStatus;
  notes?: string;
  messageBody?: string;
  twilioSid?: string;
  generateAiReport?: boolean;
  memberName?: string;
  memberGender?: string;
}) {
  let aiReport: string | null = null;

  if (params.generateAiReport && params.notes?.trim() && params.channel === 'PHONE') {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      try {
        const prefix = params.memberGender === 'FEMALE' ? 'Sis' : 'Bro';
        const resp = await fetch(`${functionsUrl}/functions/v1/ai-call-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prefix,
            name: params.memberName || 'Member',
            date: new Date().toLocaleDateString(),
            notes: params.notes,
            duration: '—',
          }),
        });
        const result = await resp.json();
        aiReport = result.report || null;
      } catch {
        aiReport = null;
      }
    }
  }

  const type = params.channel === 'PHONE' ? 'CALL' : 'MESSAGE';

  const { data, error } = await supabase
    .from('follow_ups')
    .insert({
      member_id: params.memberId,
      logged_by: params.loggedBy,
      type,
      channel: params.channel,
      status: params.status,
      notes: params.notes?.trim() || null,
      message_body: params.messageBody?.trim() || null,
      twilio_sid: params.twilioSid || null,
      ai_report: aiReport,
      completed_at: new Date().toISOString(),
    })
    .select(OUTREACH_ACTIVITY_SELECT)
    .single();

  if (error) {
    const missingColumn = error.message.includes('channel') || error.message.includes('message_body');
    if (missingColumn) {
      const fallback = await supabase
        .from('follow_ups')
        .insert({
          member_id: params.memberId,
          logged_by: params.loggedBy,
          type,
          status: params.status,
          notes: [params.notes, params.messageBody ? `[${params.channel}] ${params.messageBody}` : '']
            .filter(Boolean)
            .join('\n\n')
            .trim() || null,
          ai_report: aiReport,
          completed_at: new Date().toISOString(),
        })
        .select(OUTREACH_ACTIVITY_SELECT)
        .single();

      if (fallback.error) return { error: fallback.error.message };
      return { data: fallback.data as FollowUp };
    }
    return { error: error.message };
  }

  return { data: data as FollowUp };
}

export async function fetchOutreachActivities(limit = 100) {
  const { data, error } = await supabase
    .from('follow_ups')
    .select(OUTREACH_ACTIVITY_SELECT)
    .in('type', ['CALL', 'MESSAGE'])
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: (data ?? []) as FollowUp[], error };
}

export function channelLabel(channel?: OutreachChannel | null): string {
  if (channel === 'SMS') return 'SMS';
  if (channel === 'WHATSAPP') return 'WhatsApp';
  if (channel === 'PHONE') return 'Phone call';
  return 'Activity';
}
