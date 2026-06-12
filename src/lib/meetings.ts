import { supabase } from './supabase';
import type { PublicChurchMeeting } from '../types';
import { getClientSessionId } from './meetingWebRTC';

export const MEETING_STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  LIVE: 'Live now',
  ENDED: 'Ended',
  CANCELLED: 'Cancelled',
} as const;

const PARTICIPANT_LOG_KEY = 'meeting_participant_log_id';

export function generateShareSlug(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export function buildMeetingShareUrl(shareSlug: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/join/${shareSlug}`;
}

export async function fetchPublicMeetingBySlug(
  slug: string
): Promise<{ data: PublicChurchMeeting | null; error: string | null }> {
  const { data, error } = await supabase.rpc('get_public_meeting_by_slug', { p_slug: slug });

  if (error) {
    return {
      data: null,
      error: error.message.includes('get_public_meeting_by_slug')
        ? 'Gatherings are not set up yet. Run migrations 029–030 in Supabase.'
        : error.message,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return { data: (row as PublicChurchMeeting) ?? null, error: null };
}

export async function logMeetingJoin(
  slug: string,
  displayName: string
): Promise<{ participantId: string | null; meetingId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('log_meeting_participant_join', {
    p_slug: slug,
    p_display_name: displayName.trim(),
    p_client_session: getClientSessionId(),
  });

  if (error) {
    return { participantId: null, meetingId: null, error: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const participantId = row?.participant_id as string | undefined;
  if (participantId) {
    sessionStorage.setItem(PARTICIPANT_LOG_KEY, participantId);
  }

  return {
    participantId: participantId ?? null,
    meetingId: (row?.meeting_id as string) ?? null,
    error: null,
  };
}

export async function logMeetingLeave(participantId?: string | null): Promise<void> {
  const id = participantId ?? sessionStorage.getItem(PARTICIPANT_LOG_KEY);
  if (!id) return;

  await supabase.rpc('log_meeting_participant_leave', { p_participant_id: id });
  sessionStorage.removeItem(PARTICIPANT_LOG_KEY);
}

export async function copyMeetingShareLink(shareSlug: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(buildMeetingShareUrl(shareSlug));
    return true;
  } catch {
    return false;
  }
}

export async function fetchMeetingParticipantCount(meetingId: string): Promise<number> {
  const { count } = await supabase
    .from('church_meeting_participants')
    .select('*', { count: 'exact', head: true })
    .eq('meeting_id', meetingId);
  return count ?? 0;
}
