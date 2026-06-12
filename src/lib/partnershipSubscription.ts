import { supabase } from './supabase';
import { getAuthFunctionHeaders, getFunctionsBaseUrl, getPublicFunctionHeaders } from './supabaseFunctions';
import type {
  Gender,
  PartnershipGoalPeriod,
  PartnershipSubscription,
  PartnershipSubscriptionCharge,
  UserRole,
} from '../types';

const functionsUrl = getFunctionsBaseUrl();

export function canManagePartnershipSubscriptions(role: UserRole | null | undefined): boolean {
  return role === 'MASTER_ADMIN' || role === 'WELFARE';
}

export async function createPartnershipSubscription(params: {
  daily_amount: number;
  partnership_arm?: string;
  goal_amount?: number;
  goal_period?: PartnershipGoalPeriod;
}): Promise<{ authorization_url?: string; payment_reference?: string; error?: string }> {
  const headers = await getAuthFunctionHeaders();
  if (!headers) {
    return { error: 'Please sign in to start a daily partnership subscription.' };
  }

  const resp = await fetch(`${functionsUrl}/create-partnership-subscription`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  const result = await resp.json();
  if (!resp.ok) {
    return { error: result.error || 'Failed to start subscription setup' };
  }

  return {
    authorization_url: result.authorization_url,
    payment_reference: result.payment_reference,
  };
}

export async function verifyPartnershipSubscription(reference: string) {
  const resp = await fetch(`${functionsUrl}/verify-partnership-subscription`, {
    method: 'POST',
    headers: getPublicFunctionHeaders(),
    body: JSON.stringify({ reference }),
  });

  const result = await resp.json();
  return result as {
    success: boolean;
    message?: string;
    error?: string;
    daily_amount?: number;
    subscription?: PartnershipSubscription;
  };
}

export async function managePartnershipSubscription(params: {
  subscription_id: string;
  action: 'pause' | 'resume' | 'cancel' | 'update_goal' | 'clear_goal';
  goal_amount?: number;
  goal_period?: PartnershipGoalPeriod;
}): Promise<{ subscription?: PartnershipSubscription; error?: string }> {
  const headers = await getAuthFunctionHeaders();
  if (!headers) {
    return { error: 'Please sign in.' };
  }

  const resp = await fetch(`${functionsUrl}/manage-partnership-subscription`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  const result = await resp.json();
  if (!resp.ok) {
    return { error: result.error || 'Action failed' };
  }

  return { subscription: result.subscription };
}

export async function fetchMyMemberGender(
  email?: string | null,
  phone?: string | null
): Promise<Gender | null> {
  if (email?.trim()) {
    const { data } = await supabase
      .from('members')
      .select('gender')
      .ilike('email', email.trim())
      .limit(1)
      .maybeSingle();
    if (data?.gender) return data.gender as Gender;
  }

  if (phone?.trim()) {
    const { data } = await supabase
      .from('members')
      .select('gender')
      .eq('phone', phone.trim())
      .limit(1)
      .maybeSingle();
    if (data?.gender) return data.gender as Gender;
  }

  return null;
}

export async function fetchMyPartnershipSubscription() {
  const { data, error } = await supabase
    .from('partnership_subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return { data: data as PartnershipSubscription | null, error };
}

export async function fetchMySubscriptionCharges(subscriptionId: string, limit = 20) {
  const { data, error } = await supabase
    .from('partnership_subscription_charges')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: (data ?? []) as PartnershipSubscriptionCharge[], error };
}

export async function fetchAllPartnershipSubscriptions(limit = 100) {
  const { data, error } = await supabase
    .from('partnership_subscriptions')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: (data ?? []) as PartnershipSubscription[], error };
}

export async function fetchSubscriptionCharges(subscriptionId: string, limit = 30) {
  const { data, error } = await supabase
    .from('partnership_subscription_charges')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: (data ?? []) as PartnershipSubscriptionCharge[], error };
}

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  PENDING_SETUP: 'Setup pending',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
};
