import { supabase } from './supabase';
import type { UserRole } from '../types';

const functionsUrl = import.meta.env.VITE_SUPABASE_URL;

export function canViewWelfarePartnershipAmounts(role: UserRole | null | undefined): boolean {
  return role === 'MASTER_ADMIN' || role === 'WELFARE';
}

export async function initiateWelfarePartnership(params: {
  amount: number;
  partner_note?: string;
}): Promise<{ authorization_url?: string; payment_reference?: string; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { error: 'Please sign in to partner with the Welfare Department.' };
  }

  const resp = await fetch(`${functionsUrl}/functions/v1/initiate-welfare-partnership`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(params),
  });

  const result = await resp.json();
  if (!resp.ok) {
    return { error: result.error || 'Failed to start payment' };
  }

  return {
    authorization_url: result.authorization_url,
    payment_reference: result.payment_reference,
  };
}

export async function verifyWelfarePartnership(reference: string) {
  const resp = await fetch(`${functionsUrl}/functions/v1/verify-welfare-partnership`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference }),
  });

  const result = await resp.json();
  return result as {
    success: boolean;
    message?: string;
    error?: string;
    partnership?: { amount: number; currency: string; status: string };
  };
}

export async function fetchMyWelfarePartnerships(limit = 5) {
  const { data, error } = await supabase
    .from('welfare_partnerships')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data ?? [], error };
}

export async function fetchAllWelfarePartnerships(limit = 50) {
  const { data, error } = await supabase
    .from('welfare_partnerships')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data ?? [], error };
}
