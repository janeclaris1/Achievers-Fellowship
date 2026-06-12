import { supabase } from './supabase';

const functionsUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function getFunctionsBaseUrl(): string {
  return `${functionsUrl}/functions/v1`;
}

/** Headers for edge functions that require a signed-in user. */
export async function getAuthFunctionHeaders(): Promise<Record<string, string> | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  return {
    'Content-Type': 'application/json',
    apikey: anonKey,
    Authorization: `Bearer ${session.access_token}`,
  };
}

/** Headers for public callback edge functions (verify_jwt = false). */
export function getPublicFunctionHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
}
