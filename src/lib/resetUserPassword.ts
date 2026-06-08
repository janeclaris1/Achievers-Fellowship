import { supabase } from './supabase';

export async function resetUserPassword(params: {
  user_id?: string;
  email?: string;
  new_password: string;
}): Promise<{ success: boolean; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { success: false, error: 'Not authenticated' };
  }

  const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(params),
  });

  const result = await resp.json();
  if (!resp.ok) {
    return { success: false, error: result.error || 'Failed to reset password' };
  }

  return { success: true };
}
