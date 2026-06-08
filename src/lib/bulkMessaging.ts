import { supabase } from './supabase';
import type { BulkMessageChannel } from '../types';

const functionsUrl = import.meta.env.VITE_SUPABASE_URL;

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export interface BulkMessageFilters {
  status?: string;
  cell_group_id?: string | null;
}

export interface GenerateBulkMessageParams {
  purpose: string;
  channel: BulkMessageChannel;
  audience?: string;
  tone?: string;
}

export interface SendBulkMessageParams {
  message: string;
  channel: BulkMessageChannel;
  filters?: BulkMessageFilters;
}

export interface SendBulkMessageResult {
  success: boolean;
  recipient_count: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  errors?: string[];
  error?: string;
}

export async function generateBulkMessage(
  params: GenerateBulkMessageParams
): Promise<{ message?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { error: 'Not authenticated' };

  const resp = await fetch(`${functionsUrl}/functions/v1/ai-bulk-message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const result = await resp.json();
  if (!resp.ok) return { error: result.error || 'Failed to generate message' };
  return { message: result.message };
}

export async function sendBulkMessage(
  params: SendBulkMessageParams
): Promise<SendBulkMessageResult> {
  const token = await getAccessToken();
  if (!token) return { success: false, recipient_count: 0, success_count: 0, failed_count: 0, skipped_count: 0, error: 'Not authenticated' };

  const resp = await fetch(`${functionsUrl}/functions/v1/send-bulk-message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const result = await resp.json();
  if (!resp.ok) {
    return {
      success: false,
      recipient_count: 0,
      success_count: 0,
      failed_count: 0,
      skipped_count: 0,
      error: result.error || 'Failed to send messages',
    };
  }

  return { success: true, ...result };
}

export async function fetchBulkMessageLogs(limit = 20) {
  const { data, error } = await supabase
    .from('bulk_message_logs')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data ?? [], error };
}

export async function countBulkRecipients(filters: BulkMessageFilters): Promise<number> {
  let query = supabase
    .from('members')
    .select('id', { count: 'exact', head: true })
    .not('phone', 'is', null)
    .neq('phone', '');

  const status = filters.status || 'ACTIVE';
  if (status !== 'ALL') {
    query = query.eq('status', status);
  }

  if (filters.cell_group_id) {
    query = query.eq('cell_group_id', filters.cell_group_id);
  }

  const { count } = await query;
  return count ?? 0;
}
