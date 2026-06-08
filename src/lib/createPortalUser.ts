import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { UserRole } from '../types';

export interface CreatePortalUserInput {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  cell_group_id?: string | null;
}

export interface CreatePortalUserResult {
  userId: string;
  method: 'edge_function' | 'signup_fallback';
  emailConfirmationRequired?: boolean;
}

function isEdgeFunctionUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('404') ||
    message.includes('not found') ||
    message.includes('Failed to send a request to the Edge Function') ||
    message.includes('FunctionsRelayError') ||
    message.includes('FunctionsFetchError')
  );
}

async function createViaEdgeFunction(input: CreatePortalUserInput): Promise<CreatePortalUserResult> {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: {
      email: input.email.trim(),
      password: input.password,
      full_name: input.full_name.trim(),
      role: input.role,
      phone: input.phone?.trim() || null,
      cell_group_id: input.cell_group_id || null,
    },
  });

  if (error) {
    throw error;
  }

  const payload = data as { error?: string; hint?: string; userId?: string; success?: boolean };
  if (payload?.error) {
    throw new Error(payload.hint ? `${payload.error} ${payload.hint}` : payload.error);
  }
  if (!payload?.userId) {
    throw new Error('User creation failed — no user id returned.');
  }

  return { userId: payload.userId, method: 'edge_function' };
}

async function createViaSignupFallback(input: CreatePortalUserInput): Promise<CreatePortalUserResult> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase is not configured.');
  }

  // Separate client so the admin session is not replaced by the new signup session
  const signupClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await signupClient.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        full_name: input.full_name.trim(),
        role: input.role,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user?.id) {
    throw new Error('User creation failed — check Supabase Auth settings and try again.');
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: data.user.id,
      full_name: input.full_name.trim(),
      role: input.role,
      phone: input.phone?.trim() || null,
      cell_group_id: input.cell_group_id || null,
      is_active: true,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    throw new Error(
      `Account created but profile save failed: ${profileError.message}. Run migration 005 in Supabase SQL Editor.`
    );
  }

  return {
    userId: data.user.id,
    method: 'signup_fallback',
    emailConfirmationRequired: !data.session,
  };
}

export async function createPortalUser(input: CreatePortalUserInput): Promise<CreatePortalUserResult> {
  try {
    return await createViaEdgeFunction(input);
  } catch (error) {
    if (!isEdgeFunctionUnavailable(error)) {
      throw error instanceof Error ? error : new Error(String(error));
    }
    return createViaSignupFallback(input);
  }
}
